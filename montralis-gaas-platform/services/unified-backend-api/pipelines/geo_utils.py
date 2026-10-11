"""Small planar/spherical geometry helpers for dashboard summaries (WGS84 lat/lng pairs)."""
from __future__ import annotations

import math

EARTH_RADIUS_KM = 6371.0088
SQ_MILE_KM2 = 2.589988110336


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(h)))


def bearing_deg(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lat2 = math.radians(a[0]), math.radians(b[0])
    dlon = math.radians(b[1] - a[1])
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def polyline_length_km(points: list[tuple[float, float]]) -> float:
    return sum(haversine_km(points[i], points[i + 1]) for i in range(len(points) - 1))


def strike_deg(points: list[tuple[float, float]]) -> float:
    """Overall end-to-end strike as an azimuth in 0-180 degrees (undirected)."""
    return bearing_deg(points[0], points[-1]) % 180


def sample_segment(start: tuple[float, float], end: tuple[float, float], count: int = 25) -> list[tuple[float, float]]:
    return [
        (start[0] + (end[0] - start[0]) * i / (count - 1), start[1] + (end[1] - start[1]) * i / (count - 1))
        for i in range(count)
    ]


def point_in_polygon(point: tuple[float, float], polygon: list[tuple[float, float]]) -> bool:
    lat, lng = point
    inside = False
    j = len(polygon) - 1
    for i in range(len(polygon)):
        lat_i, lng_i = polygon[i]
        lat_j, lng_j = polygon[j]
        if (lat_i > lat) != (lat_j > lat):
            crossing = (lng_j - lng_i) * (lat - lat_i) / (lat_j - lat_i) + lng_i
            if lng < crossing:
                inside = not inside
        j = i
    return inside


def distance_to_polyline_km(point: tuple[float, float], line: list[tuple[float, float]]) -> float:
    """Distance to a polyline using a local equirectangular projection (adequate for short ranges)."""
    cos_lat = math.cos(math.radians(point[0]))

    def project(p: tuple[float, float]) -> tuple[float, float]:
        return ((p[1] - point[1]) * cos_lat * 111.32, (p[0] - point[0]) * 110.57)

    best = float("inf")
    for i in range(len(line) - 1):
        ax, ay = project(line[i])
        bx, by = project(line[i + 1])
        dx, dy = bx - ax, by - ay
        length_sq = dx * dx + dy * dy
        t = 0.0 if length_sq == 0 else max(0.0, min(1.0, -(ax * dx + ay * dy) / length_sq))
        best = min(best, math.hypot(ax + t * dx, ay + t * dy))
    return best


def square_zone(center_lat: float, center_lng: float, area_sq_miles: float = 500.0) -> tuple[float, float, float, float]:
    """Return (west, south, east, north) of a square zone of the given area centred on a point."""
    side_km = math.sqrt(area_sq_miles * SQ_MILE_KM2)
    half_lat = side_km / 2 / 110.57
    half_lng = side_km / 2 / (111.32 * max(math.cos(math.radians(center_lat)), 0.01))
    return (center_lng - half_lng, center_lat - half_lat, center_lng + half_lng, center_lat + half_lat)
