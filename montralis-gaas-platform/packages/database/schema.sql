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

CREATE TABLE IF NOT EXISTS portal_records (
    id TEXT PRIMARY KEY,
    collection TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_records_collection_owner
ON portal_records(collection, owner_email, created_at);

CREATE TABLE IF NOT EXISTS report_jobs (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    fee_quote_gbp REAL,
    invoice_status TEXT NOT NULL DEFAULT 'Not invoiced',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- DASHBOARD 2: TAILINGS DAM WALL STABILITY COMPLIANCE (STRICT 3mm RADAR LIMIT)
-- Tracks high-risk individual waste lakes globally using free Sentinel-1 radar data
CREATE TABLE IF NOT EXISTS tailings_dam_security (
    dam_id TEXT PRIMARY KEY,
    dam_name TEXT NOT NULL,
    country_name TEXT NOT NULL,                 -- Plain country label selector lookup
    wall_displacement_mm REAL NOT NULL,         -- Live radar calculated phase shift
    alert_status TEXT DEFAULT 'NOMINAL' CHECK (alert_status IN ('NOMINAL','WARNING','CRITICAL')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DASHBOARD 3: UTILITY GRID & PIPELINE TELEMETRY (LINEAR GEOMORPHIC RISK)
-- Tracks thousands of miles of pipelines and pylons over shifting mountain terrains
CREATE TABLE IF NOT EXISTS utility_infrastructure_hazards (
    asset_id TEXT PRIMARY KEY,
    asset_name TEXT NOT NULL,                   -- e.g., 'Freeport Hydrogen Line Corridor Alpha'
    asset_type TEXT NOT NULL CHECK (asset_type IN ('PIPELINE', 'GRID_PYLON')),
    soil_displacement_velocity REAL NOT NULL,   -- Shifting soil ground speed in cm/year
    threat_level TEXT DEFAULT 'SAFE' CHECK (threat_level IN ('SAFE', 'WARNING', 'LANDSLIDE_RISK')),
    last_checked TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- LOGISTICS HUB: THE FIELD GIG-MARKETPLACE DEPLOYMENT LEDGER
-- The automated dispatch matching engine connecting AI coordinates directly to African pilots
CREATE TABLE IF NOT EXISTS logistics_gig_registry (
    gig_id TEXT PRIMARY KEY,
    associated_target_id TEXT NOT NULL,
    country_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    payout_usd REAL DEFAULT 150.00,             -- Contract fee micro-payout for field survey
    required_sensor_type TEXT NOT NULL CHECK (required_sensor_type IN ('AEROMAGNETIC_SURVEY', 'THERMAL_IR_PROFILING')),
    assigned_pilot_email TEXT,                  -- Connects straight to the email column in users table
    mission_status TEXT DEFAULT 'OPEN' CHECK (mission_status IN ('OPEN', 'CLAIMED', 'FLIGHT_ACTIVE', 'COMPLETED')),
    ledger_payout_settled INTEGER DEFAULT 0,    -- 0 = Escrow Pending, 1 = Fired to Mobile Wallet API
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(associated_target_id) REFERENCES universal_discoveries(id),
    FOREIGN KEY(assigned_pilot_email) REFERENCES users(email)
);