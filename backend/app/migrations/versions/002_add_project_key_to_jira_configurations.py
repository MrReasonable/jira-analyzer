"""add_project_key_to_jira_configurations.

Revision ID: 002
Revises: 001
Create Date: 2025-03-22 06:49:34.668933

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add project_key column to jira_configurations table."""
    op.add_column('jira_configurations', sa.Column('project_key', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove project_key column from jira_configurations table."""
    op.drop_column('jira_configurations', 'project_key')
