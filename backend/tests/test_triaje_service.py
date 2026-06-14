from datetime import date

import pytest

from app.models.sepsis import NivelSepsis
from app.models.triaje import NivelTriaje
from app.services.triaje_service import clasificar_triaje, escalar_por_shock_septico

from .factories import make_fr, make_sv, make_tep

# Con hoy_fijo (2026-06-15), este nacimiento da edad_meses=108 -> bracket 5-12 anios
# (FC_max=130, FR_max=30, TA_sis_min=83)
NACIMIENTO_ESCOLAR = date(2017, 6, 15)


# ---------------------------------------------------------------------------
# Niveles base 1-5 (signos vitales y TEP, sin factores de riesgo)
# ---------------------------------------------------------------------------

class TestNivelesBase:
    def test_nivel_5_paciente_sano(self, hoy_fijo):
        nivel, minutos = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(), make_tep(), make_fr())
        assert nivel == NivelTriaje.no_urgente
        assert minutos == 120

    def test_nivel_4_fiebre_38(self, hoy_fijo):
        nivel, minutos = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(temperatura=38.0), make_tep(), make_fr())
        assert nivel == NivelTriaje.menor_urgencia
        assert minutos == 60

    def test_nivel_3_fiebre_38_5(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(temperatura=38.5), make_tep(), make_fr())
        assert nivel == NivelTriaje.urgente

    def test_nivel_3_taquicardia_leve(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(frecuencia_cardiaca=131), make_tep(), make_fr())
        assert nivel == NivelTriaje.urgente

    def test_nivel_3_taquipnea_leve(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(frecuencia_respiratoria=31), make_tep(), make_fr())
        assert nivel == NivelTriaje.urgente

    def test_nivel_3_saturacion_94(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(saturacion_o2=94), make_tep(), make_fr())
        assert nivel == NivelTriaje.urgente

    def test_nivel_3_llene_capilar_2_5(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(llene_capilar_segundos=2.5), make_tep(), make_fr()
        )
        assert nivel == NivelTriaje.urgente

    def test_nivel_3_tep_un_lado_alterado(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(), make_tep(respiracion_normal=False), make_fr()
        )
        assert nivel == NivelTriaje.urgente

    def test_nivel_2_glasgow_9_a_13(self, hoy_fijo):
        nivel, minutos = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(glasgow=10), make_tep(), make_fr())
        assert nivel == NivelTriaje.muy_urgente
        assert minutos == 10

    def test_nivel_2_saturacion_91(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(saturacion_o2=91), make_tep(), make_fr())
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_fiebre_40(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(temperatura=40.0), make_tep(), make_fr())
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_hipotermia(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(temperatura=35.9), make_tep(), make_fr())
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_taquicardia_severa(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(frecuencia_cardiaca=170), make_tep(), make_fr())
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_taquipnea_severa(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(frecuencia_respiratoria=46), make_tep(), make_fr())
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_hipotension_leve(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(tension_arterial_sistolica=82), make_tep(), make_fr()
        )
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_llene_capilar_mayor_3(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(llene_capilar_segundos=3.5), make_tep(), make_fr()
        )
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_2_tep_dos_lados_alterados(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR,
            make_sv(),
            make_tep(respiracion_normal=False, circulacion_normal=False),
            make_fr(),
        )
        assert nivel == NivelTriaje.muy_urgente

    def test_nivel_1_inconsciente(self, hoy_fijo):
        nivel, minutos = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(nivel_conciencia="inconsciente"), make_tep(), make_fr()
        )
        assert nivel == NivelTriaje.emergencia
        assert minutos == 0

    def test_nivel_1_glasgow_8(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(glasgow=8), make_tep(), make_fr())
        assert nivel == NivelTriaje.emergencia

    def test_nivel_1_saturacion_84(self, hoy_fijo):
        nivel, _ = clasificar_triaje(NACIMIENTO_ESCOLAR, make_sv(saturacion_o2=84), make_tep(), make_fr())
        assert nivel == NivelTriaje.emergencia

    def test_nivel_1_apnea(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(frecuencia_respiratoria=0), make_tep(), make_fr()
        )
        assert nivel == NivelTriaje.emergencia

    def test_nivel_1_hipotension_severa(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(tension_arterial_sistolica=62), make_tep(), make_fr()
        )
        assert nivel == NivelTriaje.emergencia

    def test_nivel_1_tep_tres_lados_alterados(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR,
            make_sv(),
            make_tep(apariencia_normal=False, respiracion_normal=False, circulacion_normal=False),
            make_fr(),
        )
        assert nivel == NivelTriaje.emergencia


