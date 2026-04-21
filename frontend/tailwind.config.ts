import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nivel: {
          1: "#dc2626", // emergencia
          2: "#ea580c", // muy urgente
          3: "#ca8a04", // urgente
          4: "#16a34a", // menor urgencia
          5: "#2563eb", // no urgente
        },
      },
      animation: {
        "pulse-fast": "pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
