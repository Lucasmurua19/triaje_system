from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import RolUsuario
from app.models.paciente import Paciente
from app.models.triaje import Triaje, SignosVitales, EvaluacionTEP, FactoresRiesgo, AccionTriaje
from app.models.sepsis import EvaluacionSepsis, NivelSepsis
from app.models.codigos_activacion import (
    EvaluacionTrauma,
    EvaluacionConvulsiones,
    EvaluacionAnafilaxia,
    EvaluacionPCR,
    EvaluacionDificultadRespiratoria,
)
from app.models.user import User
from app.schemas.triaje import TriajeCompleto, TriajeOut, AccionTriajeCreate, AccionTriajeOut
from app.schemas.sepsis import SepsisResumen, ClasificacionUpdate
from app.models.sepsis import ClasificacionShock
from app.schemas.codigos_activacion import (
    TraumaCriteriosIn,
    ConvulsionesCriteriosIn,
    AnafilaxiaCriteriosIn,
    PCRCriteriosIn,
    DificultadRespiratoriaCriteriosIn,
    CodigoActivacionResumen,
)
from app.services.triaje_service import clasificar_triaje, escalar_por_shock_septico
from app.services.sepsis_service import evaluar_sirs, calcular_edad_meses
from app.services import codigos_activacion_service as cod_service
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/triaje", tags=["Triaje"])


@router.post("/", response_model=TriajeOut, status_code=status.HTTP_201_CREATED)
def crear_triaje_completo(
    body: TriajeCompleto,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RolUsuario.enfermera, RolUsuario.admin)),
):
    paciente = db.query(Paciente).filter(Paciente.id == body.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # 1. Crear registro de triaje
    triaje = Triaje(
        paciente_id=body.paciente_id,
        usuario_id=current_user.id,
        motivo_consulta=body.motivo_consulta,
    )
    db.add(triaje)
    db.flush()  # obtener triaje.id sin commit

    # 2. Signos vitales
    sv = SignosVitales(triaje_id=triaje.id, **body.signos_vitales.model_dump())
    db.add(sv)

    # 3. TEP
    tep = EvaluacionTEP(triaje_id=triaje.id, **body.evaluacion_tep.model_dump())
    db.add(tep)

    # 4. Factores de riesgo
    fr = FactoresRiesgo(triaje_id=triaje.id, **body.factores_riesgo.model_dump())
    db.add(fr)

    db.flush()

    # 5. Motor de clasificacion de triaje
    nivel, minutos = clasificar_triaje(paciente.fecha_nacimiento, sv, tep, fr)

    # 6. Motor SIRS
    edad_meses = calcular_edad_meses(paciente.fecha_nacimiento)
    resultado_sirs = evaluar_sirs(edad_meses, sv, fr)

    # Shock septico es una emergencia inmediata, sin importar el nivel base
    nivel, minutos = escalar_por_shock_septico(nivel, minutos, resultado_sirs["nivel"])
    triaje.nivel = nivel
    triaje.tiempo_espera_minutos = minutos
    triaje.completado = True

    sepsis = EvaluacionSepsis(
        triaje_id=triaje.id,
        criterio_temperatura=resultado_sirs["criterio_temperatura"],
        criterio_taquicardia=resultado_sirs["criterio_taquicardia"],
        criterio_taquipnea=resultado_sirs["criterio_taquipnea"],
        criterio_leucocitos=resultado_sirs["criterio_leucocitos"],
        criterio_mental=resultado_sirs["criterio_mental"],
        criterio_perfusion=resultado_sirs["criterio_perfusion"],
        total_criterios_sirs=resultado_sirs["total_criterios_sirs"],
        nivel=resultado_sirs["nivel"],
        activado=resultado_sirs["activado"],
        recomendaciones=json.dumps(resultado_sirs["recomendaciones"], ensure_ascii=False),
        tiempo_activacion=datetime.now(timezone.utc) if resultado_sirs["activado"] else None,
    )
    db.add(sepsis)
    db.commit()
    db.refresh(triaje)
    return triaje


@router.get("/", response_model=List[TriajeOut])
def listar_triajes(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(Triaje)
        .order_by(Triaje.fecha.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{triaje_id}", response_model=TriajeOut)
def obtener_triaje(
    triaje_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    triaje = db.query(Triaje).filter(Triaje.id == triaje_id).first()
    if not triaje:
        raise HTTPException(status_code=404, detail="Triaje no encontrado")
    return triaje


@router.get("/{triaje_id}/sepsis", response_model=SepsisResumen)
def obtener_resumen_sepsis(
    triaje_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    triaje = db.query(Triaje).filter(Triaje.id == triaje_id).first()
    if not triaje or not triaje.evaluacion_sepsis:
        raise HTTPException(status_code=404, detail="Evaluacion de sepsis no encontrada")

    sep = triaje.evaluacion_sepsis
    recomendaciones = json.loads(sep.recomendaciones) if sep.recomendaciones else []

    criterios_positivos = []
    mapa = {
        "criterio_temperatura": "Fiebre / hipotermia",
        "criterio_taquicardia": "Taquicardia",
        "criterio_taquipnea": "Taquipnea",
        "criterio_leucocitos": "Leucocitosis / leucopenia",
        "criterio_mental": "Alteración del estado mental",
        "criterio_perfusion": "Perfusión alterada",
    }
    for attr, nombre in mapa.items():
        if getattr(sep, attr):
            criterios_positivos.append(nombre)

    color_map = {
        NivelSepsis.sin_sepsis:    "verde",
        NivelSepsis.sospecha:      "amarillo",
        NivelSepsis.sepsis_grave:  "rojo",
        NivelSepsis.shock_septico: "rojo",
    }

    return SepsisResumen(
        nivel=sep.nivel,
        activado=sep.activado,
        total_criterios_sirs=sep.total_criterios_sirs,
        criterios_positivos=criterios_positivos,
        recomendaciones=recomendaciones,
        color_alerta=color_map.get(sep.nivel, "verde"),
        clasificacion_shock=sep.clasificacion_shock,
    )


@router.patch("/{triaje_id}/sepsis/clasificacion")
def clasificar_shock(
    triaje_id: int,
    body: ClasificacionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.medico, RolUsuario.enfermera, RolUsuario.admin)),
):
    sepsis = db.query(EvaluacionSepsis).filter(EvaluacionSepsis.triaje_id == triaje_id).first()
    if not sepsis:
        raise HTTPException(status_code=404, detail="Evaluación de sepsis no encontrada")
    sepsis.clasificacion_shock = body.clasificacion_shock
    db.commit()
    return {"clasificacion_shock": sepsis.clasificacion_shock}


@router.post("/{triaje_id}/acciones/", response_model=AccionTriajeOut, status_code=status.HTTP_201_CREATED)
def agregar_accion(
    triaje_id: int,
    body: AccionTriajeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RolUsuario.enfermera, RolUsuario.admin)),
):
    triaje = db.query(Triaje).filter(Triaje.id == triaje_id).first()
    if not triaje:
        raise HTTPException(status_code=404, detail="Triaje no encontrado")
    accion = AccionTriaje(triaje_id=triaje_id, usuario_id=current_user.id, **body.model_dump())
    db.add(accion)
    db.commit()
    db.refresh(accion)
    return accion


@router.get("/{triaje_id}/acciones/", response_model=List[AccionTriajeOut])
def listar_acciones(
    triaje_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(AccionTriaje)
        .filter(AccionTriaje.triaje_id == triaje_id)
        .order_by(AccionTriaje.hora_administracion)
        .all()
    )


@router.delete("/{triaje_id}/acciones/{accion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_accion(
    triaje_id: int,
    accion_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.enfermera, RolUsuario.admin)),
):
    accion = (
        db.query(AccionTriaje)
        .filter(AccionTriaje.id == accion_id, AccionTriaje.triaje_id == triaje_id)
        .first()
    )
    if not accion:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
    db.delete(accion)
    db.commit()


