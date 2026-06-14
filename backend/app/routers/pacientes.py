from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.paciente import Paciente
from app.models.user import User
from app.schemas.paciente import PacienteCreate, PacienteUpdate, PacienteOut, PacienteListOut

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.post("/", response_model=PacienteOut, status_code=status.HTTP_201_CREATED)
def crear_paciente(
    body: PacienteCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if body.documento:
        existente = db.query(Paciente).filter(Paciente.documento == body.documento).first()
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe un paciente con ese documento")
    paciente = Paciente(**body.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.get("/", response_model=List[PacienteListOut])
def listar_pacientes(
    busqueda: str = Query(None, description="Buscar por nombre, apellido o documento"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Paciente)
    if busqueda:
        termino = f"%{busqueda}%"
        query = query.filter(
            Paciente.nombre.ilike(termino)
            | Paciente.apellido.ilike(termino)
            | Paciente.documento.ilike(termino)
        )
    return query.order_by(Paciente.apellido).offset(skip).limit(limit).all()


@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente


@router.put("/{paciente_id}", response_model=PacienteOut)
def actualizar_paciente(
    paciente_id: int,
    body: PacienteUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(paciente, campo, valor)
    db.commit()
    db.refresh(paciente)
    return paciente
