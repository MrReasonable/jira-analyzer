"""make_project_key_non_nullable.

Revision ID: 655ab269993d
Revises: 710de75fcfac
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
    op.execute("UPDATE jira_configurations SET project_key = SUBSTRING(jql_query FROM 'project = ([A-Z0-9]+)') WHERE project_key IS NULL")

    # Then make the column non-nullable
    op.alter_column('jira_configurations', 'project_key',
               existing_type=sa.String(),
               nullable=False)


def downgrade() -> None:
    """Revert project_key column to nullable in jira_configurations table."""
    op.alter_column('jira_configurations', 'project_key',
               existing_type=sa.String(),
               nullable=True)
