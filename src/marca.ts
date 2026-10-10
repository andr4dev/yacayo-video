// Marca de YaCayó: los tokens de yacayo-src/marca/tokens/tokens.css (v1.1), tal cual.
import { loadFont as cargarHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as cargarMono } from "@remotion/google-fonts/JetBrainsMono";

export const YC = {
  primario: "#2C2A6B",
  acento: "#E9A21F", // superficies y detalles; nunca texto sobre fondo claro
  logoMoneda: "#F4B92F",
  logoMonedaNegativo: "#F4C430",
  verificado: "#2A7A45",
  fraude: "#B3342A",
  sobreEstado: "#FFFFFF",
  fondoClaro: "#FAF7F0",
  fondoOscuro: "#1D1B17",
  superficie: "#FFFFFF",
  borde: "#E8E2D4",
  bordeSuave: "#F0EBE0",
  bordeControl: "#8F887A",
  texto: "#1D1B17",
  textoSecundario: "#4D483F",
  textoTerciario: "#6E685C",
  textoInvertido: "#FFFFFF",
} as const;

/** Un token con transparencia (como "--yc-acento al 15 %" de la skill). */
export const alfa = (color: string, opacidad: number) =>
  `color-mix(in srgb, ${color} ${Math.round(opacidad * 100)}%, transparent)`;

/** Hanken Grotesk para todo; los montos llevan `tabular-nums`. */
export const { fontFamily: FUENTE } = cargarHanken("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

/** JetBrains Mono solo para cuentas (···2002). */
export const { fontFamily: FUENTE_MONO } = cargarMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const NUMEROS = { fontVariantNumeric: "tabular-nums" } as const;
