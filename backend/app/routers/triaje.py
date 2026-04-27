from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.paciente import Paciente
from app.models.triaje import Triaje, SignosVitales, EvaluacionTEP, FactoresRiesgo
from app.models.sepsis import EvaluacionSepsis, NivelSepsis
from app.models.user import User
from app.schemas.triaje import TriajeCompleto, TriajeOut
from app.schemas.sepsis import SepsisResumen
from app.services.triaje_service import clasificar_triaje
from app.services.sepsis_service import evaluar_sirs, calcular_edad_meses
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/triaje", tags=["Triaje"])


@router.post("/", response_model=TriajeOut, status_code=status.HTTP_201_CREATED)
def crear_triaje_completo(
    body: TriajeCompleto,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    triaje.nivel = nivel
    triaje.tiempo_espera_minutos = minutos
    triaje.completado = True

    # 6. Motor SIRS
    edad_meses = calcular_edad_meses(paciente.fecha_nacimiento)
    resultado_sirs = evaluar_sirs(edad_meses, sv, fr)

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
    )
