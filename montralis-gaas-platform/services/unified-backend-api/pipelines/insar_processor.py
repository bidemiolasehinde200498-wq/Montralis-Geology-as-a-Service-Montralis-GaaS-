"""
InSAR Radar Core Engine - Powers Dashboard 2 (Dams) and Dashboard 3 (Utilities) Independently.
Calculates millimeter phase shifts and executes automated emergency webhook alerts.
"""
import numpy as np
import sqlite3
import os
import uuid
import urllib.request
import json
from datetime import datetime

# Absolute path targeting your central Monorepo database cabinet file
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packages/database/montralis_vault.db"))

class MontralisInSAREngine:
    def __init__(self):
        # A test webhook link. In production, this points to your SMS/Email API Gateway (e.g., Twilio or PagerDuty)
        self.emergency_alert_webhook_url = "https://httpbin.org" 
        print("📡 [InSAR Engine] Radar Phase-Deformation Analyzer Initialised.")

    def _trigger_immediate_emergency_webhook(self, payload: dict):
        """Sends an active automated red-alert transmission over the internet without human delay."""
        print(f"🚨 [ALERT DISPATCHER] SAFETY CEILING BREACHED! Transmitting emergency webhooks...")
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                self.emergency_alert_webhook_url, 
                data=data, 
                headers={'Content-Type': 'application/json', 'User-Agent': 'Montralis-Emergency-Trigger/2.0'}
            )
            # Execute high-speed network request bypass
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    print("✅ [WEBHOOK SENT] Infrastructure operators and insurance underwriters notified successfully.")
        except Exception as e:
            print(f"⚠️ [Webhook Error] Failed to broadcast emergency signal: {str(e)}")

    def evaluate_structural_stability(self, asset_id: str, name: str, asset_type: str, country: str) -> dict:
        """
        Processes radar satellite wave arrays, divides logic by asset requirements,
        updates isolated database tables, and triggers emergency overrides.
        """
        target_type = asset_type.upper().strip() # 'TAILINGS_DAM', 'PIPELINE', 'GRID_PYLON'
        
        # 1. INSAAR MATH RADAR MATRIX SIMULATION (Simulating a 100x100 meter cell grid block)
        np.random.seed(42)
        mock_baseline_wave = np.random.uniform(0.1, 0.5, (100, 100))
        mock_current_wave = np.random.uniform(0.1, 0.5, (100, 100))
        
        # Inject artificial structural cracking movement to test the alert systems
        mock_current_wave += 0.125  
        
        # Core radar processing equation modeling millimeter ground surface velocity
        displacement_grid = (mock_current_wave - mock_baseline_wave) * 28.0 # Sentinel-1 wavelength constant
        max_movement_mm = float(np.max(displacement_grid))
        
        # 2. ISOLATE SAFETY CEILING LOGIC SEPARATELY FOR DASHBOARD 2 & DASHBOARD 3
        if target_type == "TAILINGS_DAM":
            # Dashboard 2: Strict 3.0mm Tailings Reservoir Limit
            safety_ceiling = 3.0
            alert_label = "CRITICAL" if max_movement_mm >= safety_ceiling else ("WARNING" if max_movement_mm >= 2.0 else "NOMINAL")
            table_name = "tailings_dam_security"
        else:
            # Dashboard 3: Linear Assets (Pipeline / Power Grid) 2.5mm Soil Erosion Limit
            safety_ceiling = 2.5
            alert_label = "LANDSLIDE_RISK" if max_movement_mm >= safety_ceiling else ("WARNING" if max_movement_mm >= 1.5 else "SAFE")
            table_name = "utility_infrastructure_hazards"

        # 3. CONSTRUCT AN INTEGRATED THREAT PAYLOAD
        payload = {
            "ticket_id": f"MTRL-INSAR-{str(uuid.uuid4())[:8].upper()}",
            "asset_id": asset_id,
            "asset_name": name,
            "asset_type": target_type,
            "country": country,
            "max_displacement_mm": round(max_movement_mm, 3),
            "safety_ceiling_mm": safety_ceiling,
            "alert_status": alert_label,
            "timestamp": datetime.utcnow().isoformat()
        }

        # 4. IF CRITICAL/HAZARD LEVEL MET, DISPATCH THE WEBHOOK IMMEDIATELY (ZERO HUMAN DELAY)
        if alert_label in ["CRITICAL", "LANDSLIDE_RISK"]:
            payload["emergency_action_required"] = "IMMEDIATE SITE EVACUATION / LINE PRESSURE SHUTOFF"
            self._trigger_immediate_emergency_webhook(payload)
        else:
            payload["emergency_action_required"] = "CONTINUE SATELLITE SURVEILLANCE PASSES"

        # 5. COMMIT TARGET LOGS SEPARATELY INTO THEIR ISOLATED SQL TABLE DRAWERS
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        if target_type == "TAILINGS_DAM":
            cursor.execute("""
                INSERT OR REPLACE INTO tailings_dam_security (dam_id, dam_name, country_name, wall_displacement_mm, alert_status)
                VALUES (?, ?, ?, ?, ?)
            """, (asset_id, name, country, round(max_movement_mm, 3), alert_label))
        else:
            cursor.execute("""
                INSERT OR REPLACE INTO utility_infrastructure_hazards (asset_id, asset_name, asset_type, soil_displacement_velocity, threat_level)
                VALUES (?, ?, ?, ?, ?)
            """, (asset_id, name, target_type, round(max_movement_mm, 3), alert_label))
            
        conn.commit()
        conn.close()
        
        return payload
