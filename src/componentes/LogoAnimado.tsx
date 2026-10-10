// Logo horizontal negativo animado (yacayo-horizontal-negativo-animable.svg): la moneda cae y
// después entran las letras, con los mismos tiempos y curvas del AnimatedLogo del panel.
import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { YC } from "../marca";
import { DURACION_CAIDA, caidaMoneda } from "./Moneda";
import { LOGO } from "./logoTrazos";

const ESCALA_ISOTIPO = 0.837647; // la del grupo #isotipo del SVG
const ANCHO_WEB = 320; // el ancho del logo en Entrar, con el que se midieron los 4 y 12 px del CSS

export const LogoAnimado: React.FC<{ ancho: number }> = ({ ancho }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const [, , vw, vh] = LOGO.viewBox.split(" ").map(Number);
  const pxPorUnidad = ancho / vw;
  const aIsotipo = (px: number) => px / pxPorUnidad / ESCALA_ISOTIPO;
  const proporcion = ancho / ANCHO_WEB;

  // La moneda cae desde media pantalla (translateY(-50vh) en el CSS del panel).
  const m = caidaMoneda(frame, aIsotipo(height / 2), aIsotipo(4 * proporcion));
  // Las letras entran después de la caída: 0,3 s, desde 12 px a la izquierda.
  const letras = interpolate(frame, [DURACION_CAIDA, DURACION_CAIDA + 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const y = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <svg viewBox={LOGO.viewBox} width={ancho} height={(ancho * vh) / vw} style={{ overflow: "visible" }}>
      <title>YaCayó</title>
      <g transform={LOGO.isotipoTransform}>
        <path
          d={LOGO.y}
          fill="none"
          stroke={YC.textoInvertido}
          strokeWidth={17}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={y}
        />
        <circle
          cx={LOGO.moneda.cx}
          cy={LOGO.moneda.cy}
          r={LOGO.moneda.r}
          fill={YC.logoMonedaNegativo}
          opacity={m.opacidad}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            transform: `translateY(${m.y}px) scale(${m.sx}, ${m.sy})`,
          }}
        />
      </g>
      <path
        d={LOGO.letras}
        fill={YC.textoInvertido}
        opacity={letras}
        transform={`translate(${(-12 * proporcion * (1 - letras)) / pxPorUnidad} 0)`}
      />
    </svg>
  );
};
