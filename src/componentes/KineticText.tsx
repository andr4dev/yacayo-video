// Titulares palabra por palabra: cada palabra sube desde abajo dentro de un recorte (mask), con
// un blur que se quita. La palabra clave va en --yc-primario sobre un subrayado de --yc-acento
// que se dibuja. Con `moneda`, la tilde de la "ó" de la palabra clave es la moneda que cae.
import type React from "react";
import { Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FUENTE, YC } from "../marca";
import { Moneda, TOQUE_MONEDA } from "./Moneda";

type KineticTextProps = {
  texto: string;
  /** La palabra resaltada, tal como aparece en `texto`. */
  clave?: string;
  tamano: number;
  /** Frames entre una palabra y la siguiente. */
  escalonado?: number;
  /** Si se da, las palabras salen hacia arriba al final. */
  duracion?: number;
  alinear?: "center" | "left";
  tema?: "claro" | "oscuro";
  peso?: number;
  /** La tilde de la "ó" de la palabra clave es la moneda que cae (y toca en este frame). */
  monedaToca?: number;
  style?: React.CSSProperties;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KineticText: React.FC<KineticTextProps> = ({
  texto,
  clave,
  tamano,
  escalonado = 4,
  duracion,
  alinear = "center",
  tema = "claro",
  peso = 700,
  monedaToca,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = texto.split(" ");
  const colorTexto = tema === "claro" ? YC.texto : YC.textoInvertido;
  const colorClave = tema === "claro" ? YC.primario : YC.textoInvertido;

  return (
    <div
      style={{
        fontFamily: FUENTE,
        fontWeight: peso,
        fontSize: tamano,
        lineHeight: 1.08,
        letterSpacing: "-0.02em",
        textAlign: alinear,
        textWrap: "balance",
        color: colorTexto,
        ...style,
      }}
    >
      {palabras.map((palabra, i) => {
        const inicio = i * escalonado;
        const e = spring({ frame: frame - inicio, fps, config: { damping: 200 }, durationInFrames: 14 });
        const salida =
          duracion === undefined
            ? 0
            : interpolate(frame, [duracion - 9 + i * 1.5, duracion - 1 + i * 1.5], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.5, 0, 0.75, 0),
              });
        const esClave = palabra === clave;
        const conMoneda = esClave && monedaToca !== undefined && palabra.includes("ó");
        const subrayado = interpolate(frame, [inicio + 8, inicio + 20], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        });

        return (
          <span key={i}>
            {i > 0 ? " " : null}
            <span
              style={{
                display: "inline-block",
                position: "relative",
                padding: "0.16em 0.05em 0.18em",
                margin: "-0.16em -0.05em -0.18em",
                // El recorte: la palabra entra desde abajo. Con moneda, se abre hacia arriba
                // para que la moneda pueda caer desde fuera.
                clipPath: conMoneda ? "inset(-200vh -0.2em 0 -0.2em)" : "inset(0)",
              }}
            >
              {esClave ? (
                <span
                  style={{
                    position: "absolute",
                    left: "0.03em",
                    right: "0.03em",
                    bottom: "0.24em",
                    height: "0.2em",
                    borderRadius: "0.1em",
                    background: YC.acento,
                    transformOrigin: "left center",
                    transform: `scaleX(${subrayado * (1 - salida)})`,
                  }}
                />
              ) : null}
              <span
                style={{
                  display: "inline-block",
                  position: "relative",
                  color: esClave ? colorClave : colorTexto,
                  transform: `translateY(${(1 - e) * 110 - salida * 110}%)`,
                  filter: `blur(${(1 - e) * 10 + salida * 6}px)`,
                  opacity: Math.min(1, e * 1.4) * (1 - salida),
                }}
              >
                {conMoneda ? <PalabraConMoneda palabra={palabra} toca={monedaToca} tamano={tamano} /> : palabra}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** "cayó?" → "cay" + "o" con la moneda como tilde + "?". */
const PalabraConMoneda: React.FC<{ palabra: string; toca: number; tamano: number }> = ({ palabra, toca, tamano }) => {
  const i = palabra.indexOf("ó");
  const d = tamano * 0.22;
  return (
    <>
      {palabra.slice(0, i)}
      <span style={{ position: "relative", display: "inline-block" }}>
        o
        <Sequence from={toca - TOQUE_MONEDA} layout="none">
          <Moneda tamano={d} caida={tamano * 14} style={{ left: "50%", top: tamano * 0.02, marginLeft: -d * 0.3 }} />
        </Sequence>
      </span>
      {palabra.slice(i + 1)}
    </>
  );
};
