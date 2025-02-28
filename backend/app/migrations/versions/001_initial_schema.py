"""Initial schema for the Jira Analyzer application.

Revision ID: 001
Revises:
Create Date: 2025-02-26

This migration creates the initial database schema for storing Jira configurations.
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the initial database schema.

    Creates the jira_configurations table to store user-defined Jira settings.
    """
    # Create jira_configurations table
    op.create_table(
        'jira_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('jira_server', sa.String(), nullable=False),
        sa.Column('jira_email', sa.String(), nullable=False),
        sa.Column('jira_api_token', sa.String(), nullable=False),
        sa.Column('jql_query', sa.String(), nullable=False),
        sa.Column('workflow_states', sa.JSON(), nullable=False),
        sa.Column('lead_time_start_state', sa.String(), nullable=False),
        sa.Column('lead_time_end_state', sa.String(), nullable=False),
        sa.Column('cycle_time_start_state', sa.String(), nullable=False),
        sa.Column('cycle_time_end_state', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )


def downgrade() -> None:
    """Revert the initial schema creation.

    Drops the jira_configurations table.
    """
    op.drop_table('jira_configurations')
