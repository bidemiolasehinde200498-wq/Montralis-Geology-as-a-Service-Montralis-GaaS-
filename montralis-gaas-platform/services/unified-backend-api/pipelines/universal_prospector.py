import ast
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

import satellite
import ee_source

_DATA = Path(__file__).resolve().parents[1] / "data_inputs"
COUNTRIES = {c["name"].upper(): c for c in json.loads((_DATA / "countries.json").read_text(encoding="utf-8"))}
MINING_AREAS = {
    k.upper(): v for k, v in json.loads((_DATA / "mining_areas.json").read_text(encoding="utf-8")).items()
}
MRDS_DATA = json.loads((_DATA / "mrds_mapped_areas.json").read_text(encoding="utf-8"))
MRDS_AREAS = {k.upper(): v for k, v in MRDS_DATA["areas_by_country"].items()}
for _c in COUNTRIES.values():
    _c["areas"] = MINING_AREAS.get(_c["name"].upper(), []) + MRDS_AREAS.get(_c["name"].upper(), [])
    if not _c["areas"]:
        _c["areas"] = [{
            "name": "National reference only",
            "lat": _c["lat"],
            "lng": _c["lng"],
            "minerals": [],
            "commodity_labels": [],
            "reference_only": True,
            "mapping_basis": "Country reference point, not a mine; no occurrence is listed in the registry sources.",
        }]
COUNTRY_LIST = sorted(COUNTRIES.values(), key=lambda c: c["name"])
MINERAL_BANDS = json.loads((_DATA / "mineral_bands.json").read_text(encoding="utf-8"))
MINERAL_AREAS = {key: [] for key in MINERAL_BANDS}
for country in COUNTRY_LIST:
    for area in country["areas"]:
        for mineral in area["minerals"]:
            if mineral in MINERAL_AREAS:
                MINERAL_AREAS[mineral].append({
                    "country": country["name"],
                    "area": area["name"],
                    "lat": area["lat"],
                    "lng": area["lng"],
                    "mapping_basis": area.get("mapping_basis", "known district; approximate reference point"),
                })

AOI_HALF_DEGREES = 0.05


class UnknownArea(ValueError):
    pass


def resolve_target(country: str, mineral: str, area: str | None = None) -> dict:
    """Translate a plain country name into the coordinates of the mining area to scan."""
    ref = COUNTRIES[country.upper()]
    areas = ref["areas"]
    if area:
        match = next((a for a in areas if not a.get("reference_only") and a["name"].lower() == area.lower()), None)
        if not match:
            raise UnknownArea(f"Unknown mining area for {ref['name']}.")
        return {"area": match["name"], "lat": match["lat"], "lng": match["lng"], "basis": "mining_area"}
    match = next((a for a in areas if mineral.upper() in a["minerals"]), None)
    if match:
        return {"area": match["name"], "lat": match["lat"], "lng": match["lng"], "basis": "mining_area"}
    return {"area": "National reference point", "lat": ref["lat"], "lng": ref["lng"], "basis": "national_reference"}


class UniversalMontralisGaaS:
    def analyze_mineral_signature(self, bands: dict[str, np.ndarray], mineral: str) -> np.ndarray:
        profile = MINERAL_BANDS[mineral.upper()]
        if profile["formula_type"] != "multi_band_proxy":
            raise ValueError(f"{mineral} is not supported by the Sentinel-2 proxy scanner.")

        def evaluate(node: ast.AST) -> np.ndarray:
            if isinstance(node, ast.Name):
                return bands[node.id]
            if isinstance(node, ast.BinOp):
                left, right = evaluate(node.left), evaluate(node.right)
                if isinstance(node.op, ast.Add):
                    return left + right
                if isinstance(node.op, ast.Sub):
                    return left - right
                if isinstance(node.op, ast.Mult):
                    return left * right
                if isinstance(node.op, ast.Div):
                    return np.divide(left, right, out=np.full_like(left, np.nan), where=np.abs(right) > 1e-8)
            raise ValueError("Unsupported mineral signature formula.")

        expression = ast.parse(profile["formula_string"], mode="eval")
        return evaluate(expression.body)

    def _simulated_bands(self, names: list[str]):
        # Fixed-seed mock rasters used when no real data source is selected.
        rng = np.random.default_rng(42)
        bands = {name: rng.uniform(0.05, 1.0, (500, 500)) for name in names}
        return bands, np.ones((500, 500), dtype=bool), None

    def execute_global_scan(
        self, country: str, target_mineral: str, data_source: str = "simulated", area: str | None = None
    ) -> dict:
        ref = COUNTRIES[country.upper()]
        target = resolve_target(country, target_mineral, area)
        profile = MINERAL_BANDS[target_mineral.upper()]
        provenance = {"data_source": "simulated"}

        if data_source in ("sentinel2-aws", "google-earth-engine"):
            if profile["sentinel2_mode"] != "proxy":
                raise satellite.SatelliteError(profile["sentinel2_note"])
            fetch = ee_source.fetch_scene_bands if data_source == "google-earth-engine" else satellite.fetch_scene_bands
            scene = fetch(
                target["lat"], target["lng"], AOI_HALF_DEGREES, profile["bands_required"]
            )
            bands, valid, georef = scene["bands"], scene["valid"], scene["georef"]
            provenance = scene["provenance"]
        elif data_source == "simulated":
            bands, valid, georef = self._simulated_bands(profile["bands_required"])
        else:
            raise satellite.SatelliteError("Unknown satellite data source.")

        index = self.analyze_mineral_signature(bands, target_mineral)
        index = np.where(valid & np.isfinite(index), index, np.nan)
        if np.all(np.isnan(index)):
            raise satellite.SatelliteError("No valid pixels in the scanned area.")

        peak_pixel = np.unravel_index(np.nanargmax(index), index.shape)
        peak_score = float(index[peak_pixel])
        lo, hi = float(np.nanmin(index)), float(np.nanmax(index))
        confidence = ((peak_score - lo) / (hi - lo) * 100) if hi > lo else 0.0

        if georef is not None:
            lat, lng = georef(int(peak_pixel[0]), int(peak_pixel[1]))
        else:
            lat = target["lat"] + peak_pixel[0] * 0.0001
            lng = target["lng"] + peak_pixel[1] * 0.0001

        return {
            "id": str(uuid.uuid4()),
            "country": ref["name"],
            "mining_area": target["area"],
            "georeference": target["basis"],
            "mineral_target": target_mineral.capitalize(),
            "mineral_symbol": MINERAL_BANDS[target_mineral.upper()]["symbol"],
            "latitude": round(float(lat), 6),
            "longitude": round(float(lng), 6),
            "spectral_confidence": round(float(confidence), 2),
            "estimated_tonnage": round(peak_score * 12500, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **provenance,
        }
