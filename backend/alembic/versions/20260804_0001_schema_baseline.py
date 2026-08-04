"""Marker di adozione per database Eira pre-Alembic.

Revision ID: 20260804_0001
Revises:
Create Date: 2026-08-04

Questa revisione intenzionalmente non modifica lo schema. Il bootstrap
verifica i database preesistenti e li stampa direttamente alla revisione
esplicita successiva; un database vuoto prosegue invece con le operazioni
congelate nella revisione successiva.
"""

revision = "20260804_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
