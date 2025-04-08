"""make_project_key_non_nullable.

Revision ID: 003
Revises: 002
Create Date: 2025-03-24 09:08:15.531737

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make project_key column non-nullable in jira_configurations table."""
    # First set a default value for any existing NULL values
    op.execute("UPDATE jira_configurations SET project_key = 'DEFAULT' WHERE project_key IS NULL")

    # Get the database dialect to handle SQLite vs PostgreSQL differently
    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == 'sqlite':
        # SQLite doesn't support ALTER COLUMN for NOT NULL constraints
        # We need to use batch_alter_table which handles the table recreation
        with op.batch_alter_table('jira_configurations') as batch_op:
            batch_op.alter_column('project_key', existing_type=sa.String(), nullable=False)
    else:
        # For PostgreSQL and other databases, use the standard ALTER COLUMN
        op.alter_column(
            'jira_configurations', 'project_key', existing_type=sa.String(), nullable=False
        )


def downgrade() -> None:
    """Revert project_key column to nullable in jira_configurations table."""
    # Get the database dialect to handle SQLite vs PostgreSQL differently
    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == 'sqlite':
        # Use batch_alter_table for SQLite compatibility
        with op.batch_alter_table('jira_configurations') as batch_op:
            batch_op.alter_column('project_key', existing_type=sa.String(), nullable=True)
    else:
        # For PostgreSQL and other databases, use the standard ALTER COLUMN
        op.alter_column(
            'jira_configurations', 'project_key', existing_type=sa.String(), nullable=True
        )
