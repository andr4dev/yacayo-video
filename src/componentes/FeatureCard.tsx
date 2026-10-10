// Tarjeta de función que sale del borde del celular con un spring, con una línea conectora hacia
// el elemento real de la pantalla. Superficie blanca, borde --yc-borde y radio 16.
import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Punto } from "../escenario";
import { FUENTE, YC, alfa } from "../marca";
import { Icono, type NombreIcono } from "./Iconos";

type FeatureCardProps = {
  /** El punto del elemento real (px del cuadro), de donde sale la tarjeta. */
  ancla: Punto;
  /** Centro de la tarjeta ya afuera (px del cuadro). */
  centro: Punto;
  icono: NombreIcono;
  colorIcono: string;
  tamano: number;
  /** Frames hasta que la tarjeta se va. */
  duracion: number;
  children: React.ReactNode;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FeatureCard: React.FC<FeatureCardProps> = ({
  ancla,
  centro,
  icono,
  colorIcono,
  tamano,
  duracion,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 13, stiffness: 120, mass: 0.9 } });
  const salida = interpolate(frame, [duracion - 8, duracion], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.5, 0, 0.75, 0),
  });
  const linea = interpolate(frame, [3, 15], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });

  const x = ancla.x + (centro.x - ancla.x) * e;
  const y = ancla.y + (centro.y - ancla.y) * e;

  return (
    <>
      {/* Línea conectora: del elemento real a la tarjeta. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 1 - salida }}>
        <line
          x1={ancla.x}
          y1={ancla.y}
          x2={x}
          y2={y}
          stroke={YC.primario}
          strokeWidth={tamano * 0.07}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - linea}
        />
        <circle cx={ancla.x} cy={ancla.y} r={tamano * 0.22} fill={YC.superficie} stroke={YC.primario} strokeWidth={tamano * 0.08} opacity={Math.min(1, e * 2)} />
      </svg>

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${(0.35 + 0.65 * e) * (1 - 0.15 * salida)})`,
          opacity: Math.min(1, e * 2) * (1 - salida),
          display: "flex",
          alignItems: "center",
          gap: tamano * 0.4,
          padding: `${tamano * 0.42}px ${tamano * 0.62}px ${tamano * 0.42}px ${tamano * 0.42}px`,
          background: YC.superficie,
          border: `1px solid ${YC.borde}`,
          borderRadius: 16,
          boxShadow: `0 ${tamano * 0.4}px ${tamano}px ${alfa(YC.fondoOscuro, 0.12)}`,
          fontFamily: FUENTE,
          fontSize: tamano,
          fontWeight: 600,
          color: YC.texto,
          whiteSpace: "nowrap",
          letterSpacing: "-0.01em",
        }}
      >
        <span
          style={{
            width: tamano * 1.35,
            height: tamano * 1.35,
            borderRadius: "50%",
            background: colorIcono,
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <Icono nombre={icono} tamano={tamano * 0.78} color={YC.sobreEstado} />
        </span>
        <span>{children}</span>
      </div>
    </>
  );
};
