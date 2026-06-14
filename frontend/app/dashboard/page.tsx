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
    api.get<Triaje[]>("/triaje/?limit=50")
      .then((data) => {
        // Sepsis activos al tope, luego por fecha descendente
        const ordenados = [...data].sort((a, b) => {
          const sepA = a.evaluacion_sepsis?.activado ? 1 : 0;
          const sepB = b.evaluacion_sepsis?.activado ? 1 : 0;
          if (sepB !== sepA) return sepB - sepA;
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        setTriajes(ordenados);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sepsisCnt = triajes.filter((t) => t.evaluacion_sepsis?.activado).length;
  const nivel12Cnt = triajes.filter((t) => t.nivel && t.nivel <= 2).length;

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4 bg-blue-50 text-blue-700">
          <div>
            <p className="text-3xl font-bold">{triajes.length}</p>
            <p className="text-sm font-medium opacity-80">Total registrados</p>
          </div>
        </div>
        <div className={`card flex items-center gap-4 ${sepsisCnt > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-500"}`}>
          <div>
            <p className="text-3xl font-bold">{sepsisCnt}</p>
            <p className="text-sm font-medium opacity-80">Código Sepsis activos</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 bg-orange-50 text-orange-700">
          <div>
            <p className="text-3xl font-bold">{nivel12Cnt}</p>
            <p className="text-sm font-medium opacity-80">Nivel 1 – 2</p>
          </div>
        </div>
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
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Paciente</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Motivo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Nivel</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Espera</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Fecha</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {triajes.map((t) => {
                const esSepsis = t.evaluacion_sepsis?.activado;
                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      esSepsis
                        ? "bg-red-50 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-400 font-mono">{t.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      <div>
                        #{t.paciente_id}
                        {esSepsis && (
                          <span className="ml-2 text-xs font-bold text-red-600 animate-pulse">
                            🚨 CÓDIGO SEPSIS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {t.motivo_consulta}
                    </td>
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
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/triaje/${t.id}`}
                        className={`font-medium hover:underline ${esSepsis ? "text-red-600" : "text-blue-600"}`}
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
