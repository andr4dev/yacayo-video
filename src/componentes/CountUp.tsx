// Un monto que cuenta (p. ej. $542.000 → $614.000), con formato es-CO: "$614.000".
import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FUENTE, NUMEROS } from "../marca";

const pesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
/** Formato de la skill §7: "$85.000", sin espacio ni decimales. */
export const formatoPesos = (n: number) => `$${pesos.format(n)}`;

type CountUpProps = {
  desde: number;
  hasta: number;
  /** Frames que tarda en contar. */
  duracion: number;
  /** Redondea a este múltiplo mientras cuenta (los montos de la skill son de mil en mil). */
  paso?: number;
  style?: React.CSSProperties;
};

export const CountUp: React.FC<CountUpProps> = ({ desde, hasta, duracion, paso = 1000, style }) => {
  const frame = useCurrentFrame();
  const valor = interpolate(frame, [0, duracion], [desde, hasta], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  return (
    <span style={{ fontFamily: FUENTE, fontWeight: 700, ...NUMEROS, ...style }}>
      {formatoPesos(Math.round(valor / paso) * paso)}
    </span>
  );
};
