"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Paciente } from "@/types";
import Sidebar from "@/components/Sidebar";

function calcularEdad(fechaNac: string) {
  const meses =
    (new Date().getFullYear() - new Date(fechaNac).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(fechaNac).getMonth());
  return meses < 24 ? `${meses} meses` : `${Math.floor(meses / 12)} años`;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  async function cargar(q?: string) {
    setLoading(true);
    const url = q ? `/pacientes/?busqueda=${encodeURIComponent(q)}` : "/pacientes/";
    const data = await api.get<Paciente[]>(url).catch(() => []);
    setPacientes(data);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
              <p className="text-gray-500 text-sm mt-1">{pacientes.length} registrados</p>
            </div>
            <Link href="/pacientes/nuevo" className="btn-primary flex items-center gap-2">
              ➕ Nuevo paciente
            </Link>
          </div>

          <div className="flex gap-2 mb-6">
            <input
              className="input flex-1"
              placeholder="Buscar por nombre, apellido o documento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && cargar(busqueda)}
            />
            <button onClick={() => cargar(busqueda)} className="btn-primary">Buscar</button>
            {busqueda && (
              <button onClick={() => { setBusqueda(""); cargar(); }} className="btn-secondary">
                Limpiar
              </button>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Cargando...</div>
            ) : pacientes.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 mb-4">Sin pacientes encontrados</p>
                <Link href="/pacientes/nuevo" className="btn-primary inline-flex">
                  Registrar paciente
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Paciente</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Edad</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Documento</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Grupo</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Alergias</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pacientes.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/pacientes/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {p.apellido}, {p.nombre}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {calcularEdad(p.fecha_nacimiento)}
                        <span className="ml-1 text-gray-400 capitalize">· {p.sexo}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{p.documento ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{p.grupo_sanguineo ?? "—"}</td>
                      <td className="px-6 py-4">
                        {p.alergias ? (
                          <span className="text-xs text-red-600 font-medium">{p.alergias}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <Link
                          href={`/pacientes/${p.id}`}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/triaje/nuevo?paciente=${p.id}`}
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          Triar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
