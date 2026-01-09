"""create allowed_emails table for whitelist management

Revision ID: 008_allowed_emails
Revises: 007_add_user_id
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008_allowed_emails'
down_revision = '007_add_user_id'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create allowed_emails table for managing email whitelist.
    """
    op.create_table(
        'allowed_emails',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('added_by', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    """
    Drop allowed_emails table.
    """
    op.drop_table('allowed_emails')
