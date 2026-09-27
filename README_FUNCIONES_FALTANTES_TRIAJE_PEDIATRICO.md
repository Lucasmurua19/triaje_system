# Funciones faltantes sugeridas para el sistema de triaje pediátrico

## Objetivo

Este documento reúne únicamente las ideas funcionales del PDF **“Triaje de Urgencias de Pediatría” (SEUP, 4.ª edición, 2024)** que no aparecen implementadas completamente en el README actual del proyecto.

No modifica ni reemplaza el README principal. Se puede utilizar como backlog clínico-funcional para próximas versiones.

## Funciones existentes que no se repiten aquí

El proyecto ya documenta:

- triaje pediátrico de cinco niveles;
- rangos de signos vitales por grupos etarios;
- Triángulo de Evaluación Pediátrica (TEP);
- factores de riesgo y modificadores del nivel;
- detección SIRS y Código Sepsis;
- protocolo “Hora de Oro”;
- protocolos de Enfermería por nivel;
- antecedentes, alergias y medicación habitual;
- acciones de triaje avanzado;
- escalas pediátricas de dolor;
- evaluación de hidratación y planes A/B/C;
- códigos de activación de Trauma, Convulsiones, Anafilaxia, PCR y Dificultad Respiratoria Grave;
- autenticación y permisos por rol;
- dashboard con priorización de sepsis;
- pruebas automatizadas del motor clínico.

## Resumen de brechas

| Prioridad | Función faltante o incompleta | Beneficio principal |
|---|---|---|
| P0 | Confirmación profesional del nivel | Evita que el algoritmo sustituya el juicio clínico |
| P0 | Modo de paciente crítico | Permite atender antes de completar el formulario |
| P0 | Reevaluación y reclasificación | Detecta deterioro durante la espera |
| P0 | Línea temporal completa | Permite medir demoras y reconstruir el episodio |
| P0 | Auditoría clínica inalterable | Aporta seguridad y trazabilidad |
| P1 | Ubicación y transferencia SBAR | Mejora el flujo y la continuidad asistencial |
| P1 | Cola de espera clínica activa | Prioriza por urgencia, demora y deterioro |
| P1 | Información a la familia | Facilita aviso precoz de cambios durante la espera |
| P1 | ✅ Alertas clínicas adicionales (Trauma, Convulsiones, Anafilaxia, PCR, Dificultad Respiratoria Grave) — implementado | Extiende el modelo más allá de sepsis |
| P1 | Gobierno del triaje avanzado | Controla protocolos, permisos y contraindicaciones |
| P1 | Versionado de reglas clínicas | Permite auditar qué algoritmo tomó cada decisión |
| P1 | Indicadores de calidad | Hace evaluable el funcionamiento del triaje |
| P2 | Gestión de congestión | Permite adaptar la operación sin cambiar la prioridad clínica |
| P2 | Modo de contingencia | Mantiene el triaje ante caída del sistema o de la red |
| P2 | Capacitación y gestor de triaje | Controla habilitaciones y dudas operativas |

---

## P0 — Funciones críticas

### 1. Confirmación o modificación profesional del nivel

El motor no debería guardar el nivel sugerido como decisión definitiva sin intervención profesional.

**Función propuesta:**

- mostrar el nivel sugerido por el algoritmo;
- explicar qué datos lo determinaron: TEP, signos vitales, dolor, edad y factores de riesgo;
- permitir a Enfermería confirmar, aumentar o disminuir el nivel;
- exigir una justificación cuando el nivel confirmado difiera del sugerido;
- registrar profesional, fecha y hora de la decisión;
- impedir que el sistema bloquee una prioridad mayor elegida por el profesional.

**Datos mínimos:**

- `nivel_sugerido`;
- `nivel_confirmado`;
- `factores_determinantes`;
- `motivo_modificacion`;
- `confirmado_por`;
- `confirmado_en`.

### 2. Modo “Paciente crítico / atención inmediata”

El PDF indica que el triaje no debe retrasar la asistencia de un paciente inestable.

**Función propuesta:**

- botón visible desde el inicio del proceso;
- activación de alerta y aviso al área crítica;
- ubicación inmediata en Shock Room o sala de estabilización;
- registro automático de la hora de detección y traslado;
- posibilidad de omitir temporalmente campos no esenciales;
- estado `triaje_pendiente_de_completar` para finalizar el registro después.

### 3. Reevaluación y reclasificación

El README actual incluye la reevaluación en el roadmap, pero todavía no como función implementada.

**Función propuesta:**

- crear una cola de reevaluación para pacientes que continúan esperando;
- calcular el próximo control según nivel y reglas institucionales;
- generar avisos de reevaluación próxima, vencida u omitida;
- registrar nuevamente TEP, dolor, signos vitales y cambios clínicos relevantes;
- comparar automáticamente con la valoración anterior;
- permitir cambiar nivel y ubicación;
- conservar todas las clasificaciones previas;
- permitir una reevaluación no programada por deterioro o aviso de la familia.

**Nunca sobrescribir la evaluación anterior.** Cada reevaluación debe ser un nuevo registro vinculado al triaje inicial.

