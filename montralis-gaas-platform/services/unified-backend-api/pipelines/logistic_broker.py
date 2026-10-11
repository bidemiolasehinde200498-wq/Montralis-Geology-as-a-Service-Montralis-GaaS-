"""Drone gig board backed by the logistics_gig_registry table (read-only)."""
import os
import sqlite3

DB_PATH = os.environ.get("MONTRALIS_DB_PATH") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../packages/database/montralis_vault.db")
)


class MontralisLogisticBroker:
    def fetch_open_market_gigs(self) -> list[dict]:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute(
                "SELECT gig_id, associated_target_id, country_name, latitude, longitude, payout_usd, "
                "required_sensor_type, mission_status, timestamp FROM logistics_gig_registry "
                "WHERE mission_status = 'OPEN' ORDER BY timestamp DESC"
            ).fetchall()
        finally:
            conn.close()
        return [dict(row) for row in rows]
