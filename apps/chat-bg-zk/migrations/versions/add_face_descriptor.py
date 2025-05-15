"""add face descriptor column

Revision ID: add_face_descriptor
Revises: add_face_commitments
Create Date: 2024-03-19 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'add_face_descriptor'
down_revision = 'add_face_commitments'
branch_labels = None
depends_on = None

def upgrade():
    # Add face_descriptor column
    op.add_column('face_commitments',
        sa.Column('face_descriptor', JSON, nullable=True)
    )
    
    # Make the column non-nullable after adding it
    op.alter_column('face_commitments', 'face_descriptor',
        existing_type=JSON,
        nullable=False
    )

def downgrade():
    op.drop_column('face_commitments', 'face_descriptor') 