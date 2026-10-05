import sqlite3

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from database_setup import DB_PATH, init_db
from universal_prospector import UniversalMontralisGaaS

app = FastAPI(title="Montralis Universal GaaS API Hub")
engine = UniversalMontralisGaaS()
init_db()

VALID_MINERALS = ["LITHIUM", "COPPER", "COBALT", "GRAPHITE", "NICKEL", "MANGANESE"]


class ScanRequest(BaseModel):
    country: str
    target_mineral: str


@app.post("/api/v1/gaas/universal-scan")
async def universal_scan_endpoint(req: ScanRequest):
    if req.target_mineral.upper() not in VALID_MINERALS:
        raise HTTPException(
            status_code=400,
            detail=f"Mineral signature not supported. Supported profiles: {VALID_MINERALS}",
        )

    try:
        result = engine.execute_global_scan(req.country, req.target_mineral)

        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                """
                INSERT INTO universal_discoveries
                (id, country, mineral_target, latitude, longitude, spectral_confidence, estimated_tonnage, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    result["id"], result["country"], result["mineral_target"],
                    result["latitude"], result["longitude"], result["spectral_confidence"],
                    result["estimated_tonnage"], result["timestamp"],
                ),
            )
            conn.commit()
        finally:
            conn.close()

        return {
            "status": "SUCCESSFULLY_LOGGED_TO_VAULT",
            "discovery_payload": result,
            "next_automated_action": "TRIGGER_MOBILE_OFFTAKE_SMART_CONTRACT",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
