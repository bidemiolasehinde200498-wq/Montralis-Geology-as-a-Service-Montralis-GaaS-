from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def encrypted_report(title: str, report_type: str, filters: dict, records: list[dict], password: str) -> bytes:
    """Compile persisted records into an AES-256 encrypted PDF returned to the caller."""
    source = BytesIO()
    styles = getSampleStyleSheet()
    story = [
        Paragraph(escape(title), styles["Title"]),
        Paragraph(f"Montralis GaaS · {escape(report_type.title())} report", styles["Heading2"]),
        Paragraph(f"Generated {datetime.now(timezone.utc).isoformat()}", styles["Normal"]),
        Spacer(1, 6 * mm),
        Paragraph("Scope and filters", styles["Heading2"]),
    ]
    filter_rows = [[escape(str(key)), escape(str(value))] for key, value in filters.items() if value]
    story.append(Table([["Filter", "Value"], *filter_rows] if filter_rows else [["Filter", "Value"], ["Scope", "All records available to this account"]], colWidths=[48 * mm, 112 * mm]))
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("Results", styles["Heading2"]))

    if records:
        keys = list(records[0].keys())
        rows = [[escape(str(key).replace("_", " ").title()) for key in keys]]
        for record in records:
            rows.append([escape(str(record.get(key, "")))[:240] for key in keys])
        table = Table(rows, repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dcebe6")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#173c33")),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#b7c8c2")),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f7f6")]),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("No matching records were found for the selected scope.", styles["Normal"]))

    story.extend([
        Spacer(1, 8 * mm),
        Paragraph("Limitations", styles["Heading2"]),
        Paragraph(
            "This report summarizes platform records and does not constitute a mineral resource/reserve estimate, "
            "engineering certification, geotechnical safety determination, or regulatory approval. Verify source data "
            "and measurements with qualified professionals before operational decisions.",
            styles["BodyText"],
        ),
    ])
    SimpleDocTemplate(source, pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm).build(story)

    reader = PdfReader(source)
    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    writer.add_metadata({"/Title": title, "/Producer": "Montralis GaaS Report Engine"})
    writer.encrypt(user_password=password, owner_password=password, algorithm="AES-256")
    output = BytesIO()
    writer.write(output)
    return output.getvalue()
