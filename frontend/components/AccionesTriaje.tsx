"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AccionTriaje, TipoAccion } from "@/types";

const TIPO_LABELS: Record<TipoAccion, string> = {
  analgesico:     "Analgésico",
  antipiretico:   "Antitérmico",
  sro:            "SRO",
  oxigeno:        "O₂ aplicado",
  inmovilizacion: "Inmovilización",
  limpieza_herida:"Limpieza de herida",
  otro:           "Otro",
};

const TIPO_COLORS: Record<TipoAccion, string> = {
  analgesico:     "bg-purple-100 text-purple-700",
  antipiretico:   "bg-orange-100 text-orange-700",
  sro:            "bg-blue-100 text-blue-700",
  oxigeno:        "bg-sky-100 text-sky-700",
  inmovilizacion: "bg-yellow-100 text-yellow-700",
  limpieza_herida:"bg-green-100 text-green-700",
  otro:           "bg-gray-100 text-gray-700",
};

interface Props {
  triajeId: number;
  acciones: AccionTriaje[];
}

const horaActual = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export default function AccionesTriaje({ triajeId, acciones: inicial }: Props) {
  const [acciones, setAcciones] = useState<AccionTriaje[]>(inicial);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [tipo, setTipo] = useState<TipoAccion>("analgesico");
  const [dosis, setDosis] = useState("");
  const [detalle, setDetalle] = useState("");
  const [hora, setHora] = useState(horaActual);

  function resetForm() {
    setTipo("analgesico");
    setDosis("");
    setDetalle("");
    setHora(horaActual());
    setError("");
    setMostrarForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const fechaHora = hora
        ? new Date(`${new Date().toISOString().slice(0, 10)}T${hora}:00`).toISOString()
        : null;

      const nueva = await api.post<AccionTriaje>(`/triaje/${triajeId}/acciones/`, {
        tipo_accion: tipo,
        dosis: dosis.trim() || null,
        detalle: detalle.trim() || null,
        hora_administracion: fechaHora,
      });
      setAcciones((prev) => [...prev, nueva]);
      resetForm();
    } catch {
      setError("No se pudo guardar la acción.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(accionId: number) {
    try {
      await api.delete(`/triaje/${triajeId}/acciones/${accionId}`);
      setAcciones((prev) => prev.filter((a) => a.id !== accionId));
    } catch {
      // silencioso — la acción sigue visible
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Acciones de enfermería</h2>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="btn-primary text-sm py-1.5 px-3"
          >
            + Registrar acción
          </button>
        )}
      </div>

      {/* Lista de acciones */}
      {acciones.length === 0 && !mostrarForm && (
        <p className="text-gray-400 text-sm">Sin acciones registradas.</p>
      )}

      {acciones.length > 0 && (
        <ul className="space-y-2 mb-4">
          {acciones.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${TIPO_COLORS[a.tipo_accion]}`}
                >
                  {TIPO_LABELS[a.tipo_accion]}
                </span>
                <div className="text-sm">
                  {a.dosis && (
                    <span className="font-medium text-gray-800">{a.dosis}</span>
                  )}
                  {a.detalle && (
                    <span className="text-gray-500 ml-1">— {a.detalle}</span>
                  )}
                  {a.hora_administracion && (
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {new Date(a.hora_administracion).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleEliminar(a.id)}
                className="text-gray-300 hover:text-red-500 text-xs shrink-0 mt-0.5"
                title="Eliminar"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario inline */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo de acción</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAccion)}
              >
                {(Object.keys(TIPO_LABELS) as TipoAccion[]).map((k) => (
                  <option key={k} value={k}>
                    {TIPO_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Hora de administración</label>
              <input
                type="time"
                className="input"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dosis / cantidad</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: 200 mg, 2 L/min"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Detalle / observación</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: vía oral, mascarilla"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary text-sm" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={resetForm}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
