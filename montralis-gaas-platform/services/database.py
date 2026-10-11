import sqlite3
import json
import os

# Locate the central database binary file using a safe, absolute path
DATABASE_PATH = os.environ.get("MONTRALIS_DB_PATH") or os.path.abspath(os.path.join(os.path.dirname(__file__), "../packages/database/montralis_vault.db"))

def get_db_connection():
    """
    Establishes an atomic relational connection to your central SQLite storage vault.
    Allows your backend scripts to read and write rows easily.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Lets you look up columns by name like row['id']
    return conn

def execute_migration_blueprint():
    """
    Ensures your local database has all required tables built on system startup
    if they don't already exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Dashboard 1 Table: Exploration Discoveries
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS universal_discoveries (
        id TEXT PRIMARY KEY,
        country TEXT NOT NULL,
        mineral_target TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        spectral_confidence REAL NOT NULL,
        estimated_tonnage REAL NOT NULL,
        offtake_exclusive_locked INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL
    );
    """)
    
    # 2. Master User Management Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        profile_tag TEXT NOT NULL,
        portal TEXT NOT NULL CHECK (portal IN ('client','staff')),
        title TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 3. Flexible Unstructured Payload Vault
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portal_records (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Index optimization for portal records
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_portal_records_collection_owner
    ON portal_records(collection, owner_email, created_at);
    """)
    
    # 4. Standalone Report Billing Ledger (£5k–£15k Reports)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS report_jobs (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        fee_quote_gbp REAL,
        invoice_status TEXT NOT NULL DEFAULT 'Not invoiced',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 5. Dashboard 2 Table: Tailings Dam InSAR Surveillance
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tailings_dam_security (
        dam_id TEXT PRIMARY KEY,
        dam_name TEXT NOT NULL,
        country_name TEXT NOT NULL,
        wall_displacement_mm REAL NOT NULL,
        alert_status TEXT DEFAULT 'NOMINAL',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 6. Dashboard 3 Table: Utility & Pipeline Geohazard Tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS utility_infrastructure_hazards (
        asset_id TEXT PRIMARY KEY,
        asset_name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        soil_displacement_velocity REAL NOT NULL,
        threat_level TEXT DEFAULT 'SAFE',
        last_checked TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 7. Logistics Portal: Drone Pilot Gig Board
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logistics_gig_registry (
        gig_id TEXT PRIMARY KEY,
        associated_target_id TEXT NOT NULL,
        country_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        payout_usd REAL DEFAULT 150.00,
        required_sensor_type TEXT NOT NULL,
        assigned_pilot_email TEXT,
        mission_status TEXT DEFAULT 'OPEN',
        ledger_payout_settled INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(associated_target_id) REFERENCES universal_discoveries(id),
        FOREIGN KEY(assigned_pilot_email) REFERENCES users(email)
    );
    """)
    
    conn.commit()
    conn.close()
    print("📂 [Database Setup] All master tables and indices verified.")

def load_master_data_sources():
    """
    Ingests the fully unified data_sources.json registry containing
    all 29 mineral arrays and space endpoints into Python runtime memory.
    """
    current_dir = os.path.dirname(__file__)
    target_path = os.path.join(current_dir, "data_inputs", "data_sources.json")
    
    with open(target_path, "r") as file:
        return json.load(file)

# ─── VERIFICATION LOCK RUN ───
if __name__ == "__main__":
    # Test table deployments
    execute_migration_blueprint()
    
    # Test your configuration files loader loop
    sources = load_master_data_sources()
    commodities = sources["dashboard_1_exploration"]["target_commodities_directory"]
    print(f"✅ Success! Data inputs loaded. Total PGM assets indexed: {len(commodities['platinum_group_metals_pgm'])}")
