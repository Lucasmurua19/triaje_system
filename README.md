# 🏥 Sistema de Triaje Pediátrico con Código Sepsis

### MVP funcional — Triaje estructurado de 5 niveles + detección automática de sepsis (IPSCC)

---

## 📌 Descripción

Sistema de triaje pediátrico que estandariza la evaluación inicial en urgencias, integrando el **Triángulo de Evaluación Pediátrica (TEP)**, una clasificación de **5 niveles** (estándar SLEPE) y un módulo de **detección temprana de sepsis** basado en los criterios IPSCC (Goldstein 2005), con activación automática de **Código Sepsis** y protocolo clínico de tratamiento.

Desarrollado en conjunto con personal de enfermería con experiencia clínica en emergencias pediátricas.

---

## ✅ Estado del proyecto — MVP funcional

Lo siguiente ya está implementado y probado de punta a punta (backend + frontend + base de datos):

- **Triaje de 5 niveles** con rangos de signos vitales ajustados por 6 grupos etarios pediátricos
- **Triángulo de Evaluación Pediátrica (TEP)**: apariencia, respiración, circulación
- **Factores de riesgo** que ajustan el nivel: edad < 3 meses, inmunosupresión, cardiopatía congénita, oncológico/quimioterapia, convulsión activa (fuerza nivel mínimo 2), dolor severo, reconsulta 72h, traslado de otro centro
- **Motor SIRS / Código Sepsis** (criterios IPSCC): activación automática ante ≥2 criterios SIRS + sospecha de infección
- **Protocolo clínico "Hora de Oro"**: cálculo automático de dosis por peso (bolo de fluidos, antibióticos empíricos, drogas vasoactivas) y clasificación de shock (compensado / descompensado / refractario)
- **Protocolos de enfermería por nivel de triaje**: acciones, tiempos de reevaluación y signos de alarma
- **Gestión de pacientes** con antecedentes médicos (alergias, grupo sanguíneo, enfermedades crónicas, medicación habitual, antecedentes quirúrgicos)
- **Acciones de triage avanzado**: registro de analgésicos, antitérmicos, SRO, O₂, inmovilización, etc. con dosis y hora
- **Escala de dolor estructurada**: NIPS (neonatos), FLACC (no colaboradores), Wong-Baker (caras, <7 años) o numérica/EVA (≥7 años), con escala sugerida según la edad del paciente y clasificación automática (sin dolor / leve / moderado / severo)
- **Autenticación JWT + control de acceso por rol** (médico / enfermera / admin)
- **Dashboard** con priorización visual de casos con Código Sepsis activo
- **Tests automatizados (pytest)** para los motores de clasificación de triaje y SIRS/sepsis

---

## ⚙️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy ORM + Pydantic v2 |
| Base de datos | PostgreSQL 16 (Alpine) |
| Autenticación | JWT (python-jose) + passlib/bcrypt |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Forms | react-hook-form |
| Orquestación | Docker Compose (db, backend, frontend) |

---

## 🚀 Cómo levantar el proyecto

```bash
# Primera vez o cuando cambia el modelo de base de datos
docker compose down -v
docker compose up --build

# Levantar sin reconstruir
docker compose up
```

| | |
|---|---|
| URL | `http://localhost:3000` |
| Swagger API | `http://localhost:8000/docs` |
| Email admin | `admin@hospital.com` |
| Password admin | `admin123` |

Las variables de entorno (`SECRET_KEY`, `DATABASE_URL`) se configuran en `.env` — usar `.env.example` como plantilla.

---

## 🧠 Modelo clínico

### Triaje de 5 niveles

| Nivel | Prioridad | Tiempo de espera |
|------|----------|--------|
| 1 | Emergencia | Inmediato |
| 2 | Muy urgente | ≤ 10 min |
| 3 | Urgente | ≤ 30 min |
| 4 | Menor urgencia | ≤ 60 min |
| 5 | No urgente | ≤ 120 min |

### Código Sepsis — Criterios SIRS (IPSCC Goldstein 2005)

- Fiebre (>38.5°C) o hipotermia (<36°C)
- Taquicardia / taquipnea para la edad
- Alteración del estado mental
- Perfusión alterada (llene capilar >2s)

≥2 criterios + sospecha de infección → activa Código Sepsis. Niveles: sospecha → sepsis grave → shock séptico (según disfunción orgánica e hipotensión).

### Protocolo "Hora de Oro"

Al activarse Código Sepsis y registrar la clasificación de shock, el sistema calcula automáticamente:

- Bolo de cristaloides (20 ml/kg, máx. 60 ml/kg)
- Antibioticoterapia empírica según edad (neonato vs. resto) y peso
- Drogas vasoactivas (regla del 0.6) en shock refractario
- Checklist de laboratorio crítico (hemocultivos, lactato, EAB, etc.)

---

## 🔌 API (resumen)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /auth/login | Login, retorna JWT |
| GET/POST | /pacientes/ | Listar / crear pacientes |
| PUT | /pacientes/{id} | Actualizar paciente y antecedentes |
| POST | /triaje/ | Crear triaje completo (motores de clasificación + sepsis) |
| GET | /triaje/ | Listar triajes |
| GET | /triaje/{id} | Detalle de triaje |
| GET | /triaje/{id}/sepsis | Resumen de evaluación de sepsis |
| PATCH | /triaje/{id}/sepsis/clasificacion | Registrar clasificación de shock |
| POST/GET/DELETE | /triaje/{id}/acciones/ | Acciones de enfermería |

Documentación interactiva completa en `/docs` (Swagger).

---

## 🧪 Tests

Tests unitarios (pytest) para los motores de triaje y sepsis, sin necesidad de base de datos:

```bash
docker compose exec backend pytest -v
```

Cubren los 5 niveles de triaje, el TEP, los factores de riesgo modificadores, los criterios SIRS (IPSCC), la clasificación de sepsis (sospecha / grave / shock séptico) y la clasificación de dolor (NIPS / FLACC / Wong-Baker / numérica).

---

## 🧭 Roadmap — próximos pasos

### Modelo clínico
- Evaluación de hidratación (con protocolo SRO)
- Flag Fast Track para niveles IV-V

### Operación hospitalaria
- Reevaluación de triaje (nueva toma de signos vitales)
- Cola de espera activa con tiempo transcurrido y alertas por nivel
- Registro de egreso (alta, internación, derivación, fuga)

### Mejoras
- Historial de triajes por paciente
- Filtros en dashboard (por nivel, fecha, sepsis activa)
- Exportación / impresión del triaje en PDF
- Tests automatizados para routers (API) y frontend

---

## 🔐 Seguridad

- Autenticación JWT con expiración de 8 horas (turno clínico)
- Control de acceso por rol (RBAC) en endpoints sensibles
- Variables sensibles fuera del control de versiones (`.env` en `.gitignore`)
- **Pendiente para producción**: tokens en cookies httpOnly (hoy en `localStorage`, decisión consciente de MVP), rotación de `SECRET_KEY` y credenciales por defecto

---

## ⚠️ Disclaimer

Este sistema es un soporte a la decisión clínica. No reemplaza el juicio profesional del equipo de salud.
