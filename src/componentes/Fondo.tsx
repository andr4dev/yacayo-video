// Fondo --yc-fondo-claro con dos manchas muy difuminadas de --yc-acento y --yc-primario que se
// mueven lento. Al principio está un poco más oscuro y se aclara cuando entra el celular.
import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ESCENAS } from "../constantes";
import { YC, alfa } from "../marca";

export const Fondo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const lado = Math.max(width, height) * 0.9;

  return (
    <AbsoluteFill style={{ background: YC.fondoClaro, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: lado,
          height: lado,
          left: width * 0.18 - lado / 2 + 90 * Math.sin(frame / 95),
          top: height * 0.22 - lado / 2 + 70 * Math.cos(frame / 120),
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${alfa(YC.acento, 0.32)}, transparent)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: lado * 1.1,
          height: lado * 1.1,
          left: width * 0.85 - lado * 0.55 + 80 * Math.cos(frame / 110),
          top: height * 0.78 - lado * 0.55 + 90 * Math.sin(frame / 135),
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${alfa(YC.primario, 0.15)}, transparent)`,
          filter: "blur(40px)",
        }}
      />
      {/* Se aclara mientras entra el celular. */}
      <AbsoluteFill
        style={{
          background: YC.fondoOscuro,
          opacity: interpolate(frame, [ESCENAS.foto.desde, ESCENAS.foto.desde + 30], [0.07, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
