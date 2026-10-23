// Confirmación: pulso circular en --yc-verificado y un check que se dibuja (stroke-dashoffset).
// En fraude, el mismo pulso en --yc-fraude con un "!". En escudo (el asistente solo consulta),
// --yc-verificado con el escudo de lucide y su check que se dibuja.
import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Punto } from "../escenario";
import { YC } from "../marca";

type ConfirmacionProps = {
  centro: Punto;
  tamano: number;
  tipo: "cayo" | "fraude" | "escudo";
  duracion: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Confirmacion: React.FC<ConfirmacionProps> = ({ centro, tamano, tipo, duracion }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = tipo === "fraude" ? YC.fraude : YC.verificado;
  const e = spring({ frame, fps, config: { damping: 11, stiffness: 160 } });
  const trazo = interpolate(frame, [5, 17], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const salida = interpolate(frame, [duracion - 8, duracion], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: centro.x - tamano / 2,
        top: centro.y - tamano / 2,
        width: tamano,
        height: tamano,
        opacity: 1 - salida,
      }}
    >
      {[0, 7].map((retraso) => {
        const t = interpolate(frame, [retraso, retraso + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div
            key={retraso}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${tamano * 0.06}px solid ${color}`,
              transform: `scale(${0.7 + 1.9 * t})`,
              opacity: t > 0 ? 0.55 * (1 - t) : 0,
            }}
          />
        );
      })}
      <svg
        viewBox="0 0 48 48"
        width={tamano}
        height={tamano}
        style={{ position: "absolute", inset: 0, transform: `scale(${e})` }}
      >
        <circle cx={24} cy={24} r={24} fill={color} />
        {tipo === "escudo" ? (
          // lucide "shield-check" (24 × 24), centrado en el círculo.
          <g transform="translate(9.6 9.6) scale(1.2)" fill="none" stroke={YC.sobreEstado} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - trazo} />
          </g>
        ) : tipo === "cayo" ? (
          <path
            d="M14 24.5 21 31.5 34 17"
            fill="none"
            stroke={YC.sobreEstado}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - trazo}
          />
        ) : (
          <>
            <path
              d="M24 13V27"
              stroke={YC.sobreEstado}
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - trazo}
            />
            <circle cx={24} cy={34.5} r={3} fill={YC.sobreEstado} opacity={trazo >= 1 ? 1 : 0} />
          </>
        )}
      </svg>
    </div>
  );
};