### 4. Línea temporal clínica y operativa

Para medir calidad y reconstruir el episodio faltan marcas temporales normalizadas.

**Registrar automáticamente:**

- llegada al servicio;
- primer contacto clínico;
- inicio y fin del triaje;
- asignación y confirmación del nivel;
- activación y recepción de alertas;
- inicio de intervenciones;
- cambio de ubicación;
- cada reevaluación;
- inicio de atención médica;
- egreso, derivación, internación o abandono.

### 5. Auditoría clínica inalterable

El control de acceso por rol ya existe, pero falta una auditoría clínica completa.

**Función propuesta:**

- registrar creación, consulta y modificación de datos sensibles;
- guardar sugerencias generadas por el motor;
- registrar cambios de nivel, alertas, acciones y ubicaciones;
- realizar correcciones mediante enmiendas, sin borrar el valor original;
- mostrar quién cambió qué dato, cuándo y por qué;
- diferenciar información capturada en tiempo real de información cargada retrospectivamente.

---

## P1 — Funciones de seguridad y operación

### 6. Sugerencia de ubicación y transferencia SBAR

Además de asignar un nivel, el sistema debería orientar el destino inicial.

**Ubicaciones configurables:**

- Shock Room o sala de estabilización;
- boxes;
- consulta rápida;
- sala de curas o traumatología;
- sala de espera;
- circuito respiratorio, infeccioso u otro aprobado.

Debe registrarse la ubicación sugerida, la ubicación real y el motivo del cambio.

Para traslados o pacientes críticos, generar un resumen **SBAR**:

- situación actual;
- antecedentes relevantes;
- TEP y valoración;
- nivel de prioridad;
- alertas activas;
- intervenciones realizadas;
- recomendación o motivo del traslado.

### 7. Cola de espera clínica activa

El dashboard actual prioriza Código Sepsis. Falta una vista operativa general.

**Mostrar:**

- nivel confirmado;
- tiempo desde llegada y desde triaje;
- TEP normal o alterado;
- alertas activas;
- ubicación;
- próxima reevaluación;
- reevaluación vencida;
- deterioro o reclasificación;
- estado de atención.

La cola debe ordenarse por prioridad clínica y riesgo, no únicamente por hora de llegada.

### 8. Información y participación de la familia

El PDF considera a la familia parte de la vigilancia durante la espera.

**Función propuesta:**

- registrar que se explicó la prioridad y el circuito asignado;
- informar un tiempo aproximado de espera cuando sea posible;
- mostrar instrucciones para avisar ante cambios o síntomas nuevos;
- generar una hoja o pantalla breve con signos de alarma;
- admitir materiales por idioma y necesidades de accesibilidad.

### 9. Motor común de alertas clínicas

✅ **Implementado (primera tanda).** El proyecto reutilizó la arquitectura de Código Sepsis (motor de criterios + activación + recomendaciones, al estilo de `sepsis_service.py`) para cinco nuevos códigos de activación, cada uno con su propio modelo, motor de reglas y endpoint, evaluados bajo demanda desde el detalle del triaje:

- **Código Trauma** — criterios fisiológicos (Glasgow < 9, inestabilidad hemodinámica, dificultad respiratoria severa) y anatómicos (trauma penetrante mayor, amputación/lesión vascular, fracturas múltiples, quemadura extensa o de vía aérea) + mecanismo de lesión de alto riesgo;
- **Código Convulsiones** — estado convulsivo (definición operacional ILAE): actividad continua > 5 min o convulsiones repetidas sin recuperación de conciencia;
- **Código Anafilaxia** — criterios diagnósticos NIAID/WAO 2006 (afectación piel/mucosas + compromiso respiratorio o cardiovascular; o ≥2 sistemas tras exposición a alérgeno; o hipotensión tras alérgeno conocido), con subclasificación de shock anafiláctico;
- **Código PCR** — sin respuesta + sin respiración/gasping + sin pulso palpable o bradicardia severa con mala perfusión (guía PALS);
- **Código Dificultad Respiratoria Grave** — ≥2 signos de trabajo respiratorio severo, o cualquier signo de falla respiratoria inminente (SatO2 < 90% con O2, alteración de conciencia por hipoxia, silencio auscultatorio/estridor severo, cianosis).

**Pendiente para una segunda vuelta:** que la activación de estos códigos escale automáticamente el nivel de triaje (hoy solo se muestra como alerta visual, igual que hacía Código Sepsis antes de `escalar_por_shock_septico`); registro de confirmación/cierre por un profesional; versión de la regla utilizada en cada evaluación (ver ítems 1 y 11 de este documento).

También aplica a otros escenarios todavía no incorporados: shock (no séptico) y deterioro neurológico.

Cada alerta debería definir:

- criterios de activación;
- gravedad;
- destinatarios;
- confirmación de recepción;
- acciones permitidas;
- tiempo de respuesta;
- cierre y motivo de cierre;
- versión de la regla utilizada.

Una alerta automática debe entenderse como apoyo clínico y no como diagnóstico definitivo.

