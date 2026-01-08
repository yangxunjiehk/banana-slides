"""add user_id for multi-tenant support

Revision ID: 007_add_user_id
Revises: 006_add_export_settings
Create Date: 2026-01-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007_add_user_id'
down_revision = '006_add_export_settings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add user_id column to projects and user_templates tables for multi-tenant support.
    The column is nullable to support backward compatibility (existing data without users).
    """
    # Add user_id column to projects table
    op.add_column('projects', sa.Column('user_id', sa.String(255), nullable=True))

    # Add user_id column to user_templates table
    op.add_column('user_templates', sa.Column('user_id', sa.String(255), nullable=True))

    # Add user_id column to reference_files table
    op.add_column('reference_files', sa.Column('user_id', sa.String(255), nullable=True))

    # Add user_id column to materials table
    op.add_column('materials', sa.Column('user_id', sa.String(255), nullable=True))


def downgrade() -> None:
    """
    Remove user_id columns from tables.
    """
    op.drop_column('materials', 'user_id')
    op.drop_column('reference_files', 'user_id')
    op.drop_column('user_templates', 'user_id')
    op.drop_column('projects', 'user_id')
