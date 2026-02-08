#!/usr/bin/env python3
"""
Database migration script: Add Project as top-level entity
- Creates projects table
- Adds project_id to calculations
- Migrates existing calculations to default projects
- Changes date fields from YYYY-MM strings to Date type
"""
import sqlite3
from datetime import date, datetime
import shutil
import os

DB_PATH = "team_cost.db"
BACKUP_PATH = "team_cost_backup.db"


def migrate():
    # Create backup
    if os.path.exists(DB_PATH):
        shutil.copy(DB_PATH, BACKUP_PATH)
        print(f"Created backup: {BACKUP_PATH}")
    else:
        print("No existing database found, will create fresh")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Check if migration is needed
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
        if cursor.fetchone():
            print("Migration already applied (projects table exists)")
            return

        print("Starting migration...")

        # 1. Create projects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                methodology VARCHAR(20) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        print("Created projects table")

        # 2. Get existing calculations
        cursor.execute("SELECT * FROM calculations")
        calculations = cursor.fetchall()
        print(f"Found {len(calculations)} existing calculations")

        # 3. Create temporary table for new calculations schema
        cursor.execute("""
            CREATE TABLE calculations_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)

        # 4. For each calculation, create a project and migrate the calculation
        for calc in calculations:
            calc_dict = dict(calc)

            # Parse dates (convert YYYY-MM to YYYY-MM-01)
            start_date = calc_dict.get('start_month') or calc_dict.get('start_date')
            end_date = calc_dict.get('end_month') or calc_dict.get('end_date')

            if start_date and '-' in str(start_date) and len(str(start_date)) == 7:
                start_date = f"{start_date}-01"
            if end_date and '-' in str(end_date) and len(str(end_date)) == 7:
                # Use last day of month
                end_date = f"{end_date}-28"  # Safe for all months

            methodology = calc_dict.get('methodology', 'waterfall')

            # Create project for this calculation
            cursor.execute("""
                INSERT INTO projects (name, description, methodology, start_date, end_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                calc_dict['name'],
                calc_dict.get('description'),
                methodology,
                start_date,
                end_date,
                calc_dict.get('created_at', datetime.now().isoformat())
            ))
            project_id = cursor.lastrowid

            # Migrate calculation to new table
            cursor.execute("""
                INSERT INTO calculations_new (id, project_id, name, description, start_date, end_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                calc_dict['id'],
                project_id,
                calc_dict['name'],
                calc_dict.get('description'),
                start_date,
                end_date,
                calc_dict.get('created_at'),
                calc_dict.get('updated_at')
            ))
            print(f"  Migrated calculation '{calc_dict['name']}' to project {project_id}")

        # 5. Drop old calculations table and rename new one
        cursor.execute("DROP TABLE calculations")
        cursor.execute("ALTER TABLE calculations_new RENAME TO calculations")
        print("Replaced calculations table")

        # 6. Update stages table - change start_month/end_month to start_date/end_date
        cursor.execute("PRAGMA table_info(stages)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'start_month' in columns:
            print("Migrating stages table...")

            # Get existing stages
            cursor.execute("SELECT * FROM stages")
            stages = cursor.fetchall()

            # Create new stages table
            cursor.execute("""
                CREATE TABLE stages_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version_id INTEGER NOT NULL,
                    stage_type VARCHAR(50) NOT NULL,
                    name VARCHAR(100),
                    order_index INTEGER NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (version_id) REFERENCES calculation_versions(id)
                )
            """)

            for stage in stages:
                stage_dict = dict(stage)

                start_date = stage_dict.get('start_month') or stage_dict.get('start_date')
                end_date = stage_dict.get('end_month') or stage_dict.get('end_date')

                if start_date and '-' in str(start_date) and len(str(start_date)) == 7:
                    start_date = f"{start_date}-01"
                if end_date and '-' in str(end_date) and len(str(end_date)) == 7:
                    end_date = f"{end_date}-28"

                cursor.execute("""
                    INSERT INTO stages_new (id, version_id, stage_type, name, order_index, start_date, end_date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    stage_dict['id'],
                    stage_dict['version_id'],
                    stage_dict['stage_type'],
                    stage_dict.get('name'),
                    stage_dict['order_index'],
                    start_date,
                    end_date,
                    stage_dict.get('created_at')
                ))

            cursor.execute("DROP TABLE stages")
            cursor.execute("ALTER TABLE stages_new RENAME TO stages")
            print("Migrated stages table")

        conn.commit()
        print("\nMigration completed successfully!")
        print(f"Backup saved at: {BACKUP_PATH}")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        # Restore backup
        if os.path.exists(BACKUP_PATH):
            shutil.copy(BACKUP_PATH, DB_PATH)
            print("Restored from backup")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
