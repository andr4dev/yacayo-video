// Lo que muestra la pantalla del celular en cada momento. Las pantallas cambian dentro del
// celular con un deslizamiento o un recorte, nunca con un corte seco.
import type React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ASISTENTE, CAMBIO_PANTALLA, PANTALLAS, type Pantalla } from "../constantes";
import { YC, alfa } from "../marca";
import zonas from "../../public/screens/zonas-asistente.json";
import { AssistantBubble, AssistantChat } from "./Asistente";
import { MARCO } from "./asistenteGeometria";
import { WhatsAppChat } from "./WhatsAppChat";

/** Una captura real del panel (public/screens/, 390 de ancho a 3x). */
const Captura: React.FC<{ nombre: "panel-inicio" }> = ({ nombre }) => (
  <Img src={staticFile(`screens/${nombre}.png`)} style={{ position: "absolute", left: 0, top: 0, width: 390, height: 844 }} />
);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const dibujo = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) };

const Capa: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>{children}</div>
);

function contenido(pantalla: Pantalla) {
  switch (pantalla) {
    case "chat":
      return <WhatsAppChat />;
    case "inicio":
      return <PantallaInicio />;
  }
}

export const PantallaCelular: React.FC = () => {
  const frame = useCurrentFrame();
  let i = 0;
  PANTALLAS.forEach((s, j) => {
    if (frame >= s.desde) i = j;
  });
  const actual = PANTALLAS[i];
  const previa = PANTALLAS[i - 1];
  const t = frame - actual.desde;
  if (!previa || t >= CAMBIO_PANTALLA) return <Capa>{contenido(actual.pantalla)}</Capa>;

  const p = interpolate(t, [0, CAMBIO_PANTALLA], [0, 1], { easing: Easing.bezier(0.65, 0, 0.35, 1) });

  if (actual.entrada === "recorte") {
    return (
      <>
        <Capa>{contenido(previa.pantalla)}</Capa>
        <Capa style={{ clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}>
          <Capa style={{ transform: `scale(${1.08 - 0.08 * p})`, transformOrigin: "50% 100%" }}>
            {contenido(actual.pantalla)}
          </Capa>
        </Capa>
      </>
    );
  }

  const dir = actual.entrada === "desliza-izq" ? 1 : -1;
  return (
    <>
      <Capa style={{ transform: `translateX(${-dir * 30 * p}%)` }}>
        {contenido(previa.pantalla)}
        <Capa style={{ background: YC.fondoOscuro, opacity: 0.25 * p }}>{null}</Capa>
      </Capa>
      <Capa
        style={{
          transform: `translateX(${dir * 100 * (1 - p)}%)`,
          boxShadow: `${-dir * 8}px 0 24px ${alfa(YC.fondoOscuro, 0.18)}`,
        }}
      >
        {contenido(actual.pantalla)}
      </Capa>
    </>
  );
};

// --- Inicio con el asistente: la burbuja late, se toca y sube la hoja del chat. Al final, corte
// rápido a la tarjeta "Pagos recibidos" (sin la hoja), con la misma cifra resaltada. -----------
const PantallaInicio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abierta = frame >= ASISTENTE.abre && frame < ASISTENTE.corte;
  const subida = spring({ frame: frame - ASISTENTE.abre, fps, config: { damping: 20, stiffness: 110 } });
  const total = zonas["panel-inicio"].total;
  const resaltado = interpolate(frame, [ASISTENTE.corte + 4, ASISTENTE.corte + 14], [0, 1], dibujo);

  return (
    <>
      <Captura nombre="panel-inicio" />
      {frame >= ASISTENTE.corte ? (
        <div
          style={{
            position: "absolute",
            left: total.x - 4,
            top: total.y + total.h * 0.45,
            width: total.w + 8,
            height: total.h * 0.5,
            borderRadius: 4,
            background: alfa(YC.acento, 0.45),
            mixBlendMode: "multiply",
            transformOrigin: "left center",
            transform: `scaleX(${resaltado})`,
          }}
        />
      ) : null}
      <AssistantBubble variante="hoja" aparece={ASISTENTE.burbuja} pulso={ASISTENTE.pulso} toque={ASISTENTE.toqueBurbuja} />
      {abierta ? (
        <>
          <Capa style={{ background: YC.fondoOscuro, opacity: 0.45 * subida }}>{null}</Capa>
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - subida) * MARCO.hoja.h}px)` }}>
            <AssistantChat variante="hoja" />
          </div>
        </>
      ) : null}
    </>
  );
};
