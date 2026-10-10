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
  /** Color del texto (las palabras que no son clave). */
  colorTexto?: string;
  /** Color de la palabra clave. */
  colorClave?: string;
  /** El subrayado de --yc-acento bajo la palabra clave. */
  subrayado?: boolean;
  /** Color de la moneda (sobre fondos oscuros, --yc-logo-moneda-negativo). */
  colorMoneda?: string;
  /** La tilde de la "ó" de la palabra clave es la moneda que cae (y toca en este frame). */
  monedaToca?: number;
  style?: React.CSSProperties;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KineticText: React.FC<KineticTextProps> = ({
  texto,
  clave,
  tamano,
  escalonado = 5,
  duracion,
  alinear = "center",
  tema = "claro",
  peso = 700,
  colorTexto: colorPropio,
  colorClave: clavePropia,
  subrayado: conSubrayado = true,
  colorMoneda,
  monedaToca,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = texto.split(" ");
  const colorTexto = colorPropio ?? (tema === "claro" ? YC.texto : YC.textoInvertido);
  const colorClave = clavePropia ?? (tema === "claro" ? YC.primario : YC.textoInvertido);

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
        const e = spring({ frame: frame - inicio, fps, config: { damping: 200 }, durationInFrames: 18 });
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
                // Ya adentro, la palabra con moneda se suelta del recorte para que la onda se vea.
                clipPath: conMoneda ? (e > 0.999 ? "none" : "inset(-200vh -0.2em 0 -0.2em)") : "inset(0)",
              }}
            >
              {esClave && conSubrayado ? (
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
                {conMoneda ? <PalabraConMoneda palabra={palabra} toca={monedaToca} tamano={tamano} color={colorMoneda} /> : palabra}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** "cayó?" → "cay" + "o" con la moneda como tilde + "?". */
const PalabraConMoneda: React.FC<{ palabra: string; toca: number; tamano: number; color?: string }> = ({
  palabra,
  toca,
  tamano,
  color,
}) => {
  const i = palabra.indexOf("ó");
  const d = tamano * 0.22;
  return (
    <>
      {palabra.slice(0, i)}
      <span style={{ position: "relative", display: "inline-block" }}>
        o
        <Sequence from={toca - TOQUE_MONEDA} layout="none">
          <Moneda tamano={d} caida={tamano * 14} color={color} style={{ left: "50%", top: tamano * 0.02, marginLeft: -d * 0.3 }} />
        </Sequence>
        <Sequence from={toca} layout="none">
          <OndaMoneda diametro={d} color={color ?? YC.logoMoneda} style={{ left: "50%", top: tamano * 0.02, marginLeft: -d * 0.3 }} />
        </Sequence>
      </span>
      {palabra.slice(i + 1)}
    </>
  );
};

/** La onda dorada que sale de la moneda cuando toca. */
const OndaMoneda: React.FC<{ diametro: number; color: string; style: React.CSSProperties }> = ({ diametro, color, style }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 6].map((retraso) => {
        const t = interpolate(frame, [retraso, retraso + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <span
            key={retraso}
            style={{
              position: "absolute",
              width: diametro,
              height: diametro,
              borderRadius: "50%",
              border: `${diametro * 0.07}px solid ${color}`,
              boxSizing: "border-box",
              transform: `scale(${1 + 16 * t})`,
              opacity: t > 0 ? 0.6 * (1 - t) : 0,
              ...style,
            }}
          />
        );
      })}
    </>
  );
};
