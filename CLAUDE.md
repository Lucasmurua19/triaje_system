# Sistema de Triaje Pediátrico — Contexto para Claude

## Descripción del proyecto

Sistema de triaje pediátrico con activación de código sepsis, desarrollado junto con la madre del usuario (enfermera con amplia experiencia clínica). El modelo clínico sigue los criterios IPSCC (Goldstein 2005) para SIRS pediátrico y el estándar de 5 niveles de la SLEPE (Sociedad Latinoamericana de Emergencia Pediátrica).

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy ORM + Pydantic v2 |
| Base de datos | PostgreSQL 16 (Alpine) |
| Autenticación | JWT (python-jose) + passlib/bcrypt |
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Forms | react-hook-form |
| Orquestación | Docker Compose (3 servicios: db, backend, frontend) |

## Cómo levantar el proyecto

```bash
# Primera vez o cuando cambia el modelo de DB
docker compose down -v
docker compose up --build

# Levantar sin reconstruir
docker compose up
```

**Credenciales por defecto:**
- URL: `http://localhost:3000`
- Email: `admin@hospital.com`
- Password: `admin123`
- Swagger API: `http://localhost:8000/docs`

## Estructura de archivos

```
sistema_triaje/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                    # FastAPI app, CORS, create_all
│       ├── database.py                # engine, SessionLocal, Base, get_db
│       ├── dependencies.py            # get_current_user JWT guard
│       ├── core/config.py             # pydantic-settings (DATABASE_URL, SECRET_KEY)
│       ├── models/
│       │   ├── user.py                # User, RolUsuario enum (medico/enfermera/admin)
│       │   ├── paciente.py            # Paciente con antecedentes médicos
│       │   ├── triaje.py              # Triaje, SignosVitales, EvaluacionTEP, FactoresRiesgo
│       │   └── sepsis.py              # EvaluacionSepsis, NivelSepsis enum
│       ├── schemas/
│       │   ├── auth.py
│       │   ├── paciente.py            # PacienteCreate, PacienteUpdate, PacienteOut, PacienteListOut
│       │   ├── triaje.py              # TriajeCompleto, TriajeOut, SignosVitalesOut, etc.
│       │   └── sepsis.py              # SepsisResumen
│       ├── routers/
│       │   ├── auth.py                # POST /auth/login, POST /auth/register
│       │   ├── pacientes.py           # CRUD /pacientes/
│       │   └── triaje.py              # POST /triaje/, GET /triaje/, GET /triaje/{id}, GET /triaje/{id}/sepsis
│       └── services/
│           ├── auth_service.py        # hash_password, verify_password, create/verify_access_token
│           ├── triaje_service.py      # Motor clasificacion 5 niveles + factores modificadores
│           └── sepsis_service.py      # Motor SIRS pediatrico IPSCC
└── frontend/
    ├── Dockerfile                     # Multi-stage: deps → builder → runner (standalone)
    ├── next.config.js                 # CommonJS (NO .ts — Next.js 14 no lo soporta)
    ├── public/.gitkeep               # Necesario para Docker build
    ├── .env.local                     # NEXT_PUBLIC_API_URL=http://localhost:8000
    ├── lib/
    │   ├── auth.ts                    # getToken/setSession/getUser/clearSession (localStorage)
    │   └── api.ts                     # fetch wrapper con Bearer token + redirect 401
    ├── types/index.ts                 # Todos los tipos TypeScript
    ├── app/
    │   ├── globals.css                # .btn-primary, .btn-secondary, .btn-danger, .input, .label, .card
    │   ├── login/page.tsx
    │   ├── dashboard/
    │   │   ├── layout.tsx             # Auth guard → redirect /login si no hay token
    │   │   └── page.tsx               # Lista triajes + stats (total, sepsis, nivel 1-2)
    │   ├── pacientes/
    │   │   ├── page.tsx               # Lista con columnas Grupo sanguíneo / Alergias
    │   │   ├── nuevo/page.tsx
    │   │   └── [id]/page.tsx          # Detalle + edición de antecedentes médicos
    │   └── triaje/
    │       ├── nuevo/page.tsx         # Wizard 4 pasos
    │       └── [id]/page.tsx          # Detalle triaje + sepsis + antecedentes del paciente
    └── components/
        ├── Sidebar.tsx
        ├── NivelBadge.tsx             # Badge color: 1=rojo, 2=naranja, 3=amarillo, 4=verde, 5=azul
        ├── SepsisAlert.tsx            # Alerta visual + audio (AudioContext) para sepsis grave/shock
        └── triaje-wizard/
            ├── StepPaciente.tsx       # Buscar existente O registrar nuevo (con sección antecedentes)
            ├── StepMotivoTEP.tsx      # Motivo consulta + 3 switches TEP
            ├── StepSignosVitales.tsx  # Signos vitales (campos vacíos = undefined, no 0)
            └── StepFactoresRiesgo.tsx # 6 checkboxes con colores de riesgo
```

