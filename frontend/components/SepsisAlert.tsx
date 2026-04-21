"use client";
import { useEffect } from "react";
import type { SepsisResumen } from "@/types";

const CONFIG = {
  sin_sepsis: {
    bg: "bg-green-50",
    border: "border-green-300",
    icon: "✅",
    title: "Sin criterios de sepsis",
    titleColor: "text-green-800",
    badge: "bg-green-100 text-green-800",
  },
  sospecha: {
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    icon: "⚠️",
    title: "SOSPECHA DE SEPSIS",
    titleColor: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-800",
  },
  sepsis_grave: {
    bg: "bg-red-50",
    border: "border-red-500",
    icon: "🚨",
    title: "SEPSIS GRAVE — ACTIVAR CÓDIGO SEPSIS",
    titleColor: "text-red-800",
    badge: "bg-red-100 text-red-800",
  },
  shock_septico: {
    bg: "bg-red-100",
    border: "border-red-600",
    icon: "🆘",
    title: "SHOCK SÉPTICO — EMERGENCIA INMEDIATA",
    titleColor: "text-red-900",
    badge: "bg-red-200 text-red-900",
  },
};

export default function SepsisAlert({ data }: { data: SepsisResumen }) {
  const cfg = CONFIG[data.nivel];
  const isCritical = data.nivel === "sepsis_grave" || data.nivel === "shock_septico";

  // Alerta sonora al montar si es critico
  useEffect(() => {
    if (isCritical) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      [0, 300, 600].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay / 1000 + 0.4);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.5);
      });
    }
  }, [isCritical]);

  return (
    <div
      className={`border-2 rounded-2xl p-6 ${cfg.bg} ${cfg.border} ${
        isCritical ? "animate-pulse" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{cfg.icon}</span>
        <div>
          <h2 className={`text-xl font-bold ${cfg.titleColor}`}>{cfg.title}</h2>
          <p className="text-sm text-gray-600">
            {data.total_criterios_sirs} criterio{data.total_criterios_sirs !== 1 ? "s" : ""} SIRS
          </p>
        </div>
      </div>

      {/* Criterios positivos */}
      {data.criterios_positivos.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Criterios SIRS positivos:</p>
          <div className="flex flex-wrap gap-2">
            {data.criterios_positivos.map((c) => (
              <span key={c} className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {data.recomendaciones.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Acciones recomendadas:</p>
          <ul className="space-y-1.5">
            {data.recomendaciones.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 text-gray-400 font-mono">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCritical && (
        <div className="mt-4 text-xs text-gray-500 border-t border-red-200 pt-3">
          ⏱ Tiempo de activación registrado — Notificar al equipo médico inmediatamente
        </div>
      )}
    </div>
  );
}
