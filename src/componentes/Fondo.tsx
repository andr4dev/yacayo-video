// El fondo, como la landing: el gancho va sobre --yc-primario con grano y un centro más claro que
// se ilumina cuando cae la moneda (el dorado lo ponen "cayó?" y la moneda); cuando
// entra el celular, el fondo --yc-fondo-claro se abre en círculo desde abajo. En las escenas
// claras, una luz dorada (--yc-acento) sigue al celular y una viñeta índigo muy leve cierra los
// bordes.
import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ESCENAS, TITULARES } from "../constantes";
import type { Punto } from "../escenario";
import { YC, alfa } from "../marca";
import { Grano } from "./Grano";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Lo que tarda el fondo claro en abrirse cuando entra el celular. */
const APERTURA = 26;

type FondoProps = {
  /** Centro del celular en el cuadro: ahí va la luz dorada. */
  luz: Punto;
  /** Cuánto ocupa el celular (crece con el zoom), para escalar la luz. */
  escalaLuz: number;
};

export const Fondo: React.FC<FondoProps> = ({ luz, escalaLuz }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const inicio = ESCENAS.foto.desde;
  const radio = interpolate(frame, [inicio, inicio + APERTURA], [0, Math.hypot(width, height) * 1.15], {
    ...clamp,
    easing: Easing.bezier(0.55, 0, 0.25, 1),
  });
  const ladoLuz = Math.max(width, height) * 0.95 * escalaLuz;

  return (
    <AbsoluteFill>
      {frame < inicio + APERTURA ? <Gancho /> : null}

      <AbsoluteFill
        style={{
          background: YC.fondoClaro,
          clipPath: frame < inicio + APERTURA ? `circle(${radio}px at 50% 112%)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: luz.x - ladoLuz / 2,
            top: luz.y - ladoLuz / 2,
            width: ladoLuz,
            height: ladoLuz,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${alfa(YC.acento, 0.3)}, ${alfa(YC.acento, 0.08)} 55%, transparent)`,
          }}
        />
        <AbsoluteFill
          style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 55%, ${alfa(YC.primario, 0.09)} 100%)` }}
        />
        <Grano opacidad={0.08} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** El gancho: índigo profundo con un centro más claro que se ilumina cuando la moneda toca. */
const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const toca = TITULARES.ganchoB.monedaToca;
  const brillo = 0.13 + 0.02 * Math.sin(frame / 14) + interpolate(frame, [toca, toca + 3, toca + 24], [0, 0.14, 0.04], clamp);
  const lado = Math.max(width, height) * 1.05;
  return (
    <AbsoluteFill style={{ background: YC.primario }}>
      <div
        style={{
          position: "absolute",
          left: width / 2 - lado / 2,
          top: height / 2 - lado / 2,
          width: lado,
          height: lado,
          borderRadius: "50%",
          // Blanco con transparencia: aclara el índigo sin ensuciarlo (un dorado suave se ve café).
          background: `radial-gradient(closest-side, ${alfa(YC.textoInvertido, brillo)}, ${alfa(YC.textoInvertido, brillo * 0.3)} 45%, transparent)`,
        }}
      />
      <Grano opacidad={0.14} />
    </AbsoluteFill>
  );
};

/** El centro más claro del cierre, detrás del logo (mismo lenguaje que el gancho). */
export const BrilloCierre: React.FC<{ centro: Punto }> = ({ centro }) => {
  const { width, height } = useVideoConfig();
  const lado = Math.max(width, height) * 0.9;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: centro.x - lado / 2,
          top: centro.y - lado / 2,
          width: lado,
          height: lado,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${alfa(YC.textoInvertido, 0.12)}, transparent)`,
        }}
      />
      <Grano opacidad={0.14} />
    </AbsoluteFill>
  );
};
