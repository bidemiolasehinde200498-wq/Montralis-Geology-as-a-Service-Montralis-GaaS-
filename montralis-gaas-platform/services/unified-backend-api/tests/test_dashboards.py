import base64
import hashlib
import hmac
import json
import os
import sys
import time
from pathlib import Path

import pytest

os.environ["MONTRALIS_JWT_SECRET"] = "t" * 40
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _cookie(email: str, role: str, portal: str = "client") -> str:
    header = _b64(b'{"alg":"HS256","typ":"JWT"}')
    body = _b64(json.dumps({"email": email, "role": role, "portal": portal, "exp": time.time() + 600}).encode())
    sig = _b64(hmac.new(b"t" * 40, f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("MONTRALIS_DB_PATH", str(tmp_path / "vault.db"))
    import main
    import portal_api
    monkeypatch.setattr(main, "DB_PATH", str(tmp_path / "vault.db"))
    monkeypatch.setattr(portal_api, "DB_PATH", str(tmp_path / "vault.db"))
    from fastapi.testclient import TestClient
    test_client = TestClient(main.app)
    test_client.cookies.set("mtrl_session", _cookie("coop@test.dev", "MINING_COOPERATIVE"))
    return test_client


def post(client, collection, payload):
    response = client.post(f"/api/v1/portal/{collection}", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def dam(ref="DAM-1", lat=-19.0, lng=29.1):
    return {"asset_reference": ref, "asset_name": f"Dam {ref}", "asset_type": "Tailings dam", "operator": "Op",
            "country": "Zimbabwe", "start_latitude": lat, "start_longitude": lng, "criticality": "High"}


def obs(ref, mm, day):
    return {"asset_reference": ref, "acquisition_date": day, "displacement_mm": mm, "velocity_mm_per_year": mm * 4,
            "coherence": 0.8, "scene_reference": "scene", "source": "Manual QA"}


def test_requires_auth():
    import main
    from fastapi.testclient import TestClient
    assert TestClient(main.app).get("/api/v1/dashboards/tailings-dam").status_code == 401
    assert TestClient(main.app).get("/api/v1/portal/health").json()["status"] == "ok"


def test_tailings_default_three_mm_limit(client):
    post(client, "linear-assets", dam())
    assert client.get("/api/v1/dashboards/tailings-dam").json()["dams"][0]["status"] == "No data"
    post(client, "insar-observations", obs("DAM-1", 2.9, "2025-01-01"))
    body = client.get("/api/v1/dashboards/tailings-dam").json()
    assert body["dams"][0]["threshold_mm"] == 3.0 and body["dams"][0]["status"] == "Normal"
    assert body["alerts"] == []
    post(client, "insar-observations", obs("DAM-1", 3.0, "2025-02-01"))
    body = client.get("/api/v1/dashboards/tailings-dam").json()
    assert body["dams"][0]["status"] == "Warning" and body["alerts"][0]["severity"] == "Warning"
    post(client, "insar-observations", obs("DAM-1", -6.5, "2025-03-01"))
    body = client.get("/api/v1/dashboards/tailings-dam").json()
    assert body["dams"][0]["status"] == "Critical" and body["alerts"][0]["severity"] == "Critical"
    assert body["dams"][0]["open_alerts"] == 2


def test_threshold_rule_overrides_default(client):
    post(client, "linear-assets", dam())
    post(client, "insar-thresholds", {"asset_reference": "DAM-1", "threshold_mm": 1.0, "enabled": True})
    body = client.get("/api/v1/dashboards/tailings-dam").json()
    assert body["dams"][0]["threshold_mm"] == 1.0 and body["dams"][0]["threshold_source"] == "asset rule"


def test_utility_overlays(client):
    post(client, "linear-assets", {**dam("PL-1", -19.0, 29.0), "asset_type": "Pipeline", "end_latitude": -19.0, "end_longitude": 29.2})
    post(client, "linear-assets", {**dam("PL-2", 10.0, 10.0), "asset_type": "Pipeline", "end_latitude": 10.1, "end_longitude": 10.1})
    post(client, "hazard-zones", {"zone_name": "Slide A", "hazard_type": "Landslide hazard zone", "susceptibility": "High",
                                  "points": [[-19.05, 29.05], [-19.05, 29.15], [-18.95, 29.15], [-18.95, 29.05]], "source": "own survey"})
    post(client, "hazard-zones", {"zone_name": "Thaw", "hazard_type": "Permafrost thaw line", "susceptibility": "Moderate",
                                  "points": [[-19.5, 29.0], [-19.5, 29.3]], "buffer_km": 1, "source": "own survey"})
    post(client, "insar-observations", obs("PL-1", 2.0, "2025-01-01"))
    body = client.get("/api/v1/dashboards/utility-grid").json()
    by_ref = {v["asset"]["asset_reference"]: v for v in body["vectors"]}
    assert by_ref["PL-1"]["hazard_class"] == "High"
    assert [o["zone_name"] for o in by_ref["PL-1"]["hazard_overlaps"]] == ["Slide A"]
    assert by_ref["PL-1"]["motion_index"] == pytest.approx(33.3)
    assert by_ref["PL-2"]["hazard_overlaps"] == [] and by_ref["PL-2"]["motion_index"] is None
    assert not any(v["asset"]["asset_type"] == "Tailings dam" for v in body["vectors"])


def test_hazard_zone_validation(client):
    bad = {"zone_name": "x", "hazard_type": "Landslide hazard zone", "points": [[0, 0], [1, 1]], "source": "s"}
    assert client.post("/api/v1/portal/hazard-zones", json=bad).status_code == 422
    bad = {"zone_name": "x", "hazard_type": "Permafrost thaw line", "points": [[95, 0], [1, 1]], "source": "s"}
    assert client.post("/api/v1/portal/hazard-zones", json=bad).status_code == 422


def layer(kind, name, bounds=(29.0, -19.2, 29.2, -19.0)):
    return {"layer_name": name, "layer_type": kind, "west": bounds[0], "south": bounds[1], "east": bounds[2], "north": bounds[3],
            "units": "mGal" if kind == "gravity" else "nT", "provenance": "test survey",
            "values": [[float(r + c) for c in range(6)] for r in range(6)]}


def test_exploration_mesh_zone_and_fixed_fee_report(client):
    grav = post(client, "geophysics-layers", layer("gravity", "G"))
    mag = post(client, "geophysics-layers", layer("magnetic", "M"))
    post(client, "fault-lines", {"fault_name": "F1", "fault_type": "Normal", "points": [[-19.1, 29.0], [-19.0, 29.1]], "source": "interp"})
    body = client.get("/api/v1/dashboards/exploration").json()
    assert len(body["geophysics_layers"]) == 2 and body["fault_lines"][0]["length_km"] > 10
    assert 0 <= body["fault_lines"][0]["strike_deg"] < 180
    mesh = client.post("/api/v1/dashboards/exploration/mesh", json={"layer_ids": [grav["id"], mag["id"]]})
    assert mesh.status_code == 200 and mesh.json()["valid_vertex_count"] == 36
    assert client.post("/api/v1/dashboards/exploration/mesh", json={"layer_ids": ["nope"]}).status_code == 404
    zone = client.get("/api/v1/dashboards/exploration/zone", params={"latitude": 0, "longitude": 0}).json()["bounds"]
    side_km = (zone[2] - zone[0]) * 111.32
    assert side_km == pytest.approx(36.0, abs=0.1)
    report = client.post("/api/v1/analytics/reports", json={
        "report_type": "structural", "title": "Zone report", "password": "correct-horse-1",
        "zone_bounds": [29.0, -19.2, 29.2, -19.0], "fee_quote_gbp": 1})
    assert report.status_code == 200 and report.content.startswith(b"%PDF")
    import main
    conn = main._connect()
    try:
        assert conn.execute("SELECT fee_quote_gbp FROM report_jobs").fetchone()[0] == main.STRUCTURAL_REPORT_FEE_GBP
    finally:
        conn.close()
    no_bounds = client.post("/api/v1/analytics/reports", json={"report_type": "structural", "title": "t", "password": "correct-horse-1"})
    assert no_bounds.status_code == 422


def test_role_scoping(client):
    post(client, "fault-lines", {"fault_name": "F1", "points": [[0, 0], [1, 1]], "source": "x"})
    client.cookies.set("mtrl_session", _cookie("other@test.dev", "ENTERPRISE_TRADER"))
    assert client.get("/api/v1/dashboards/exploration").json()["fault_lines"] == []
    client.cookies.set("mtrl_session", _cookie("min@test.dev", "GOVERNMENT_MINISTER"))
    assert client.get("/api/v1/dashboards/exploration").status_code == 403


def test_portal_crud_singletons_and_owner_scope(client):
    setting = {"organization_name": "Mine Co", "registered_country": "Zambia"}
    first = post(client, "organization-settings", setting)
    second = post(client, "organization-settings", {**setting, "organization_name": "Updated Co"})
    rows = client.get("/api/v1/portal/organization-settings").json()
    assert len(rows) == 1 and rows[0]["id"] == second["id"]
    post(client, "fault-lines", {"fault_name": "Private trace", "points": [[0, 0], [1, 1]], "source": "survey"})
    client.cookies.set("mtrl_session", _cookie("trader@test.dev", "ENTERPRISE_TRADER"))
    assert client.get("/api/v1/portal/organization-settings").json() == []
    assert client.get("/api/v1/portal/fault-lines").json() == []
    assert client.get("/api/v1/portal/no-such-collection").status_code == 404


def test_billing_endpoints_calculate_from_records(client):
    post(client, "cooperative-payouts", {"weigh_ticket": "WT-1", "mineral": "Copper", "mine_site": "Site A", "weight_tonnes": 2, "payout_rate_gbp_per_tonne": 530})
    result = client.get("/api/v1/billing/cooperative-payouts").json()
    assert result["payouts"][0]["calculated_payout_gbp"] == 1060
    assert client.get("/api/v1/billing/royalties").status_code == 403
    client.cookies.set("mtrl_session", _cookie("auditor@test.dev", "RESOURCE_AUDITOR"))
    post(client, "customs-export", {"shipment_reference": "S-1", "mineral": "Copper", "exporter": "Mine Co", "country": "Zambia", "origin": "Mine", "destination": "Port", "raw_weight_tonnes": 1, "purity_percent": 90, "declared_value_gbp": 10000})
    royalty = client.get("/api/v1/billing/royalties").json()
    assert royalty["total_due_gbp"] == 150 and royalty["shipments"][0]["royalty_due_gbp"] == 150


def test_staff_control_plane_and_notifications_respect_access(client):
    post(client, "fault-lines", {"fault_name": "Private trace", "points": [[0, 0], [1, 1]], "source": "survey"})
    post(client, "drone-dispatch", {"job_reference": "JOB-1", "target_name": "Target A", "latitude": -10, "longitude": 20, "contractor": "Pilot A"})
    client.cookies.set("mtrl_session", _cookie("other-coop@test.dev", "MINING_COOPERATIVE"))
    assert client.get("/api/v1/portal/notifications").json() == []
    assert client.get("/api/v1/admin/control-plane").status_code == 403
    client.cookies.set("mtrl_session", _cookie("engineer@test.dev", "SYSTEM_ENGINEER", "staff"))
    assert client.get("/api/v1/admin/control-plane").status_code == 200
    assert client.get("/api/v1/admin/overview").status_code == 200


def test_legacy_risk_endpoints_require_recorded_observations(client):
    post(client, "linear-assets", dam())
    request = {"dam_id": "DAM-1", "dam_name": "Dam DAM-1", "country": "Zimbabwe"}
    assert client.post("/api/v1/compliance/dam-verify", json=request).status_code == 422
    post(client, "insar-observations", obs("DAM-1", 6.5, "2025-03-01"))
    result = client.post("/api/v1/compliance/dam-verify", json=request).json()
    assert result["metrics"]["severity"] == "Critical"
    assert result["metrics"]["advisory_only"] is True
    assert result["metrics"]["automated_actuation"] is False


def test_universal_scan_persists_discovery(client, monkeypatch):
    import main
    from datetime import datetime, timezone

    result = {
        "id": "scan-1", "country": "Zambia", "mineral_target": "Copper", "latitude": -13.1, "longitude": 28.2,
        "spectral_confidence": 88.5, "estimated_tonnage": 1200.0, "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    monkeypatch.setattr(main.prospector.UniversalMontralisGaaS, "execute_global_scan", lambda *args: result)
    response = client.post("/api/v1/gaas/universal-scan", json={"country": "Zambia", "target_mineral": "COPPER", "data_source": "simulated"})
    assert response.status_code == 200
    assert client.get("/api/v1/gaas/discoveries").json()[0]["id"] == "scan-1"
    assert client.get("/api/v1/dashboards/exploration").json()["discoveries"][0]["id"] == "scan-1"
