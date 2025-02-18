from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

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
    migrations = [
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

    for migration in migrations:
        try:
            # Check if migration has been applied
            result = db.session.execute(
                text('SELECT id FROM migrations WHERE name = :name'),
                {'name': migration['name']}
            ).fetchone()

            if not result:
                logger.info(f"Applying migration: {migration['name']}")
                
                # Execute each statement
                for statement in migration['sql']:
                    try:
                        db.session.execute(text(statement))
                    except Exception as e:
                        # Log the error but continue if column already exists
                        if 'duplicate column name' not in str(e):
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
