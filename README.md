# 🏥 Pediatric Triage & Sepsis Code System
### Sistema de Triaje Pediátrico Inteligente con Activación de Código Sepsis

---

## 📌 Descripción

Este proyecto implementa un **sistema de triaje pediátrico estructurado**, con un módulo crítico de **detección temprana y activación de Código Sepsis**, orientado a servicios de emergencia hospitalarios.

El sistema busca:

- Estandarizar la evaluación inicial
- Reducir la variabilidad clínica
- Detectar precozmente sepsis
- Mejorar tiempos de respuesta
- Aumentar la seguridad del paciente

Está diseñado para **integrarse con sistemas hospitalarios existentes (HIS)** y evolucionar hacia una arquitectura escalable tipo SaaS.

---

## 🎯 Objetivos

### Objetivo principal
Desarrollar un sistema clínico digital que permita realizar triaje pediátrico estructurado con detección automática de sepsis.

### Objetivos específicos

- Implementar triaje de 5 niveles
- Integrar Triángulo de Evaluación Pediátrica (TEP)
- Detectar criterios de sepsis en tiempo real
- Generar alertas clínicas automáticas
- Permitir trazabilidad y auditoría

---

## 🧠 Modelo Clínico

### 🔴 Triaje de 5 niveles

| Nivel | Prioridad | Tiempo |
|------|----------|--------|
| 1 | Emergencia | Inmediato |
| 2 | Muy urgente | < 10 min |
| 3 | Urgente | < 30 min |
| 4 | Menor urgencia | < 60 min |
| 5 | No urgente | > 120 min |

---

## 👶 Evaluación inicial (TEP)

- Apariencia
- Respiración
- Circulación

---

## 🚨 Código Sepsis (Core del sistema)

### Criterios de activación (simplificado)

- Fiebre o hipotermia
- Taquicardia
- Taquipnea
- Alteración del estado mental
- Perfusión alterada
- Sospecha de infección

### Clasificación

- 🟡 Sepsis sospechada
- 🔴 Sepsis grave / shock séptico

### Acciones automáticas

- Alerta visual y sonora
- Generación de checklist clínico
- Sugerencia de órdenes médicas:
  - Lactato
  - Hemocultivos
  - Antibióticos
  - Fluidoterapia

---

## ⚠️ Factores modificadores

- Edad < 3 meses
- Inmunosupresión
- Enfermedades crónicas
- Reconsulta
- Dolor severo

---

## 🔄 Flujo del sistema

1. Registro del paciente
2. Motivo de consulta
3. Evaluación TEP
4. Signos vitales
5. Factores de riesgo
6. Clasificación de triaje
7. Evaluación de sepsis
8. Activación automática (si corresponde)
9. Generación de recomendaciones clínicas

---

## 🧩 Arquitectura del sistema

### 🏗️ Arquitectura general

- Microservicios (orientado a escalabilidad)
- API-first design
- Event-driven (para alertas clínicas)

---

## ⚙️ Stack Tecnológico

### 🔹 Backend

- **FastAPI (Python)** → Alto rendimiento, ideal para prototipos clínicos
- Alternativa enterprise: **.NET Core Web API**

### 🔹 Base de datos

- **PostgreSQL**
- ORM: SQLAlchemy / Entity Framework

### 🔹 Frontend

- **Next.js + React**
- Tailwind CSS
- (Alternativa hospitalaria: WinForms o WPF)

### 🔹 Mensajería / Eventos

- **RabbitMQ** o **Kafka**
- Uso:
  - Alertas de sepsis
  - Notificaciones internas

### 🔹 Autenticación

- JWT
- OAuth2 (futuro)

### 🔹 Infraestructura

- Docker
- Docker Compose
- Kubernetes (escala)

### 🔹 CI/CD

- GitHub Actions

---

## 🗄️ Modelo de Datos (simplificado)

### Paciente
- id
- nombre
- edad
- sexo

### Triaje
- id
- paciente_id
- nivel
- motivo_consulta
- fecha

### SignosVitales
- fc
- fr
- satO2
- temp
- ta
- conciencia

### EvaluacionTEP
- apariencia
- respiracion
- circulacion

### Sepsis
- sospecha (bool)
- nivel (amarillo/rojo)
- lactato
- tiempo_activacion

---

## 📊 Módulos del sistema

### 1. Triaje
- Clasificación automática

### 2. Sepsis
- Motor de reglas clínicas
- Activación de código

### 3. Alertas
- Visuales
- Sonoras
- Eventos

### 4. Protocolos
- Checklist clínico
- Guías institucionales

### 5. Auditoría
- Logs clínicos
- Tiempos de respuesta

---

## 🚀 Escalabilidad

El sistema está preparado para:

- Multi-hospital (SaaS)
- Integración con HIS
- Uso en guardias móviles
- IA predictiva (futuro)

---

## 🔐 Seguridad

- Encriptación de datos
- Control de accesos por rol
- Auditoría de acciones
- Cumplimiento de normativa de datos

---

## 💡 Diferencial

- Basado en práctica real de emergencias pediátricas
- Integración directa con sepsis (no solo triaje)
- Diseño pensado para implementación real
- Potencial como producto SaaS

---

## 🧭 Roadmap

### Fase 1
- MVP de triaje + sepsis

### Fase 2
- UI clínica
- Validación con casos reales

### Fase 3
- Integración hospitalaria

### Fase 4
- SaaS multi-cliente

---

## 📌 Estado del proyecto

🚧 En desarrollo (MVP inicial)

---

## 👨‍⚕️ Autor

Proyecto basado en experiencia en emergencias pediátricas y desarrollo de software aplicado a salud.

---

## ⚠️ Disclaimer

Este sistema es un soporte a la decisión clínica.  
No reemplaza el juicio profesional.

---