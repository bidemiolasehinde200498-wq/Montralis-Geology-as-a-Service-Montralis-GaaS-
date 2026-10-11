"""Sentinel-2 surface reflectance through Google Earth Engine; needs a registered project and credentials."""
import os
import time
from datetime import datetime, timedelta, timezone

import numpy as np

import satellite

GRID = 500
ASSET = "COPERNICUS/S2_SR_HARMONIZED"
MAX_CLOUD = 30
LOOKBACK_DAYS = 180
EE_BANDS = {
    "B02": "B2",
    "B03": "B3",
    "B04": "B4",
    "B07": "B7",
    "B08": "B8",
    "SWIR-1": "B11",
    "SWIR-2": "B12",
    "B11": "B11",
    "B12": "B12",
}

_state = {"checked": 0.0, "ok": False, "reason": ""}


def status() -> tuple[bool, str]:
    project = os.environ.get("EARTHENGINE_PROJECT")
    if not project:
        return False, "Set EARTHENGINE_PROJECT to enable."
    if time.time() - _state["checked"] < 60:
        return _state["ok"], _state["reason"]

    ok, reason = True, "Sentinel-2 via Earth Engine."
    try:
        import ee

        key_file = os.environ.get("EARTHENGINE_KEY_FILE")
        if key_file:
            import json

            email = json.load(open(key_file))["client_email"]
            ee.Initialize(ee.ServiceAccountCredentials(email, key_file), project=project)
        else:
            ee.Initialize(project=project)
        ee.Number(1).getInfo()
    except Exception:
        ok, reason = False, "Earth Engine credentials are missing or not accepted for this project."
    _state.update(checked=time.time(), ok=ok, reason=reason)
    return ok, reason


def fetch_scene_bands(lat: float, lng: float, half: float, names: list[str]) -> dict:
    ok, reason = status()
    if not ok:
        raise satellite.SatelliteError(reason)
    for name in names:
        if name not in EE_BANDS:
            raise satellite.SatelliteError(f"{name} is not available from Sentinel-2.")

    import ee

    band_ids = {name: EE_BANDS[name] for name in names}
    region = ee.Geometry.Rectangle([lng - half, lat - half, lng + half, lat + half])
    start = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).strftime("%Y-%m-%d")
    collection = (
        ee.ImageCollection(ASSET)
        .filterBounds(region)
        .filterDate(start, datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", MAX_CLOUD))
        .sort("CLOUDY_PIXEL_PERCENTAGE")
    )
    scale = 2 * half / GRID
    grid = {
        "dimensions": {"width": GRID, "height": GRID},
        "affineTransform": {
            "scaleX": scale, "shearX": 0, "translateX": lng - half,
            "shearY": 0, "scaleY": -scale, "translateY": lat + half,
        },
        "crsCode": "EPSG:4326",
    }
    try:
        image = ee.Image(collection.first())
        props = image.toDictionary().getInfo()
        if not props:
            raise satellite.SatelliteError("No recent low-cloud Sentinel-2 scene covers this location.")
        arr = ee.data.computePixels({
            "expression": image.select(sorted({*band_ids.values(), "SCL"})),
            "fileFormat": "NUMPY_NDARRAY",
            "grid": grid,
        })
    except satellite.SatelliteError:
        raise
    except Exception as exc:
        raise satellite.SatelliteError("Earth Engine request failed.") from exc

    bands = {name: arr[band_id].astype("float32") * 0.0001 for name, band_id in band_ids.items()}
    valid = np.ones_like(arr["SCL"], dtype=bool)
    for values in bands.values():
        valid &= values > 0
    valid &= ~np.isin(arr["SCL"], satellite._INVALID_SCL)

    def georef(row: int, col: int):
        return (lat + half) - (row + 0.5) * scale, (lng - half) + (col + 0.5) * scale

    when = props.get("system:time_start")
    return {
        "bands": bands, "valid": valid, "georef": georef,
        "provenance": {
            "data_source": f"Google Earth Engine ({ASSET})",
            "scene_id": props.get("PRODUCT_ID"),
            "scene_datetime": datetime.fromtimestamp(when / 1000, timezone.utc).isoformat() if when else None,
            "cloud_cover": props.get("CLOUDY_PIXEL_PERCENTAGE"),
        },
    }
