"""Generate an interactive-ready surface mesh from an aligned anomaly raster."""
from __future__ import annotations

import numpy as np
from rasterio.transform import xy
from rasterio.warp import transform

from data_fusion import FusedTensor


def generate_surface_mesh(
    fused: FusedTensor,
    layer_index: int = 0,
    max_dimension: int = 100,
    vertical_exaggeration: float = 1.0,
) -> dict:
    """Return WGS84 vertices and triangle faces; Z is a relative index, not subsurface depth."""
    if not 0 <= layer_index < fused.tensor.shape[0]:
        raise ValueError("layer_index is out of range.")
    if max_dimension < 2 or vertical_exaggeration <= 0:
        raise ValueError("Mesh dimensions and vertical exaggeration must be positive.")

    raster = fused.tensor[layer_index]
    row_step = max(1, int(np.ceil(raster.shape[0] / max_dimension)))
    col_step = max(1, int(np.ceil(raster.shape[1] / max_dimension)))
    rows = list(range(0, raster.shape[0], row_step))
    cols = list(range(0, raster.shape[1], col_step))
    if rows[-1] != raster.shape[0] - 1:
        rows.append(raster.shape[0] - 1)
    if cols[-1] != raster.shape[1] - 1:
        cols.append(raster.shape[1] - 1)

    valid = np.isfinite(raster[np.ix_(rows, cols)])
    vertices = []
    vertex_ids = np.full(valid.shape, -1, dtype=np.int32)
    for grid_row, row in enumerate(rows):
        for grid_col, col in enumerate(cols):
            value = raster[row, col]
            if not np.isfinite(value):
                continue
            x, y = xy(fused.transform, row, col, offset="center")
            lon, lat = transform(fused.crs, "EPSG:4326", [x], [y])
            vertex_ids[grid_row, grid_col] = len(vertices)
            vertices.append([float(lon[0]), float(lat[0]), float(value) * vertical_exaggeration])

    faces = []
    for row in range(len(rows) - 1):
        for col in range(len(cols) - 1):
            corners = [vertex_ids[row, col], vertex_ids[row, col + 1], vertex_ids[row + 1, col], vertex_ids[row + 1, col + 1]]
            if min(corners) < 0:
                continue
            a, b, c, d = corners
            faces.extend([[int(a), int(b), int(c)], [int(b), int(d), int(c)]])

    return {
        "crs": "EPSG:4326",
        "layer": fused.layer_names[layer_index],
        "vertices": vertices,
        "faces": faces,
        "valid_vertex_count": len(vertices),
        "surface_semantics": "relative_surface_anomaly_index_not_depth_or_grade",
        "provenance": list(fused.layer_sources),
    }
