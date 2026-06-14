import os
import sys
from datetime import date

import pytest

# Permite "from app...." aunque pytest se ejecute desde distintos directorios
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import sepsis_service


class _FechaFija(date):
    """date subclass que congela today() para tests deterministicos de edad."""

    _hoy = date(2026, 6, 15)

    @classmethod
    def today(cls):
        return cls._hoy


@pytest.fixture
def hoy_fijo(monkeypatch):
    """Congela 'hoy' en 2026-06-15 (afecta calcular_edad_meses)."""
    monkeypatch.setattr(sepsis_service, "date", _FechaFija)
    return _FechaFija.today()
