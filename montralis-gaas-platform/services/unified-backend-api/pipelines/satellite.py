"""Sentinel-2 L2A access through the public AWS Open Data STAC catalogue (no credentials needed)."""
import json
import urllib.request

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import transform, transform_bounds
from rasterio.windows import from_bounds

STAC_SEARCH = "https://earth-search.aws.element84.com/v1/search"
GRID = 500
MAX_CLOUD = 30

# Sentinel-2 asset per band name in mineral_bands.json; 20 m bands keep resampling light.
BAND_ASSETS = {
    "B02": "blue",
    "B03": "green",
    "B04": "red",
    "B07": "rededge3",
    "B08": "nir08",
    "B11": "swir16",
    "B12": "swir22",
}
# SCL classes to drop: no data, saturated, cloud shadow, clouds, cirrus, snow.
_INVALID_SCL = [0, 1, 3, 8, 9, 10, 11]


class SatelliteError(Exception):
    pass


def data_sources() -> list[dict]:
    import ee_source

    ee_ok, ee_note = ee_source.status()
    return [
        {"id": "simulated", "label": "Simulated rasters (demo)", "available": True, "note": "Mock data for demos."},
        {"id": "sentinel2-aws", "label": "Sentinel-2 L2A (AWS Open Data)", "available": True,
         "note": "Live public imagery via the Earth Search STAC API."},
        {"id": "landsat-usgs", "label": "USGS Landsat", "available": False,
         "note": "Pixel data is in a requester-pays AWS bucket; needs AWS credentials."},
        {"id": "copernicus-cdse", "label": "Copernicus Data Space (ESA)", "available": False,
         "note": "Downloads need a Copernicus Data Space account."},
        {"id": "google-earth-engine", "label": "Google Earth Engine", "available": ee_ok, "note": ee_note},
    ]


def _find_scene(lat: float, lng: float, half: float) -> dict:
    body = {
        "collections": ["sentinel-2-l2a"],
        "bbox": [lng - half, lat - half, lng + half, lat + half],
        "limit": 10,
        "query": {"eo:cloud_cover": {"lt": MAX_CLOUD}},
        "sortby": [{"field": "properties.datetime", "direction": "desc"}],
    }
    req = urllib.request.Request(
        STAC_SEARCH, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            items = json.loads(resp.read())["features"]
    except (OSError, ValueError, KeyError) as exc:
        raise SatelliteError("Satellite catalogue is unreachable.") from exc
    if not items:
        raise SatelliteError("No recent low-cloud Sentinel-2 scene covers this location.")
    return min(items, key=lambda i: i["properties"].get("eo:cloud_cover", 100))


def _read_band(item: dict, asset: str, bbox_wgs84: list[float], resampling=Resampling.bilinear):
    info = item["assets"][asset]
    scale, offset = 0.0001, 0.0
    rb = info.get("raster:bands")
    if rb:
        scale, offset = rb[0].get("scale", scale), rb[0].get("offset", offset)
    with rasterio.open(info["href"]) as ds:
        bounds = transform_bounds("EPSG:4326", ds.crs, *bbox_wgs84)
        window = from_bounds(*bounds, transform=ds.transform)
        arr = ds.read(1, window=window, out_shape=(GRID, GRID), resampling=resampling, boundless=True, fill_value=0)
        return arr, scale, offset, bounds, ds.crs


def fetch_scene_bands(lat: float, lng: float, half: float, names: list[str]) -> dict:
    for name in names:
        if name not in BAND_ASSETS:
            raise SatelliteError(f"{name} is not available from Sentinel-2 (thermal bands need Landsat).")

    item = _find_scene(lat, lng, half)
    bbox = [lng - half, lat - half, lng + half, lat + half]
    env = rasterio.Env(AWS_NO_SIGN_REQUEST="YES", GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_TIMEOUT="30")
    try:
        with env:
            bands = {}
            valid = None
            bounds = crs = None
            for name in names:
                raw, scale, offset, bounds, crs = _read_band(item, BAND_ASSETS[name], bbox)
                values = raw.astype("float32") * scale + offset
                bands[name] = values
                band_valid = (raw > 0) & (values > 0)
                valid = band_valid if valid is None else valid & band_valid
            scl, *_ = _read_band(item, "scl", bbox, Resampling.nearest)
    except (rasterio.errors.RasterioError, OSError) as exc:
        raise SatelliteError("Could not read satellite imagery.") from exc

    valid &= ~np.isin(scl, _INVALID_SCL)

    left, bottom, right, top = bounds

    def georef(row: int, col: int):
        x = left + (col + 0.5) * (right - left) / GRID
        y = top - (row + 0.5) * (top - bottom) / GRID
        lons, lats = transform(crs, "EPSG:4326", [x], [y])
        return lats[0], lons[0]

    props = item["properties"]
    return {
        "bands": bands, "valid": valid, "georef": georef,
        "provenance": {
            "data_source": "sentinel-2-l2a (AWS Open Data)",
            "scene_id": item["id"],
            "scene_datetime": props.get("datetime"),
            "cloud_cover": props.get("eo:cloud_cover"),
        },
    }
