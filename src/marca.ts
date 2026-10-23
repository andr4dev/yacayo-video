// Marca de YaCayó: los tokens de yacayo-src/marca/tokens/tokens.css (v1.1), tal cual.
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

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
  textoSobrePrimario: "#FFFFFF", // v1.2: el texto y los íconos sobre el botón principal
} as const;

/** Un token con transparencia (como "--yc-acento al 15 %" de la skill). */
export const alfa = (color: string, opacidad: number) =>
  `color-mix(in srgb, ${color} ${Math.round(opacidad * 100)}%, transparent)`;

/**
 * Las fuentes van en public/fonts/ (variables, subconjunto latino de Google Fonts): el render no
 * depende de la red.
 */
function cargarFuente(familia: string, archivo: string, pesos: string) {
  if (typeof document === "undefined") return familia;
  const espera = delayRender(`Fuente ${familia}`);
  const fuente = new FontFace(familia, `url(${staticFile(`fonts/${archivo}`)}) format("woff2")`, { weight: pesos });
  fuente
    .load()
    .then(() => {
      (document.fonts as FontFaceSet & { add: (f: FontFace) => void }).add(fuente);
      continueRender(espera);
    })
    .catch((error) => cancelRender(error));
  return familia;
}

/** Hanken Grotesk para todo; los montos llevan `tabular-nums`. */
export const FUENTE = cargarFuente("Hanken Grotesk", "hanken-grotesk-latin.woff2", "400 700");

/** JetBrains Mono solo para cuentas (···2002). */
export const FUENTE_MONO = cargarFuente("JetBrains Mono", "jetbrains-mono-latin.woff2", "400 500");

export const NUMEROS = { fontVariantNumeric: "tabular-nums" } as const;