# ---------------------------------------------------------------------------
# Factores modificadores
# ---------------------------------------------------------------------------

class TestFactoresModificadores:
    def test_convulsion_activa_fuerza_minimo_nivel_2(self, hoy_fijo):
        nivel, minutos = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(), make_tep(), make_fr(convulsion_activa=True)
        )
        assert nivel == NivelTriaje.muy_urgente
        assert minutos == 10

    def test_convulsion_activa_no_degrada_un_nivel_1_existente(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(glasgow=8), make_tep(), make_fr(convulsion_activa=True)
        )
        assert nivel == NivelTriaje.emergencia

    @pytest.mark.parametrize(
        "campo",
        ["edad_menor_3_meses", "inmunosupresion", "oncologico", "cardiopatia_congenita", "dolor_severo"],
    )
    def test_factor_individual_sube_un_nivel_desde_nivel_5(self, hoy_fijo, campo):
        nivel, minutos = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(), make_tep(), make_fr(**{campo: True})
        )
        assert nivel == NivelTriaje.menor_urgencia
        assert minutos == 60

    def test_reconsulta_72h_sube_nivel_3_a_2(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR,
            make_sv(frecuencia_cardiaca=131),  # base Nivel 3
            make_tep(),
            make_fr(reconsulta_72h=True),
        )
        assert nivel == NivelTriaje.muy_urgente

    def test_reconsulta_72h_no_afecta_un_nivel_2_existente(self, hoy_fijo):
        nivel, _ = clasificar_triaje(
            NACIMIENTO_ESCOLAR,
            make_sv(saturacion_o2=91),  # base Nivel 2
            make_tep(),
            make_fr(reconsulta_72h=True),
        )
        assert nivel == NivelTriaje.muy_urgente

    def test_traslado_otro_centro_sube_nivel_5_a_4(self, hoy_fijo):
        nivel, minutos = clasificar_triaje(
            NACIMIENTO_ESCOLAR, make_sv(), make_tep(), make_fr(traslado_otro_centro=True)
        )
        assert nivel == NivelTriaje.menor_urgencia
        assert minutos == 60


# ---------------------------------------------------------------------------
# escalar_por_shock_septico (Fix #2)
# ---------------------------------------------------------------------------

class TestEscalarPorShockSeptico:
    def test_shock_septico_fuerza_nivel_1_sin_espera(self):
        nivel, minutos = escalar_por_shock_septico(NivelTriaje.no_urgente, 120, NivelSepsis.shock_septico)
        assert nivel == NivelTriaje.emergencia
        assert minutos == 0

    def test_shock_septico_no_cambia_si_ya_es_nivel_1(self):
        nivel, minutos = escalar_por_shock_septico(NivelTriaje.emergencia, 0, NivelSepsis.shock_septico)
        assert nivel == NivelTriaje.emergencia
        assert minutos == 0

    @pytest.mark.parametrize(
        "nivel_sepsis", [NivelSepsis.sin_sepsis, NivelSepsis.sospecha, NivelSepsis.sepsis_grave]
    )
    def test_otros_niveles_de_sepsis_no_escalan_el_triaje(self, nivel_sepsis):
        nivel, minutos = escalar_por_shock_septico(NivelTriaje.urgente, 30, nivel_sepsis)
        assert nivel == NivelTriaje.urgente
        assert minutos == 30
