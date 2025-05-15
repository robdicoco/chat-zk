"""add face commitments table

Revision ID: add_face_commitments
Revises: # Add the previous revision ID here
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_face_commitments'
down_revision = None  # Update this with the previous migration ID
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'face_commitments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('commitment', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('commitment')
    )
    op.create_index(op.f('ix_face_commitments_id'), 'face_commitments', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_face_commitments_id'), table_name='face_commitments')
    op.drop_table('face_commitments') 