"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Triaje } from "@/types";
import NivelBadge from "@/components/NivelBadge";

export default function DashboardPage() {
  const [triajes, setTriajes] = useState<Triaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Triaje[]>("/triaje/?limit=20")
      .then(setTriajes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Triajes recientes</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de atenciones del turno</p>
        </div>
        <Link href="/triaje/nuevo" className="btn-primary flex items-center gap-2">
          <span>➕</span> Nuevo Triaje
        </Link>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total hoy", value: triajes.length, color: "bg-blue-50 text-blue-700" },
          { label: "Sepsis activos", value: 0, color: "bg-red-50 text-red-700" },
          { label: "Nivel 1-2", value: triajes.filter(t => t.nivel && t.nivel <= 2).length, color: "bg-orange-50 text-orange-700" },
        ].map((stat) => (
          <div key={stat.label} className={`card flex items-center gap-4 ${stat.color}`}>
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Listado de triajes</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : triajes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Sin triajes registrados</p>
            <Link href="/triaje/nuevo" className="btn-primary inline-flex">
              Registrar primer triaje
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Paciente ID</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Motivo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Nivel</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Espera</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Fecha</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {triajes.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-400 font-mono">{t.id}</td>
                  <td className="px-6 py-4 font-medium">{t.paciente_id}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{t.motivo_consulta}</td>
                  <td className="px-6 py-4">
                    <NivelBadge nivel={t.nivel as 1 | 2 | 3 | 4 | 5 | undefined} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {t.tiempo_espera_minutos !== undefined
                      ? t.tiempo_espera_minutos === 0
                        ? "Inmediato"
                        : `${t.tiempo_espera_minutos} min`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(t.fecha).toLocaleString("es-AR", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/triaje/${t.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
