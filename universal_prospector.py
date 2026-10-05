import numpy as np
import uuid
from datetime import datetime, timezone


class UniversalMontralisGaaS:
    def __init__(self):
        print("🌍 [Montralis Universal GaaS] Spectral Matrix Engine Active.")

    @staticmethod
    def _safe(matrix: np.ndarray) -> np.ndarray:
        """Copy of matrix with zeros replaced by a tiny buffer (avoids division by zero)."""
        safe = np.array(matrix, dtype=float, copy=True)
        safe[safe == 0] = 0.00001
        return safe

    def analyze_mineral_signature(self, band_matrix_a: np.ndarray, band_matrix_b: np.ndarray, mineral: str) -> np.ndarray:
        """Processes remote sensing light matrices based on target elemental profiles."""
        denominator = self._safe(band_matrix_a + band_matrix_b)
        mineral_clean = mineral.upper()

        if mineral_clean == "LITHIUM":
            # SWIR-1 / SWIR-2 normalized difference: lithium-bearing pegmatites/spodumene
            return (band_matrix_a - band_matrix_b) / denominator

        elif mineral_clean in ["COPPER", "COBALT"]:
            # Visible Red / Near-Infrared ratio: surface gossans and iron-oxide weathering
            return band_matrix_a / self._safe(band_matrix_b)

        elif mineral_clean == "GRAPHITE":
            # Thermal infrared anomaly matrix: low thermal emissivity curves
            return np.abs(band_matrix_a - band_matrix_b) * 1.35

        elif mineral_clean in ["NICKEL", "MANGANESE"]:
            # SWIR-2 / VNIR absorption ratio: deep electronic absorption notches
            return (band_matrix_b - band_matrix_a) / denominator

        else:
            # Fallback baseline crustal profiling index
            return (band_matrix_a - band_matrix_b) / denominator

    def execute_global_scan(self, country: str, target_mineral: str) -> dict:
        """Simulates scanning a multi-band planetary dataset and finds the mineral hotspot."""
        rng = np.random.default_rng(42)  # Fixed seed for reproducible telemetry

        mock_band_a = rng.uniform(0.1, 1.0, (500, 500))
        mock_band_b = rng.uniform(0.05, 0.6, (500, 500))

        processed_index = self.analyze_mineral_signature(mock_band_a, mock_band_b, target_mineral)

        peak_pixel = np.unravel_index(np.argmax(processed_index), processed_index.shape)
        peak_score = float(processed_index[peak_pixel])

        base_lats = {"ZIMBABWE": -19.015, "ZAMBIA": -15.416, "DRC": -11.664, "UK": 50.375}
        base_lngs = {"ZIMBABWE": 29.154, "ZAMBIA": 28.283, "DRC": 27.479, "UK": -4.716}

        country_key = country.upper()
        lat = base_lats.get(country_key, 0.0) + (int(peak_pixel[0]) * 0.0001)
        lng = base_lngs.get(country_key, 0.0) + (int(peak_pixel[1]) * 0.0001)

        idx_min = float(np.min(processed_index))
        idx_max = float(np.max(processed_index))
        span = idx_max - idx_min
        normalized_score = (peak_score - idx_min) / span if span else 1.0
        confidence = normalized_score * 100
        estimated_tonnage = peak_score * 12500

        return {
            "id": str(uuid.uuid4()),
            "country": country,
            "mineral_target": target_mineral.capitalize(),
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "spectral_confidence": round(confidence, 2),
            "estimated_tonnage": round(estimated_tonnage, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
