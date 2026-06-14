"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ClasificacionShock } from "@/types";

const OPCIONES: { value: ClasificacionShock; label: string; desc: string }[] = [
  {
    value: "compensado",
    label: "Shock compensado",
    desc: "Signos de hipoperfusión · TA normal para la edad",
  },
  {
    value: "descompensado",
    label: "Shock descompensado",
    desc: "Hipoperfusión · Hipotensión arterial",
  },
  {
    value: "refractario",
    label: "Shock refractario",
    desc: "Persiste tras ≥ 40 ml/kg de fluidos",
  },
];

interface Props {
  triajeId: number;
  nivelSepsis: string;
  onConfirm: (clasificacion: ClasificacionShock) => void;
}

export default function SepsisCodeModal({ triajeId, nivelSepsis, onConfirm }: Props) {
  const [clasificacion, setClasificacion] = useState<ClasificacionShock>("compensado");
  const [guardando, setGuardando] = useState(false);

  const labelNivel: Record<string, string> = {
    sospecha:      "Sospecha de sepsis",
    sepsis_grave:  "Sepsis grave",
    shock_septico: "Shock séptico",
  };

  async function handleConfirm() {
    setGuardando(true);
    try {
      await api.patch(`/triaje/${triajeId}/sepsis/clasificacion`, {
        clasificacion_shock: clasificacion,
      });
    } catch {
      // confirma localmente aunque falle la red
    } finally {
      setGuardando(false);
      onConfirm(clasificacion);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/85 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">

        {/* Header rojo */}
        <div className="bg-red-600 px-6 py-5 text-center">
          <p className="text-4xl animate-pulse mb-2">🚨</p>
          <h2 className="text-xl font-extrabold text-white tracking-wide">
            CÓDIGO SEPSIS PEDIÁTRICA
          </h2>
          <p className="text-red-200 text-sm mt-1">
            {labelNivel[nivelSepsis] ?? nivelSepsis} detectada
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Aviso clínico */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-800 text-sm">
              ⚠ Reclasifique al paciente de forma inmediata.
            </p>
            <p className="text-red-700 text-sm mt-1">
              Destino sugerido:{" "}
              <span className="font-bold">SHOCKROOM / REANIMACIÓN</span>
            </p>
          </div>

          {/* Clasificación hemodinámica */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Clasificación hemodinámica actual:
            </p>
            <div className="space-y-2">
              {OPCIONES.map((op) => (
                <label
                  key={op.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    clasificacion === op.value
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cls"
                    value={op.value}
                    checked={clasificacion === op.value}
                    onChange={() => setClasificacion(op.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{op.label}</p>
                    <p className="text-xs text-gray-500">{op.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Botón confirmación */}
          <button
            onClick={handleConfirm}
            disabled={guardando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {guardando ? "Guardando..." : "Confirmar — He tomado conocimiento"}
          </button>
        </div>
      </div>
    </div>
  );
}
