import sqlite3

DB_PATH = "montralis_global_vault.db"


def init_db(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create the master universal discoveries ledger
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
    )
    """)
    conn.commit()
    conn.close()
    print("📂 [Database] Montralis Global Vault DB successfully initialized.")


if __name__ == "__main__":
    init_db()
