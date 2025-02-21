from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError, OperationalError
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

# Define migrations at module level for testing access
MIGRATIONS: List[Dict[str, any]] = [
    {
        'name': 'add_project_and_states_columns',
        'sql': [
            'ALTER TABLE team_config ADD COLUMN project_key TEXT',
            'ALTER TABLE team_config ADD COLUMN start_states TEXT',
            'ALTER TABLE team_config ADD COLUMN end_states TEXT'
        ]
    },
    {
        'name': 'add_filter_and_project_name_columns',
        'sql': [
            'ALTER TABLE team_config ADD COLUMN project_name TEXT',
            'ALTER TABLE team_config ADD COLUMN filter_id TEXT',
            'ALTER TABLE team_config ADD COLUMN filter_name TEXT',
            'ALTER TABLE team_config ADD COLUMN filter_jql TEXT'
        ]
    },
    {
        'name': 'add_active_statuses_column',
        'sql': [
            'ALTER TABLE team_config ADD COLUMN active_statuses TEXT'
        ]
    },
    {
        'name': 'add_flow_efficiency_method_column',
        'sql': [
            'ALTER TABLE team_config ADD COLUMN flow_efficiency_method TEXT DEFAULT "active_statuses"'
        ]
    }
]

def init_db(db: SQLAlchemy):
    """Initialize database and run migrations"""
    try:
        # Create migrations table if it doesn't exist
        db.session.execute(text('''
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))
        db.session.commit()
    except Exception as e:
        logger.error(f"Error creating migrations table: {str(e)}")
        db.session.rollback()
        raise

def run_migrations(db: SQLAlchemy):
    """Run all pending migrations"""
    for migration in MIGRATIONS:
        try:
            # Check if migration has been applied
            result = None
            try:
                stmt = text('SELECT id FROM migrations WHERE name = :name')
                result = db.session.execute(stmt, {'name': migration['name']})
                if result is not None:
                    result = result.fetchone()
            except SQLAlchemyError as e:
                logger.error(f"Error checking migration status: {str(e)}")
                db.session.rollback()
                raise

            if result is None:
                logger.info(f"Applying migration: {migration['name']}")
                
                # Execute each statement
                for statement in migration['sql']:
                    try:
                        db.session.execute(text(statement))
                    except OperationalError as e:
                        # Specifically handle duplicate column case
                        if 'duplicate column name' in str(e).lower():
                            logger.warning(f"Column already exists in {migration['name']}: {str(e)}")
                            continue
                        raise
                    except SQLAlchemyError as e:
                        logger.error(f"Error executing migration {migration['name']}: {str(e)}")
                        db.session.rollback()
                        raise

                # Record migration
                db.session.execute(
                    text('INSERT INTO migrations (name) VALUES (:name)'),
                    {'name': migration['name']}
                )
                db.session.commit()
                logger.info(f"Migration applied successfully: {migration['name']}")
            else:
                logger.info(f"Migration already applied: {migration['name']}")

        except Exception as e:
            logger.error(f"Error applying migration {migration['name']}: {str(e)}")
            db.session.rollback()
            raise
