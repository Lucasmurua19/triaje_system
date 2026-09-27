"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { NivelTriaje, Triaje } from "@/types";
import NivelBadge from "@/components/NivelBadge";

const NIVELES: NivelTriaje[] = [1, 2, 3, 4, 5];

interface Props {
  triaje: Triaje;
  onConfirmado: (actualizado: Triaje) => void;
}

export default function ConfirmarNivel({ triaje, onConfirmado }: Props) {
  // Triajes creados antes de esta funcionalidad no tienen nivel_sugerido guardado —
  // se usa el nivel vigente como referencia para no romper la vista.
  const sugerido = triaje.nivel_sugerido ?? triaje.nivel;
  const [seleccion, setSeleccion] = useState<NivelTriaje | undefined>(sugerido);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const difiere = seleccion !== undefined && seleccion !== sugerido;

  // Ya confirmado — mostrar solo un resumen compacto
  if (triaje.nivel_confirmado_en) {
    return (
      <div className="flex items-start justify-between gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
        <div>
          <span className="text-gray-500">Nivel confirmado por </span>
          <span className="font-medium text-gray-800">{triaje.nivel_confirmado_por ?? "profesional"}</span>
          {triaje.motivo_modificacion_nivel && (
            <p className="text-xs text-gray-500 mt-1">
              Modificado respecto al sugerido ({triaje.nivel_sugerido}): {triaje.motivo_modificacion_nivel}
            </p>
          )}
        </div>
        <NivelBadge nivel={triaje.nivel} />
      </div>
    );
  }

  async function handleConfirmar() {
    if (seleccion === undefined) return;
    if (difiere && !motivo.trim()) {
      setError("Justificá por qué el nivel confirmado difiere del sugerido por el sistema.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const actualizado = await api.patch<Triaje>(`/triaje/${triaje.id}/confirmar-nivel`, {
        nivel_confirmado: seleccion,
        motivo_modificacion: difiere ? motivo.trim() : null,
      });
      onConfirmado(actualizado);
    } catch {
      setError("No se pudo confirmar el nivel. Reintentá.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="border-2 border-amber-300 bg-amber-50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-amber-900">Confirmación profesional del nivel</h2>
        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-medium">
          Nivel sugerido: {sugerido}
        </span>
      </div>

      {triaje.factores_determinantes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-800 mb-1.5">Basado en:</p>
          <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside">
            {triaje.factores_determinantes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">Nivel a confirmar:</p>
        <div className="flex flex-wrap gap-2">
          {NIVELES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSeleccion(n)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                seleccion === n
                  ? "border-amber-500 bg-amber-100 text-amber-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <NivelBadge nivel={n} />
            </button>
          ))}
        </div>
      </div>

      {difiere && (
        <div>
          <label className="label">Motivo de la modificación (obligatorio)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Ej: paciente con antecedente oncológico no capturado por el sistema, se prioriza clínicamente"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleConfirmar}
        disabled={guardando || seleccion === undefined}
        className="btn-primary text-sm disabled:opacity-60"
      >
        {guardando ? "Confirmando..." : "Confirmar nivel"}
      </button>
    </div>
  );
}