## Modelo de base de datos

### Tabla `pacientes`
```
id, nombre, apellido, fecha_nacimiento, sexo (enum), documento, telefono_contacto,
observaciones, created_at,
-- Antecedentes médicos (agregados en sesión 2):
grupo_sanguineo (String 5), alergias (Text), enfermedades_cronicas (Text),
medicacion_habitual (Text), antecedentes_quirurgicos (Text)
```

### Tabla `triajes`
```
id, paciente_id (FK), usuario_id (FK), motivo_consulta,
nivel (enum: 1-5), tiempo_espera_minutos, fecha, completado
```

### Tabla `signos_vitales`
```
id, triaje_id (FK),
frecuencia_cardiaca, frecuencia_respiratoria, temperatura, saturacion_o2,
tension_arterial_sistolica, tension_arterial_diastolica,
nivel_conciencia (enum: alerta/voz/dolor/inconsciente), glasgow (3-15),
peso_kg, llene_capilar_segundos
```

### Tabla `evaluaciones_tep`
```
id, triaje_id (FK),
apariencia_normal (bool), apariencia_detalle,
respiracion_normal (bool), respiracion_detalle,
circulacion_normal (bool), circulacion_detalle
```

### Tabla `factores_riesgo`
```
id, triaje_id (FK),
edad_menor_3_meses, inmunosupresion, enfermedad_cronica,
reconsulta_72h, dolor_severo, sospecha_infeccion (bool x6)
```

### Tabla `evaluaciones_sepsis`
```
id, triaje_id (FK),
criterio_temperatura, criterio_taquicardia, criterio_taquipnea,
criterio_leucocitos, criterio_mental, criterio_perfusion (bool x6),
total_criterios_sirs, nivel (enum: sin_sepsis/sospecha/sepsis_grave/shock_septico),
activado, recomendaciones (JSON Text), tiempo_activacion
```

### Tabla `users`
```
id, nombre, email, hashed_password, rol (enum: medico/enfermera/admin), is_active, created_at
```

## Lógica clínica implementada

### Motor de triaje (`triaje_service.py`)
- Clasifica en 5 niveles usando signos vitales ajustados por edad
- Rangos pediátricos: 6 grupos etarios (neonato, lactante, 1-2a, 2-5a, 5-12a, 12-18a)
- Factores modificadores: edad <3m, inmunosupresión, dolor severo, reconsulta 72h → suben 1 nivel
- Tiempos de espera: N1=inmediato, N2=10min, N3=30min, N4=60min, N5=120min

### Motor SIRS (`sepsis_service.py`)
- Criterios IPSCC Goldstein 2005: temperatura, taquicardia, taquipnea, leucocitos, mental, perfusión
- Niveles: sin_sepsis → sospecha (≥2 SIRS + infección) → sepsis_grave (+ disfunción orgánica) → shock_septico (hipotensión)
- Genera recomendaciones clínicas específicas por nivel
- Alerta especial para <3 meses

