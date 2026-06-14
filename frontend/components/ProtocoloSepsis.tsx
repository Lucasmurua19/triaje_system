"use client";
import type { ClasificacionShock, NivelSepsis } from "@/types";

interface Props {
  peso?: number;
  fechaNacimiento?: string;
  clasificacion?: ClasificacionShock;
  nivel: NivelSepsis;
}

function edadEnMeses(fechaNac?: string): number {
  if (!fechaNac) return 24;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  return (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
}

function fmtMg(mg: number): string {
  if (mg >= 1000) return `${(mg / 1000).toFixed(1)} g`;
  return `${Math.round(mg)} mg`;
}

// ── sub-componentes ─────────────────────────────────────────

function Card({
  titulo,
  color,
  children,
}: {
  titulo: string;
  color: "blue" | "purple" | "yellow" | "red" | "gray";
  children: React.ReactNode;
}) {
  const borde: Record<string, string> = {
    blue:   "border-blue-200   bg-blue-50/40",
    purple: "border-purple-200 bg-purple-50/40",
    yellow: "border-amber-200  bg-amber-50/40",
    red:    "border-red-200    bg-red-50/40",
    gray:   "border-gray-200   bg-gray-50/40",
  };
  const titulo_color: Record<string, string> = {
    blue:   "text-blue-800",
    purple: "text-purple-800",
    yellow: "text-amber-800",
    red:    "text-red-800",
    gray:   "text-gray-700",
  };
  return (
    <div className={`border rounded-xl p-4 ${borde[color]}`}>
      <h3 className={`font-semibold text-sm mb-3 ${titulo_color[color]}`}>{titulo}</h3>
      {children}
    </div>
  );
}

function Kv({ k, v, grande }: { k: string; v: string; grande?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{k}</p>
      <p className={`font-medium ${grande ? "text-blue-700 text-lg font-bold" : "text-sm text-gray-800"}`}>{v}</p>
    </div>
  );
}

function AntibRow({
  nombre, dosis, indicacion, alerta, principal,
}: {
  nombre: string; dosis: string; indicacion: string; alerta?: string; principal?: boolean;
}) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0 gap-2">
      <div>
        <span className={`text-sm font-semibold ${principal ? "text-purple-800" : "text-gray-800"}`}>
          {nombre}
        </span>
        {principal && (
          <span className="ml-1 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">1ª línea</span>
        )}
        <p className="text-xs text-gray-500">{indicacion}</p>
        {alerta && <p className="text-xs text-orange-600 font-medium">⚠ {alerta}</p>}
      </div>
      <span className="text-xs font-mono font-semibold text-gray-700 shrink-0">{dosis}</span>
    </div>
  );
}

// ── componente principal ────────────────────────────────────

