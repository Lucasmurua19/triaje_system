"use client";

interface Protocolo {
  titulo: string;
  subtitulo: string;
  color: "red" | "orange" | "yellow" | "green" | "blue";
  acciones: string[];
  reevaluacion: string;
  alarmas?: string[];
}

const PROTOCOLOS: Record<number, Protocolo> = {
  1: {
    titulo: "Emergencia",
    subtitulo: "Atención inmediata — sin demora",
    color: "red",
    acciones: [
      "Activar al médico / equipo de reanimación de INMEDIATO",
      "Apertura de vía aérea, posición supina",
      "Oxigenoterapia de alto flujo (mascarilla con reservorio)",
      "Monitoreo continuo: FC, FR, SpO₂, TA, ECG",
      "Acceso vascular periférico × 2 (IO si falla en < 60 seg)",
      "Preparar carro de paro y medicación de emergencia",
      "Desfibrilador encendido y disponible",
    ],
    reevaluacion: "Continua — cada 1 minuto",
  },
  2: {
    titulo: "Muy Urgente",
    subtitulo: "Evaluación médica en ≤ 10 minutos",
    color: "orange",
    acciones: [
      "Notificar al médico — debe evaluar en ≤ 10 minutos",
      "Monitoreo continuo de signos vitales",
      "Oxigenoterapia si SpO₂ < 94%",
      "Acceso venoso periférico",
      "Analgesia según protocolo si dolor",
      "Preparar material de vía aérea",
      "Posición semisentada o de confort según cuadro",
    ],
    reevaluacion: "Cada 10 minutos",
  },
  3: {
    titulo: "Urgente",
    subtitulo: "Evaluación médica en ≤ 30 minutos",
    color: "yellow",
    acciones: [
      "Evaluación médica en ≤ 30 minutos",
      "Control de signos vitales cada 15 minutos",
      "Antitérmico si temperatura ≥ 38.5 °C y mal estado general",
      "Analgesia si dolor moderado (EVA 4–7)",
      "Vía venosa periférica según indicación médica",
      "Posición de confort, reducir estímulos externos",
    ],
    reevaluacion: "Cada 15 minutos",
  },
  4: {
    titulo: "Menor Urgencia",
    subtitulo: "Evaluación médica en ≤ 60 minutos",
    color: "green",
    acciones: [
      "Evaluación médica en ≤ 60 minutos",
      "Reevaluación de enfermería cada 30 minutos",
      "Antitérmico oral si fiebre y buen estado general",
      "Analgesia leve según protocolo institucional",
      "Informar a la familia el tiempo estimado de espera",
      "Indicar signos de alarma que deben reportar",
    ],
    reevaluacion: "Cada 30 minutos",
    alarmas: [
      "Fiebre ≥ 40 °C o fiebre en menor de 3 meses",
      "Dificultad respiratoria o quejido",
      "Decaimiento marcado o llanto inconsolable",
      "Vómitos repetidos o no tolera líquidos",
      "Manchas en la piel (petequias o púrpura)",
      "Convulsión",
    ],
  },
  5: {
    titulo: "No Urgente",
    subtitulo: "Evaluación médica en ≤ 120 minutos",
    color: "blue",
    acciones: [
      "Evaluación médica en ≤ 120 minutos",
      "Sala de espera general",
      "Reevaluación si cambia el estado clínico",
      "Orientar consulta ambulatoria si el cuadro no justifica guardia",
      "Indicar signos de alarma a padres / cuidadores",
    ],
    reevaluacion: "Cada 60 minutos o si cambia la condición",
    alarmas: [
      "Fiebre ≥ 40 °C o fiebre en menor de 3 meses",
      "Dificultad respiratoria o quejido",
      "Decaimiento marcado o llanto inconsolable",
      "Vómitos repetidos o no tolera líquidos",
      "Manchas en la piel (petequias o púrpura)",
      "Convulsión",
    ],
  },
};

const ESTILOS = {
  red:    { header: "bg-red-600",    bullet: "bg-red-500",    card: "border-red-200    bg-red-50/40",    badge: "bg-red-100    text-red-700"    },
  orange: { header: "bg-orange-500", bullet: "bg-orange-400", card: "border-orange-200 bg-orange-50/40", badge: "bg-orange-100 text-orange-700" },
  yellow: { header: "bg-yellow-500", bullet: "bg-yellow-400", card: "border-yellow-200 bg-yellow-50/40", badge: "bg-yellow-100 text-yellow-800" },
  green:  { header: "bg-green-600",  bullet: "bg-green-500",  card: "border-green-200  bg-green-50/40",  badge: "bg-green-100  text-green-700"  },
  blue:   { header: "bg-blue-600",   bullet: "bg-blue-500",   card: "border-blue-200   bg-blue-50/40",   badge: "bg-blue-100   text-blue-700"   },
};

interface Props {
  nivel?: number;
}

export default function ProtocoloNivel({ nivel }: Props) {
  if (!nivel || !PROTOCOLOS[nivel]) return null;

  const proto = PROTOCOLOS[nivel];
  const e = ESTILOS[proto.color];

  return (
    <div className={`border rounded-xl overflow-hidden ${e.card}`}>
      {/* Header */}
      <div className={`${e.header} px-5 py-3 flex items-center justify-between`}>
        <div>
          <span className="font-bold text-white text-sm">Nivel {nivel} — {proto.titulo}</span>
          <p className="text-white/80 text-xs mt-0.5">{proto.subtitulo}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.badge} shrink-0`}>
          Reeval.: {proto.reevaluacion}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Acciones */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Acciones de enfermería
          </p>
          <ul className="space-y-1.5">
            {proto.acciones.map((accion, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className={`w-2 h-2 rounded-full ${e.bullet} mt-1.5 shrink-0`} />
                {accion}
              </li>
            ))}
          </ul>
        </div>

        {/* Signos de alarma para nivel 4–5 */}
        {proto.alarmas && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Informar a la familia — Volver de inmediato si aparece
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {proto.alarmas.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <span className="text-red-500 font-bold shrink-0 mt-px">!</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
