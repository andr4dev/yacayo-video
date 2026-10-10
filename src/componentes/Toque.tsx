// Un toque con el dedo sobre la pantalla: un círculo que se hunde y una onda que se abre.
import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Punto } from "../escenario";
import { YC, alfa } from "../marca";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Toque: React.FC<{ centro: Punto; tamano: number }> = ({ centro, tamano }) => {
  const frame = useCurrentFrame();
  // El dedo baja (0–4), se queda (4–8) y se levanta (8–14).
  const dedo = interpolate(frame, [0, 4, 8, 14], [0, 1, 1, 0], clamp);
  const hundido = interpolate(frame, [0, 4, 8], [1.25, 0.85, 0.85], { ...clamp, easing: Easing.out(Easing.quad) });
  const onda = interpolate(frame, [4, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <div
      style={{
        position: "absolute",
        left: centro.x - tamano / 2,
        top: centro.y - tamano / 2,
        width: tamano,
        height: tamano,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `${tamano * 0.05}px solid ${YC.primario}`,
          transform: `scale(${0.8 + 1.2 * onda})`,
          opacity: onda > 0 ? 0.6 * (1 - onda) : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: alfa(YC.fondoOscuro, 0.24),
          border: `${tamano * 0.04}px solid ${alfa(YC.superficie, 0.85)}`,
          transform: `scale(${hundido})`,
          opacity: dedo,
        }}
      />
    </div>
  );
};