export default function ProtocoloSepsis({ peso, fechaNacimiento, clasificacion, nivel }: Props) {
  const meses = edadEnMeses(fechaNacimiento);
  const esNeonato    = meses < 1;
  const esAdolescente = meses >= 144;

  // Fluidos
  const bolo    = peso ? Math.round(peso * 20) : null;
  const maxBolo = peso ? Math.round(peso * 60) : null;

  // Antibióticos (con tope)
  const ceftriaxona = peso ? Math.min(Math.round(peso * 100), 2000) : null;
  const cefotaxima  = peso ? Math.round(peso * 50) : null;
  const ampicilina  = peso ? Math.round(peso * 50) : null;
  const pipTazo     = peso ? Math.min(Math.round(peso * 100), 4500) : null;
  const vancomicina = peso ? Math.round(peso * 15) : null;

  // Vasoactivos (Regla 0.6)
  const vasoActivoDilucion = peso ? (peso * 0.6).toFixed(1) : null;
  const ketamina = peso ? `${Math.round(peso * 1)}–${Math.round(peso * 2)} mg` : "1–2 mg/kg";

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-bold text-gray-900">Protocolo clínico — Hora de Oro</h2>
        {clasificacion && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            clasificacion === "refractario"   ? "bg-red-100 text-red-700" :
            clasificacion === "descompensado" ? "bg-orange-100 text-orange-700" :
                                               "bg-yellow-100 text-yellow-700"
          }`}>
            Shock {clasificacion}
          </span>
        )}
      </div>

      {/* 1 - Resucitación hídrica */}
      <Card titulo="💧 Plan de resucitación hídrica" color="blue">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Kv
            k="Bolo inicial (SF 0.9%)"
            v={bolo ? `${bolo} ml` : "Peso × 20 ml"}
            grande={!!bolo}
          />
          <Kv k="Tiempo de infusión" v="5 – 10 minutos" />
          <Kv
            k="Máximo acumulado"
            v={maxBolo ? `${maxBolo} ml (${peso} kg × 60)` : "40 – 60 ml/kg"}
          />
          <Kv
            k="Meta diuresis"
            v={esAdolescente ? "> 0.5 ml/kg/h" : "> 1 ml/kg/h"}
          />
        </div>
        <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
          Evaluar rales crepitantes y hepatomegalia antes de repetir el bolo.
          Indicar sonda vesical para control de diuresis.
        </p>
      </Card>

      {/* 2 - Antibióticos */}
      <Card titulo="💊 Antibioticoterapia empírica" color="purple">
        {esNeonato ? (
          <>
            <AntibRow
              nombre="Cefotaxima"
              dosis={cefotaxima ? `${fmtMg(cefotaxima)} IV/IO` : "50 mg/kg IV/IO"}
              indicacion="Primera línea en neonatos"
              principal
            />
            <AntibRow
              nombre="Ampicilina"
              dosis={ampicilina ? `${fmtMg(ampicilina)} IV/IO` : "50 mg/kg IV/IO"}
              indicacion="Cubrir Listeria / foco abdominal"
            />
          </>
        ) : (
          <>
            <AntibRow
              nombre="Ceftriaxona"
              dosis={ceftriaxona ? `${fmtMg(ceftriaxona)} IV/IO` : "100 mg/kg IV (máx 2 g)"}
              indicacion="Foco no evidente · Sospecha meningococo"
              principal
            />
            <AntibRow
              nombre="Pip / Tazobactam"
              dosis={pipTazo ? `${fmtMg(pipTazo)} IV/IO` : "100 mg/kg IV (máx 4.5 g)"}
              indicacion="Foco abdominal · Inmunocomprometido"
            />
          </>
        )}
        <AntibRow
          nombre="Vancomicina"
          dosis={vancomicina ? `${fmtMg(vancomicina)} IV` : "15 mg/kg IV"}
          indicacion="Gram positivos / resistencia"
          alerta="Infundir lentamente en 1 hora"
        />
      </Card>

      {/* 3 - Microbiología */}
      <Card titulo="🧪 Microbiología y laboratorio crítico" color="yellow">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
          {[
            "Hemocultivos × 2",
            "Urocultivo por cateterismo",
            "Hemograma completo",
            "Función renal (urea, Cr)",
            "Coagulación (TP, KPTT)",
            "Estado ácido-base (EAB)",
            "Lactato sérico",
            "Glucemia",
          ].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-gray-700 py-0.5">
              <span className="w-3.5 h-3.5 rounded border border-gray-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
          Lactato &gt; 2 mmol/L → notificación crítica.
          Solicitar con etiqueta <strong>URGENTE — CÓDIGO SEPSIS</strong>.
        </p>
      </Card>

      {/* 4 - Vasoactivos (solo refractario) */}
      {clasificacion === "refractario" && (
        <>
          <Card titulo="💉 Drogas vasoactivas — Regla del 0.6" color="red">
            <div className="bg-gray-900 text-green-400 font-mono text-xs rounded-lg px-3 py-2 mb-3">
              {peso
                ? `${peso} kg × 0.6 = ${vasoActivoDilucion} mg → diluir en 50 ml SF ó D5%`
                : "Peso × 0.6 = mg → diluir en 50 ml SF ó D5%"}
              <br />
              <span className="text-gray-400">Infusión: 1 ml/h = 0.1 mcg/kg/min (dosis inicial)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="font-bold text-blue-800 text-sm">❄ Shock frío</p>
                <p className="text-xs text-blue-600 mb-2">
                  Extremidades frías · Pulso débil · Llene &gt; 3 seg
                </p>
                <p className="font-extrabold text-blue-900">Adrenalina</p>
                <p className="text-xs text-blue-700">Rango: 0.05 – 1 mcg/kg/min</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="font-bold text-orange-800 text-sm">🔥 Shock caliente</p>
                <p className="text-xs text-orange-600 mb-2">
                  Extremidades calientes · Pulso saltón · Llene &lt; 1 seg
                </p>
                <p className="font-extrabold text-orange-900">Noradrenalina</p>
                <p className="text-xs text-orange-700">Rango: 0.05 – 1 mcg/kg/min</p>
              </div>
            </div>
          </Card>

          {/* 5 - Soporte ventilatorio */}
          <Card titulo="🫁 Soporte ventilatorio" color="gray">
            <p className="text-xs font-semibold text-gray-700 mb-2">Criterios de intubación:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside mb-3">
              <li>Falla respiratoria franca</li>
              <li>Glasgow &lt; 8</li>
              <li>Shock refractario persistente</li>
              <li>Necesidad de reducir consumo metabólico de O₂</li>
            </ul>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs">
              <p className="font-semibold text-gray-700">Secuencia de Intubación Rápida (SIR)</p>
              <p className="text-gray-600 mt-0.5">
                Ketamina <span className="font-mono font-bold">{ketamina}</span> IV —{" "}
                menor riesgo de colapso hemodinámico por pérdida de precarga
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
