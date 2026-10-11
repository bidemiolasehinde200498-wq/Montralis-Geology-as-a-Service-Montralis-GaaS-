"""
Harvester script to populate the local Montralis SQL vault 
using the entire global dataset from the USGS MRDS repository.
"""
import csv
import json
import sqlite3
import urllib.request
import zipfile
import sys
import os
from io import BytesIO
from pathlib import Path
from datetime import datetime

# Configure safe absolute system paths to match your Monorepo structure
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packages/database/montralis_vault.db"))
DATA_DIR = Path(__file__).parent.parent / "data_inputs"
MRDS_URL = "https://mrdata.usgs.gov/mrds/rdbms-tab.zip"

def download_usgs_archive(url):
    print("📡 [USGS Harvester] Connecting to global master geological networks...")
    request = urllib.request.Request(url, headers={"User-Agent": "Montralis-Core-Harvester/2.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()

def parse_table_rows(archive, file_target):
    return csv.DictReader(
        (line.decode("utf-8", errors="replace") for line in archive.open(file_target)),
        delimiter="\t"
    )

def main():
    # 1. Stream the raw compressed USGS database tables down into memory
    archive_bytes = download_usgs_archive(MRDS_URL)
    archive = zipfile.ZipFile(BytesIO(archive_bytes))
    
    # 2. Ingest your custom 29-mineral matrix dictionary to verify target matching
    profiles = json.loads((DATA_DIR / "mineral_bands.json").read_text(encoding="utf-8"))
    mineral_lookup = {name.lower().strip(): name.upper() for name in profiles.keys()}
    
    # 3. Pull geographic location variables and spatial metadata sheets
    print("📦 Extracting spatial reference directories...")
    places = {row["dep_id"].strip(): row.get("country", "").strip() for row in parse_table_rows(archive, "Place.txt")}
    
    print("🧪 Sorting raw geological commodity lines...")
    commodities = {}
    for row in parse_table_rows(archive, "Commodity.txt"):
        dep_id = row["dep_id"].strip()
        commod_name = row.get("commod", "").lower().strip()
        
        # Verify the site contains one of your critical target elements
        if dep_id and commod_name in mineral_lookup:
            if dep_id not in commodities:
                commodities[dep_id] = set()
            commodities[dep_id].add(mineral_lookup[commod_name])

    # 4. Open a direct transactional stream to your central database vault file
    print(f"📂 Connecting engine straight to local database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    records_saved = 0
    print("🚀 Running master database ingestion rows loop...")
    
    for row in parse_table_rows(archive, "MRDS.txt"):
        dep_id = row["dep_id"].strip()
        
        # Filter out random rock quarries; only ingest what's in your mineral bands dictionary
        if dep_id not in commodities:
            continue
            
        country = places.get(dep_id, "Unknown Region").strip()
        site_name = row.get("name", "").strip() or f"USGS Historical Target {dep_id}"
        
        try:
            longitude = float(row.get("longitude", 0.0))
            latitude = float(row.get("latitude", 0.0))
        except (ValueError, TypeError):
            continue
            
        # Protect system from bad data coordinates breaching maritime grid caps
        if not (-180 <= longitude <= 180 and -90 <= latitude <= 90) or (latitude == 0.0 and longitude == 0.0):
            continue
            
        matched_minerals = list(commodities[dep_id])
        
        # Inject every single matching occurrence cleanly into your table row drawer
        for mineral in matched_minerals:
            dev_stat = row.get("dev_stat", "").lower()
            
            # Map mock telemetry scoring vectors to give your early frontends realistic confidence scores
            spectral_score = 94.20 if "producer" in dev_stat else 68.50
            volume_tonnage = 1250000.00 if "producer" in dev_stat else 8500.00
            
            cursor.execute("""
                INSERT OR IGNORE INTO universal_discoveries (
                    id, country, mineral_target, latitude, longitude, spectral_confidence, estimated_tonnage, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"USGS-MRDS-{dep_id}-{mineral}",
                country,
                mineral,
                round(latitude, 5),
                round(longitude, 5),
                spectral_score,
                volume_tonnage,
                datetime.utcnow().isoformat()
            ))
            records_saved += 1

    conn.commit()
    conn.close()
    print(f"✅ Master Ingestion Complete! Injected {records_saved} critical asset rows into your database.")

if __name__ == "__main__":
    main()