### Evaluación TEP
- Triángulo de Evaluación Pediátrica: Apariencia + Respiración + Circulación
- 3 lados alterados → Nivel 1; 2 lados → Nivel 2; 1 lado → Nivel 3

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /auth/login | Login, retorna JWT |
| POST | /auth/register | Registro de usuario |
| GET | /pacientes/ | Listar/buscar pacientes |
| POST | /pacientes/ | Crear paciente |
| GET | /pacientes/{id} | Obtener paciente |
| PUT | /pacientes/{id} | Actualizar paciente (incluyendo antecedentes) |
| POST | /triaje/ | Crear triaje completo (ejecuta ambos motores) |
| GET | /triaje/ | Listar triajes |
| GET | /triaje/{id} | Obtener triaje |
| GET | /triaje/{id}/sepsis | Resumen sepsis del triaje |

## Bugs corregidos (no repetir)

1. **`next.config.ts` no soportado** → usar siempre `next.config.js` con `module.exports`
2. **`/app/public` no encontrado en Docker** → existe `frontend/public/.gitkeep`
3. **`bcrypt` incompatible con passlib** → `bcrypt==4.0.1` fijo en `requirements.txt`
4. **`version: "3.9"` obsoleto** → docker-compose.yml NO tiene campo `version`
5. **Campos vacíos en signos vitales enviaban 0** → `StepSignosVitales.tsx` envía `undefined` para campos vacíos

## Funciones pendientes (identificadas en análisis clínico)

El análisis fue basado en PDFs de la SLEPE (Sociedad Latinoamericana de Emergencia Pediátrica). Prioridad de implementación:

### Alta prioridad (modelo clínico)
1. **Escala de dolor estructurada** — Actualmente solo hay checkbox "dolor_severo". Falta:
   - Selección de escala según edad: NIPS (neonatos), FLACC (no colaboradores), Wong-Baker (<7a), numérica (>7a)
   - Puntaje numérico registrado en SignosVitales
   - Clasificación: leve (1-3), moderado (4-7), severo (8-10)

2. **Acciones de Triage Avanzado** — Registro de lo que la enfermera hace ANTES del médico:
   - Nueva tabla `acciones_triage` vinculada al triaje
   - Acciones: analgésico administrado, antitérmico, SRO iniciado, O2 aplicado, inmovilización, limpieza herida
   - Incluir dosis/detalle y hora de administración

3. **Evaluación de hidratación** — Para pacientes con vómitos/diarrea:
   - Campos: normohidratado / deshidratación leve / deshidratación moderada / severa
   - Disparar protocolo SRO si corresponde

4. **Flag Fast Track** — Identificar pacientes nivel IV-V candidatos a vía rápida:
   - Campo `es_fast_track` (bool) en Triaje
   - Criterios de exclusión automáticos basados en Cincinnati Children's Hospital
   - Vista separada en dashboard para cola Fast Track

### Media prioridad (operación hospitalaria)
5. **Reevaluación de triaje** — Registrar nueva toma de signos vitales para paciente ya triajado
6. **Cola de espera activa** — Vista en tiempo real con tiempo transcurrido desde triaje + alerta si se supera tiempo máximo por nivel
7. **Registro de egreso** — Cómo terminó el episodio: alta, internación, derivación, fuga

### Baja prioridad (mejoras)
8. Historial de triajes por paciente en la página de detalle del paciente
9. Filtros en dashboard (por nivel, por fecha, por sepsis activa)
10. PDF/impresión del triaje

## Notas importantes para futuros cambios

- **Cambios en modelos de DB**: como se usa `Base.metadata.create_all()`, los cambios en columnas requieren `docker compose down -v && docker compose up --build` en desarrollo
- **Errores de TypeScript en IDE**: los errores "No se encuentra el módulo react/next" son falsos positivos — no hay `node_modules` local porque el proyecto corre en Docker. El build en Docker funciona correctamente
- **`PacienteUpdate` vs `PacienteCreate`**: el PUT de pacientes usa `PacienteUpdate` (todos los campos opcionales). El POST usa `PacienteCreate` (nombre/apellido/fecha_nacimiento/sexo requeridos)
- **Wizard de triaje**: el payload final se construye en `frontend/app/triaje/nuevo/page.tsx` y se envía en un solo POST a `/triaje/`
- **JWT en localStorage**: decisión consciente para MVP. Para producción usar httpOnly cookies
