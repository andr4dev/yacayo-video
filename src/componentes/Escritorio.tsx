// El panel de escritorio (capturas de 1440 × 900) en una ventana del navegador, con el chat del
// asistente abierto en su tarjeta de 380 px. Primero Inicio; al hacer clic en "Por revisar · 2"
// de la barra lateral, la página cambia y el chat sigue ahí con la misma conversación.
import type React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ASISTENTE, CONVERSACION, ESCENAS } from "../constantes";
import { ESCRITORIO, type Layout, type Punto, type PoseEscritorio } from "../escenario";
import { FUENTE, YC, alfa } from "../marca";
import zonas from "../../public/screens/zonas-asistente.json";
import { AssistantBubble, AssistantChat } from "./Asistente";
import { pieDe } from "./asistenteGeometria";
import { TRAZO_CURSOR } from "./Iconos";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const centro = (c: { x: number; y: number; w: number; h: number }): Punto => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });

const pie = pieDe("tarjeta");
const escritos = CONVERSACION.pasos.flatMap((paso) => (paso.de === "usuario" && paso.escrito ? [paso.escrito] : []));

/** Los clics del cursor (en px del panel): "Por revisar · 2" y enviar cada pregunta escrita. */
export const CLICS_ESCRITORIO: { frame: number; punto: Punto; nombre: string }[] = [
  { frame: ASISTENTE.clicPorRevisar, punto: centro(zonas["panel-inicio-escritorio"].porRevisar), nombre: "Por revisar · 2" },
  ...escritos.map((escrito) => ({ frame: escrito.hasta + 2, punto: centro(pie.enviar), nombre: "Enviar" })),
];

/** Por dónde pasa el cursor: entra, va a la barra lateral, al campo y a enviar. */
const RECORRIDO: { frame: number; punto: Punto }[] = [
  { frame: ASISTENTE.cursor, punto: { x: 900, y: 640 } },
  { frame: ASISTENTE.clicPorRevisar, punto: CLICS_ESCRITORIO[0].punto },
  { frame: escritos[0].desde - 4, punto: { x: pie.campo.x + 60, y: centro(pie.campo).y } },
  { frame: escritos[0].hasta + 2, punto: centro(pie.enviar) },
];

export const Escritorio: React.FC<{ pose: PoseEscritorio; L: Layout }> = ({ pose, L }) => {
  const frame = useCurrentFrame();
  const ke = L.escritorio.ancho / ESCRITORIO.ancho;
  const ancho = L.escritorio.ancho;
  const alto = ESCRITORIO.alto * ke + L.escritorio.barra;
  const cambio = interpolate(frame, [ASISTENTE.cambiaPagina, ASISTENTE.cambiaPagina + 5], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - ancho / 2,
        top: pose.y - alto / 2,
        width: ancho,
        height: alto,
        transform: `scale(${pose.s})`,
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${YC.borde}`,
        background: YC.superficie,
        boxShadow: `0 ${30 * pose.s}px ${80 * pose.s}px ${alfa(YC.fondoOscuro, 0.16)}`,
      }}
    >
      <BarraDelNavegador alto={L.escritorio.barra} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: L.escritorio.barra,
          width: ESCRITORIO.ancho,
          height: ESCRITORIO.alto,
          transform: `scale(${ke})`,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("screens/panel-inicio-escritorio.png")} style={{ position: "absolute", inset: 0, width: "100%" }} />
        {cambio > 0 ? (
          <Img
            src={staticFile("screens/panel-por-revisar-escritorio.png")}
            style={{ position: "absolute", inset: 0, width: "100%", opacity: cambio }}
          />
        ) : null}
        <AssistantBubble variante="tarjeta" aparece={ESCENAS.entrePantallas.desde - 30} />
        <AssistantChat variante="tarjeta" />
        <Cursor frame={frame} />
      </div>
    </div>
  );
};

/** La barra del navegador: tres puntos y la dirección del panel. */
const BarraDelNavegador: React.FC<{ alto: number }> = ({ alto }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: alto,
      borderBottom: `1px solid ${YC.borde}`,
      background: YC.superficie,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div style={{ position: "absolute", left: 16, display: "flex", gap: 7 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: YC.borde }} />
      ))}
    </div>
    <div
      style={{
        width: 320,
        height: alto - 14,
        borderRadius: 999,
        background: YC.fondoClaro,
        border: `1px solid ${YC.bordeSuave}`,
        display: "grid",
        placeItems: "center",
        fontFamily: FUENTE,
        fontSize: 13,
        fontWeight: 500,
        color: YC.textoSecundario,
      }}
    >
      app.yacayo.co
    </div>
  </div>
);

/** El cursor del mouse: se desliza entre los puntos del recorrido y se hunde en cada clic. */
const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < RECORRIDO[0].frame - 6) return null;
  let p = RECORRIDO[RECORRIDO.length - 1].punto;
  for (let i = 0; i < RECORRIDO.length - 1; i++) {
    const [a, b] = [RECORRIDO[i], RECORRIDO[i + 1]];
    if (frame < b.frame) {
      const t = interpolate(frame, [a.frame, b.frame], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
      p = { x: a.punto.x + (b.punto.x - a.punto.x) * t, y: a.punto.y + (b.punto.y - a.punto.y) * t };
      break;
    }
  }
  const clic = CLICS_ESCRITORIO.reduce(
    (s, c) => Math.min(s, interpolate(frame, [c.frame - 2, c.frame + 2, c.frame + 8], [1, 0.82, 1], clamp)),
    1,
  );
  const entra = interpolate(frame, [RECORRIDO[0].frame - 6, RECORRIDO[0].frame], [0, 1], clamp);
  const lado = 30;
  // La punta de "mouse-pointer-2" está en (4, 4) de su caja de 24.
  return (
    <svg
      width={lado}
      height={lado}
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: p.x - (4 / 24) * lado,
        top: p.y - (4 / 24) * lado,
        opacity: entra,
        transform: `scale(${clic})`,
        transformOrigin: "17% 17%",
        overflow: "visible",
      }}
    >
      <path d={TRAZO_CURSOR} fill={YC.texto} stroke={YC.superficie} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
};