# ---------------------------------------------------------------------------
# Codigos de activacion adicionales: Trauma, Convulsiones, Anafilaxia, PCR,
# Dificultad Respiratoria Grave. Se evaluan bajo demanda (no en todo triaje,
# a diferencia de Sepsis) cuando el cuadro clinico lo amerita.
# ---------------------------------------------------------------------------

_NOMBRES_CODIGO = {
    "trauma": "Código Trauma",
    "convulsiones": "Código Convulsiones",
    "anafilaxia": "Código Anafilaxia",
    "pcr": "Código PCR",
    "dificultad_respiratoria": "Código Dificultad Respiratoria Grave",
}

_CRITERIOS_POR_TIPO = {
    "trauma": cod_service.CRITERIOS_TRAUMA,
    "convulsiones": cod_service.CRITERIOS_CONVULSIONES,
    "anafilaxia": cod_service.CRITERIOS_ANAFILAXIA,
    "pcr": cod_service.CRITERIOS_PCR,
    "dificultad_respiratoria": cod_service.CRITERIOS_DIFICULTAD_RESPIRATORIA,
}


def _color_alerta_codigo(activado: bool, nivel_gravedad: str | None) -> str:
    if not activado:
        return "verde"
    return "naranja" if nivel_gravedad == "grave" else "rojo"


def _registrar_codigo_activacion(
    db: Session,
    triaje_id: int,
    model_cls,
    criterios_in,
    tipo_codigo: str,
    resultado: dict,
) -> CodigoActivacionResumen:
    triaje = db.query(Triaje).filter(Triaje.id == triaje_id).first()
    if not triaje:
        raise HTTPException(status_code=404, detail="Triaje no encontrado")

    registro = model_cls(triaje_id=triaje_id, **criterios_in.model_dump())
    registro.activado = resultado["activado"]
    registro.recomendaciones = json.dumps(resultado["recomendaciones"], ensure_ascii=False)
    registro.tiempo_activacion = datetime.now(timezone.utc) if resultado["activado"] else None
    if hasattr(registro, "nivel_gravedad"):
        registro.nivel_gravedad = resultado.get("nivel_gravedad")

    db.add(registro)
    db.commit()

    return CodigoActivacionResumen(
        tipo_codigo=tipo_codigo,
        nombre=_NOMBRES_CODIGO[tipo_codigo],
        activado=resultado["activado"],
        nivel_gravedad=resultado.get("nivel_gravedad"),
        criterios_positivos=resultado["criterios_positivos"],
        recomendaciones=resultado["recomendaciones"],
        tiempo_activacion=registro.tiempo_activacion,
        color_alerta=_color_alerta_codigo(resultado["activado"], resultado.get("nivel_gravedad")),
    )


