from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Forces Python to load modules directly from the local directory and pipelines path
_BACKEND = os.path.join(os.path.abspath(os.path.dirname(__file__)), "unified-backend-api")
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(_BACKEND)
sys.path.append(os.path.join(_BACKEND, "pipelines"))

# Ingest your core pipeline execution brains natively
from pipelines.data_fusion import MontralisDataFusionEngine  # type: ignore[reportMissingImports]
from pipelines.logistic_broker import MontralisLogisticBroker  # type: ignore[reportMissingImports]
import pipelines.universal_prospector as prospector  # type: ignore[reportMissingImports]
import pipelines.satellite as satellite  # type: ignore[reportMissingImports]

# Import your native token verifier from auth.py to lock down enterprise access routes
from auth import require_session
import portal_api

app = FastAPI(title="Montralis GaaS Unified Core Mainframe")

# Allow your frontend React portals on port 3000 to communicate with this backend cleanly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your consolidated pipeline logic engines
exploration_brain = MontralisDataFusionEngine()
logistics_brain = MontralisLogisticBroker()
app.include_router(portal_api.router)

DB_PATH = portal_api.DB_PATH
STRUCTURAL_REPORT_FEE_GBP = portal_api.STRUCTURAL_REPORT_FEE_GBP


def _connect():
    return portal_api._connect()

# ─── DATA ACCESS SCHEMA CONSTRAINTS ───
class ScanRequest(BaseModel):
    country: str
    target_mineral: str
    data_source: str = "sentinel2-aws"
    area: str | None = None
    company: str = "Enterprise Standard Tier"

class DamAlertRequest(BaseModel):
    dam_id: str
    dam_name: str
    country: str

class UtilityGridRequest(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str # 'PIPELINE' or 'GRID_PYLON'
    country: str

# ─── SYSTEM MAINTENANCE & REGISTRY METRICS ENDPOINTS (From gaas_api) ───
@app.get("/api/v1/gaas/health")
def health():
    return {"status": "ok", "engine": "sentinel2", "mainframe": "unified_core"}

@app.get("/api/v1/gaas/countries")
def countries(_claims: dict = Depends(require_session)):
    """Returns the comprehensive global country geometry boundary data arrays."""
    return prospector.COUNTRY_LIST

@app.get("/api/v1/gaas/minerals")
def minerals(_claims: dict = Depends(require_session)):
    """Returns all 29 target mineral proxy definitions and wavelength profiles."""
    return [
        {**profile, "id": key.lower(), "profile_name": profile["name"], "name": key.title()}
        for key, profile in prospector.MINERAL_BANDS.items()
    ]

@app.get("/api/v1/gaas/data-sources")
def data_sources(_claims: dict = Depends(require_session)):
    """Returns the live open-source satellite catalogue provider statuses."""
    return satellite.data_sources()

# ─── DASHBOARD 1 PATHWAY: AI MULTI-MINERAL EXPLORATION (Consolidated) ───
@app.post("/api/v1/gaas/universal-scan")
def universal_scan(request: ScanRequest, _claims: dict = Depends(require_session)):
    """Executes high-precision AST multi-band proxy matrix expressions over target regions."""
    if request.country.upper() not in prospector.COUNTRIES:
        raise HTTPException(status_code=422, detail="Unknown country bounding box parameters.")
        
    profile = prospector.MINERAL_BANDS.get(request.target_mineral.upper())
    if not profile:
        raise HTTPException(status_code=422, detail="Target mineral signature not indexed in registry.")
        
    if request.data_source in ("sentinel2-aws", "google-earth-engine") and profile["sentinel2_mode"] != "proxy":
        raise HTTPException(status_code=422, detail=profile["sentinel2_note"])
        
    try:
        # Executes the active global exploration scanning processor
        result = prospector.UniversalMontralisGaaS().execute_global_scan(
            request.country, request.target_mineral, request.data_source, request.area
        )
        conn = _connect()
        try:
            conn.execute(
                "INSERT OR REPLACE INTO universal_discoveries "
                "(id, country, mineral_target, latitude, longitude, spectral_confidence, estimated_tonnage, timestamp) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (result["id"], result["country"], result["mineral_target"], result["latitude"], result["longitude"],
                 result["spectral_confidence"], result["estimated_tonnage"], result["timestamp"]),
            )
            conn.commit()
        finally:
            conn.close()
        return {"discovery_payload": result}
    except satellite.SatelliteError as exc:
        status = 503 if "unreachable" in str(exc).lower() or "could not read" in str(exc).lower() else 422
        raise HTTPException(status_code=status, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

# ─── OLD BACKEND SCAN DEPRECATION WRAPPER (Preserves legacy layout hooks) ───
@app.post("/api/v1/exploration/run-scan")
async def run_exploration_scan(req: ScanRequest, _claims: dict = Depends(require_session)):
    try:
        result = exploration_brain.execute_fusion_prospecting(req.country, req.target_mineral, req.company)
        return {"status": "SUCCESS", "payload": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── DASHBOARD 2 PATHWAY: TAILINGS DAM WALL STABILITY COMPLIANCE (3mm ALARM) ───
@app.post("/api/v1/compliance/dam-verify")
def process_tailings_dam_radar(req: DamAlertRequest, claims: dict = Depends(require_session)):
    metrics = portal_api.evaluate_recorded_asset(req.dam_id, "TAILINGS_DAM", claims)
    return {"status": "RECORDED_OBSERVATION_EVALUATED", "metrics": metrics}

# ─── DASHBOARD 3 PATHWAY: LINEAR UTILITY GRID & PIPELINE GEOMORPHIC RISK ───
@app.post("/api/v1/utility/grid-telemetry")
def process_utility_grid_hazards(req: UtilityGridRequest, claims: dict = Depends(require_session)):
    metrics = portal_api.evaluate_recorded_asset(req.asset_id, req.asset_type, claims)
    return {"status": "RECORDED_OBSERVATION_EVALUATED", "metrics": metrics}

# ─── LOGISTICS MODULE: LIVE OPEN DRONE GIG BOARD ───
@app.get("/api/v1/logistics/gigs")
async def get_drone_marketplace(_claims: dict = Depends(require_session)):
    try:
        open_jobs = logistics_brain.fetch_open_market_gigs()
        return {"status": "SUCCESS", "jobs": open_jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
