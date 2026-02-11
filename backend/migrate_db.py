#!/usr/bin/env python3
"""
Database migration script: Simplify structure
- Remove Calculation entity, link Version directly to Project
- Rename calculation_versions to project_versions
- Update stages foreign key
"""
import sqlite3
from datetime import datetime
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
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='project_versions'")
        if cursor.fetchone():
            print("Migration already applied (project_versions table exists)")
            conn.close()
            return

        # Check if old tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='calculation_versions'")
        has_calc_versions = cursor.fetchone() is not None

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='calculations'")
        has_calculations = cursor.fetchone() is not None

        if not has_calc_versions and not has_calculations:
            print("No old tables to migrate")
            conn.close()
            return

        print("Starting migration...")

        # 1. Create project_versions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                version_number INTEGER NOT NULL,
                name VARCHAR(100),
                notes TEXT,
                is_baseline BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)
        print("Created project_versions table")

        # 2. Migrate data from calculation_versions
        if has_calc_versions and has_calculations:
            # Get calculations to map to projects
            cursor.execute("""
                SELECT cv.*, c.project_id
                FROM calculation_versions cv
                JOIN calculations c ON cv.calculation_id = c.id
            """)
            versions = cursor.fetchall()
            print(f"Found {len(versions)} calculation versions to migrate")

            for v in versions:
                v_dict = dict(v)
                cursor.execute("""
                    INSERT INTO project_versions (id, project_id, version_number, name, notes, is_baseline, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    v_dict['id'],
                    v_dict['project_id'],
                    v_dict['version_number'],
                    v_dict.get('name'),
                    v_dict.get('notes'),
                    v_dict.get('is_baseline', 0),
                    v_dict.get('created_at', datetime.now().isoformat())
                ))
            print(f"  Migrated {len(versions)} versions")

        # 3. Update stages table foreign key
        cursor.execute("PRAGMA table_info(stages)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'version_id' in columns:
            print("Updating stages table foreign key...")

            # Get existing stages
            cursor.execute("SELECT * FROM stages")
            stages = cursor.fetchall()

            # Create new stages table with updated FK
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
                    FOREIGN KEY (version_id) REFERENCES project_versions(id)
                )
            """)

            for stage in stages:
                stage_dict = dict(stage)
                cursor.execute("""
                    INSERT INTO stages_new (id, version_id, stage_type, name, order_index, start_date, end_date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    stage_dict['id'],
                    stage_dict['version_id'],
                    stage_dict['stage_type'],
                    stage_dict.get('name'),
                    stage_dict['order_index'],
                    stage_dict['start_date'],
                    stage_dict['end_date'],
                    stage_dict.get('created_at')
                ))

            cursor.execute("DROP TABLE stages")
            cursor.execute("ALTER TABLE stages_new RENAME TO stages")
            print("  Updated stages table")

        # 4. Drop old tables
        if has_calc_versions:
            cursor.execute("DROP TABLE calculation_versions")
            print("Dropped calculation_versions table")

        if has_calculations:
            cursor.execute("DROP TABLE calculations")
            print("Dropped calculations table")

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