@router.post(
    "/{triaje_id}/codigos-activacion/trauma",
    response_model=CodigoActivacionResumen,
    status_code=status.HTTP_201_CREATED,
)
def evaluar_codigo_trauma(
    triaje_id: int,
    body: TraumaCriteriosIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.medico, RolUsuario.enfermera, RolUsuario.admin)),
):
    resultado = cod_service.evaluar_trauma(body)
    return _registrar_codigo_activacion(db, triaje_id, EvaluacionTrauma, body, "trauma", resultado)


@router.post(
    "/{triaje_id}/codigos-activacion/convulsiones",
    response_model=CodigoActivacionResumen,
    status_code=status.HTTP_201_CREATED,
)
def evaluar_codigo_convulsiones(
    triaje_id: int,
    body: ConvulsionesCriteriosIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.medico, RolUsuario.enfermera, RolUsuario.admin)),
):
    resultado = cod_service.evaluar_convulsiones(body)
    return _registrar_codigo_activacion(db, triaje_id, EvaluacionConvulsiones, body, "convulsiones", resultado)


@router.post(
    "/{triaje_id}/codigos-activacion/anafilaxia",
    response_model=CodigoActivacionResumen,
    status_code=status.HTTP_201_CREATED,
)
def evaluar_codigo_anafilaxia(
    triaje_id: int,
    body: AnafilaxiaCriteriosIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.medico, RolUsuario.enfermera, RolUsuario.admin)),
):
    resultado = cod_service.evaluar_anafilaxia(body)
    return _registrar_codigo_activacion(db, triaje_id, EvaluacionAnafilaxia, body, "anafilaxia", resultado)


@router.post(
    "/{triaje_id}/codigos-activacion/pcr",
    response_model=CodigoActivacionResumen,
    status_code=status.HTTP_201_CREATED,
)
def evaluar_codigo_pcr(
    triaje_id: int,
    body: PCRCriteriosIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.medico, RolUsuario.enfermera, RolUsuario.admin)),
):
    resultado = cod_service.evaluar_pcr(body)
    return _registrar_codigo_activacion(db, triaje_id, EvaluacionPCR, body, "pcr", resultado)


@router.post(
    "/{triaje_id}/codigos-activacion/dificultad-respiratoria",
    response_model=CodigoActivacionResumen,
    status_code=status.HTTP_201_CREATED,
)
def evaluar_codigo_dificultad_respiratoria(
    triaje_id: int,
    body: DificultadRespiratoriaCriteriosIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RolUsuario.medico, RolUsuario.enfermera, RolUsuario.admin)),
):
    resultado = cod_service.evaluar_dificultad_respiratoria(body)
    return _registrar_codigo_activacion(
        db, triaje_id, EvaluacionDificultadRespiratoria, body, "dificultad_respiratoria", resultado
    )


@router.get("/{triaje_id}/codigos-activacion", response_model=List[CodigoActivacionResumen])
def listar_codigos_activacion(
    triaje_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    triaje = db.query(Triaje).filter(Triaje.id == triaje_id).first()
    if not triaje:
        raise HTTPException(status_code=404, detail="Triaje no encontrado")

    # Se toma la evaluacion mas reciente de cada tipo (puede haber sido reevaluado).
    registros = [
        ("trauma", triaje.evaluaciones_trauma),
        ("convulsiones", triaje.evaluaciones_convulsiones),
        ("anafilaxia", triaje.evaluaciones_anafilaxia),
        ("pcr", triaje.evaluaciones_pcr),
        ("dificultad_respiratoria", triaje.evaluaciones_dificultad_respiratoria),
    ]

    resultados = []
    for tipo, lista in registros:
        registro = lista[-1] if lista else None
        if registro is None:
            continue
        nivel_gravedad = getattr(registro, "nivel_gravedad", None)
        criterios_positivos = [
            label for key, label in _CRITERIOS_POR_TIPO[tipo].items() if getattr(registro, key)
        ]
        resultados.append(
            CodigoActivacionResumen(
                tipo_codigo=tipo,
                nombre=_NOMBRES_CODIGO[tipo],
                activado=registro.activado,
                nivel_gravedad=nivel_gravedad,
                criterios_positivos=criterios_positivos,
                recomendaciones=json.loads(registro.recomendaciones) if registro.recomendaciones else [],
                tiempo_activacion=registro.tiempo_activacion,
                color_alerta=_color_alerta_codigo(registro.activado, nivel_gravedad),
            )
        )
    return resultados
