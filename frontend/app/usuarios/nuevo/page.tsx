"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import type { Rol } from "@/types";

interface UserOut {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  is_active: boolean;
}

const ROL_LABELS: Record<Rol, string> = {
  admin:    "Administrador",
  enfermera: "Enfermera/o",
  medico:   "Médico/a",
};

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const currentUser = getUser();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("enfermera");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState<UserOut | null>(null);

  if (currentUser?.rol !== "admin") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">Acceso restringido a administradores.</p>
            <Link href="/dashboard" className="btn-primary">Volver al inicio</Link>
          </div>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const nuevo = await api.post<UserOut>("/auth/register", {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
      });
      setExito(nuevo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el usuario");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setNombre("");
    setEmail("");
    setPassword("");
    setRol("enfermera");
    setError("");
    setExito(null);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-lg mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/dashboard" className="hover:text-gray-600">Inicio</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Registrar usuario</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Registrar usuario</h1>
          <p className="text-gray-500 text-sm mb-8">
            Creá una cuenta para un médico, enfermero/a u otro administrador.
          </p>

          {exito ? (
            <div className="card text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{exito.nombre}</p>
                <p className="text-gray-500 text-sm">{exito.email}</p>
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {ROL_LABELS[exito.rol]}
                </span>
              </div>
              <p className="text-green-600 text-sm font-medium">Usuario creado exitosamente</p>
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={resetForm} className="btn-primary">
                  Registrar otro
                </button>
                <Link href="/dashboard" className="btn-secondary">
                  Volver al inicio
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-5">
              <div>
                <label className="label">Nombre completo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: María González"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="usuario@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">Rol</label>
                <select
                  className="input"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                >
                  {(Object.entries(ROL_LABELS) as [Rol, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? "Creando..." : "Crear usuario"}
                </button>
                <Link href="/dashboard" className="btn-secondary">
                  Cancelar
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