### 10. Gobierno del triaje avanzado

Las acciones de triaje avanzado ya existen, pero conviene agregar controles de seguridad.

**Funciones faltantes:**

- vincular cada acción con un protocolo institucional vigente;
- guardar nombre y versión del protocolo;
- verificar alergias, contraindicaciones y límites de dosis;
- diferenciar dosis sugerida, confirmada y administrada;
- exigir confirmación de un profesional habilitado;
- restringir acciones según rol y capacitación vigente;
- registrar respuesta clínica y posibles eventos adversos.

### 11. Versionado de reglas clínicas

Los rangos por edad, modificadores, criterios SIRS, escalas y protocolos pueden cambiar.

**Función propuesta:**

- versionar tablas de signos vitales;
- versionar discriminadores y reglas de nivel;
- versionar criterios de alertas;
- versionar escalas y protocolos;
- definir fecha de entrada en vigencia;
- conservar en cada triaje la versión utilizada;
- impedir modificaciones directas de una versión ya aplicada a pacientes.

### 12. Indicadores automáticos de calidad

El sistema debería transformar sus marcas temporales y registros en métricas.

**Indicadores sugeridos:**

1. tiempo desde llegada hasta primera valoración;
2. duración del triaje;
3. demora hasta atención médica por nivel;
4. porcentaje de niveles II y III atendidos dentro del objetivo institucional;
5. porcentaje de reevaluaciones realizadas en término;
6. cantidad y causa de reclasificaciones;
7. proporción de sobretriaje e infratriaje determinada por auditoría;
8. abandono antes del triaje o antes de la atención médica;
9. porcentaje de pacientes con dolor correctamente documentado;
10. tiempo hasta la primera intervención analgésica;
11. activaciones de alertas y tiempo de respuesta;
12. ingreso, estudios, ubicación y estancia por nivel;
13. diferencias entre nivel sugerido y nivel confirmado.

Los objetivos numéricos deben ser configurables y aprobados por la institución.

---

## P2 — Funciones organizativas y de resiliencia

### 13. Gestión de congestión

El sistema debería permitir activar modos operativos sin alterar las reglas clínicas de prioridad.

**Posibles funciones:**

- segundo puesto de triaje;
- evaluación inicial rápida;
- distribución por circuitos;
- alertas por saturación;
- refuerzo de personal;
- modo estacional o epidémico;
- registro de inicio, fin y responsable de la contingencia.

### 14. Continuidad ante caída del sistema

**Función propuesta:**

- formulario mínimo de contingencia;
- identificación del paciente;
- TEP, nivel, hora, ubicación y profesional;
- funcionamiento temporal sin conexión, si la infraestructura lo permite;
- carga y conciliación posterior;
- prevención de episodios duplicados;
- identificación visible de datos cargados retrospectivamente.

### 15. Capacitación y gestor de triaje

El PDF recomienda personal específicamente formado y una figura de referencia operativa.

**Función propuesta:**

- registrar formación inicial;
- registrar evaluaciones y turnos tutorizados;
- controlar vencimiento de capacitaciones;
- habilitar funciones sensibles solamente a personal autorizado;
- identificar al gestor de triaje de cada turno;
- ofrecer un canal de consulta o escalamiento al gestor.

---

## Configuraciones que no deberían quedar fijas en el código

Requieren parametrización y validación institucional:

- nombres y colores de los cinco niveles;
- tiempos máximos de atención;
- intervalos de reevaluación;
- rangos fisiológicos por edad;
- modificadores y discriminadores;
- correspondencia entre nivel y ubicación;
- criterios y destinatarios de alertas;
- protocolos de triaje avanzado;
- permisos y responsabilidades profesionales;
- objetivos de los indicadores de calidad.

## Orden de implementación recomendado

### Primera entrega

1. confirmación profesional del nivel;
2. modo de paciente crítico;
3. reevaluación y reclasificación;
4. línea temporal;
5. auditoría clínica.

### Segunda entrega

1. ubicación y SBAR;
2. cola clínica activa;
3. información a familias;
4. ✅ nuevos códigos de activación (Trauma, Convulsiones, Anafilaxia, PCR, Dificultad Respiratoria Grave) — implementado; queda escalar automáticamente el nivel de triaje al activarse;
5. controles del triaje avanzado;
6. versionado clínico.

### Tercera entrega

1. indicadores;
2. gestión de congestión;
3. contingencia;
4. capacitación y gestor de triaje;
5. validación prospectiva de concordancia, sobretriaje e infratriaje.

## Criterio general de seguridad

Estas funciones deben implementarse como apoyo a la decisión. El sistema no debe reemplazar el criterio profesional, emitir diagnósticos definitivos ni ejecutar prescripciones o intervenciones de manera autónoma.

## Fuente

Fernández Landaluce A. **Triaje de Urgencias de Pediatría**. En: *Protocolos diagnósticos y terapéuticos en Urgencias de Pediatría*. 4.ª ed. Sociedad Española de Urgencias de Pediatría; 2024.

Documento analizado: `1_Triaje_4ed.pdf`.
