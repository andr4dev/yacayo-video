// La moneda del isotipo cayendo, con la misma curva del logo animado del panel
// (packages/ui/src/styles/theme.css, @keyframes yc-moneda-cae: 1,15 s).
import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FPS } from "../constantes";
import { YC } from "../marca";

/** Lo que dura la caída (1,15 s). */
export const DURACION_CAIDA = Math.round(1.15 * FPS);
/** El frame en que la moneda toca (72 % de la caída). */
export const TOQUE_MONEDA = Math.round(0.72 * DURACION_CAIDA);

const curva = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.22, 0.72, 0.22, 1),
} as const;
const PASOS = [0, 0.72, 0.8, 0.89, 1];

/** Posición y aplastado de la moneda `frame` frames después de empezar a caer. */
export function caidaMoneda(frame: number, caida: number, rebote: number) {
  const t = frame / DURACION_CAIDA;
  return {
    y: interpolate(t, PASOS, [-caida, 0, rebote, -1.5 * rebote, 0], curva),
    sx: interpolate(t, PASOS, [1, 1, 1.1, 0.96, 1], curva),
    sy: interpolate(t, PASOS, [1, 1, 0.85, 1.06, 1], curva),
    opacidad: interpolate(t, [0, 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
}

type MonedaProps = {
  /** Diámetro en px. */
  tamano: number;
  /** Desde qué altura cae, en px. */
  caida: number;
  color?: string;
  style?: React.CSSProperties;
};

/** Una moneda que cae al empezar su secuencia. */
export const Moneda: React.FC<MonedaProps> = ({ tamano, caida, color = YC.logoMoneda, style }) => {
  const frame = useCurrentFrame();
  const m = caidaMoneda(frame, caida, tamano * 0.25);
  return (
    <span
      style={{
        position: "absolute",
        width: tamano,
        height: tamano,
        borderRadius: "50%",
        background: color,
        opacity: m.opacidad,
        transform: `translateY(${m.y}px) scale(${m.sx}, ${m.sy})`,
        ...style,
      }}
    />
  );
};
