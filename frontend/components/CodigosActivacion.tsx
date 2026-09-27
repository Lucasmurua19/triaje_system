"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CodigoActivacionResumen } from "@/types";
import { CODIGOS_ACTIVACION, type CodigoConfig } from "@/lib/codigosActivacion";

const COLOR_STYLES: Record<"naranja" | "rojo", { bg: string; border: string; title: string; badge: string }> = {
  naranja: {
    bg: "bg-orange-50",
    border: "border-orange-400",
    title: "text-orange-800",
    badge: "bg-orange-100 text-orange-800",
  },
  rojo: {
    bg: "bg-red-50",
    border: "border-red-500",
    title: "text-red-800",
    badge: "bg-red-100 text-red-800",
  },
};

interface Props {
  triajeId: number;
}

function ChecklistForm({
  codigo,
  onResultado,
  onCancelar,
  triajeId,
}: {
  codigo: CodigoConfig;
  onResultado: (r: CodigoActivacionResumen) => void;
  onCancelar: () => void;
  triajeId: number;
}) {
  const [valores, setValores] = useState<Record<string, boolean>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function toggle(key: string) {
    setValores((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const resultado = await api.post<CodigoActivacionResumen>(
        `/triaje/${triajeId}/codigos-activacion/${codigo.endpoint}`,
        valores
      );
      onResultado(resultado);
    } catch {
      setError("No se pudo registrar la evaluación.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">
        {codigo.icono} Criterios — {codigo.nombre}
      </p>
      <div className="space-y-2">
        {codigo.criterios.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={valores[c.key] ?? false}
              onChange={() => toggle(c.key)}
              className="rounded border-gray-300"
            />
            {c.label}
          </label>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary text-sm" disabled={guardando}>
          {guardando ? "Evaluando..." : "Evaluar"}
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ResultadoCard({ resultado, onCerrar }: { resultado: CodigoActivacionResumen; onCerrar: () => void }) {
  if (!resultado.activado || resultado.color_alerta === "verde") {
    // Sin valor clinico mostrar un cartel persistente para un codigo no activado —
    // solo una confirmacion breve, no un cartel de "todo bien".
    return (
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span>{resultado.nombre}: sin criterios de activación.</span>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
    );
  }

  const estilo = COLOR_STYLES[resultado.color_alerta as "naranja" | "rojo"];

  return (
    <div className={`border-2 rounded-2xl p-6 ${estilo.bg} ${estilo.border} animate-pulse`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-lg font-bold ${estilo.title}`}>
          🚨 {resultado.nombre.toUpperCase()} — ACTIVO
        </h2>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      {resultado.criterios_positivos.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Criterios positivos:</p>
          <div className="flex flex-wrap gap-2">
            {resultado.criterios_positivos.map((c) => (
              <span key={c} className={`text-xs font-medium px-2.5 py-1 rounded-full ${estilo.badge}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Acciones recomendadas:</p>
        <ul className="space-y-1.5">
          {resultado.recomendaciones.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-0.5 text-gray-400 font-mono">{i + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CodigosActivacion({ triajeId }: Props) {
  const [resultados, setResultados] = useState<CodigoActivacionResumen[]>([]);
  const [codigoAbierto, setCodigoAbierto] = useState<CodigoConfig | null>(null);

  useEffect(() => {
    api
      .get<CodigoActivacionResumen[]>(`/triaje/${triajeId}/codigos-activacion`)
      .then((r) => setResultados(r.filter((x) => x.activado)))
      .catch(() => {});
  }, [triajeId]);

  function handleResultado(r: CodigoActivacionResumen) {
    setResultados((prev) => [...prev.filter((x) => x.tipo_codigo !== r.tipo_codigo), r]);
    setCodigoAbierto(null);
  }

  function handleCerrar(tipo: string) {
    setResultados((prev) => prev.filter((x) => x.tipo_codigo !== tipo));
  }

  return (
    <div className="space-y-4">
      {resultados.map((r) => (
        <ResultadoCard key={r.tipo_codigo} resultado={r} onCerrar={() => handleCerrar(r.tipo_codigo)} />
      ))}

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Códigos de activación</h2>
        <p className="text-xs text-gray-400 mb-3">
          Evaluar solo si el cuadro clínico lo amerita — cada código es independiente del motor de sepsis.
        </p>

        {!codigoAbierto && (
          <div className="flex flex-wrap gap-2">
            {CODIGOS_ACTIVACION.map((c) => (
              <button
                key={c.tipo}
                onClick={() => setCodigoAbierto(c)}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                {c.icono} {c.nombre}
              </button>
            ))}
          </div>
        )}

        {codigoAbierto && (
          <ChecklistForm
            codigo={codigoAbierto}
            triajeId={triajeId}
            onResultado={handleResultado}
            onCancelar={() => setCodigoAbierto(null)}
          />
        )}
      </div>
    </div>
  );
}
