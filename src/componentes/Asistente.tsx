// El asistente del panel (Gemini en Vertex AI), dibujado como se verá en el panel: la burbuja
// flotante y el chat (en el celular, una hoja que sube; en escritorio, una tarjeta de 380 px).
// Todavía no existe en el front: aquí se dibuja con los tokens de la marca, Hanken Grotesk y
// bordes en vez de sombras, como los botones, chips y tarjetas de front/packages/ui. Va en px de
// la pantalla donde vive; las posiciones salen de asistenteGeometria.ts.
import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { CHAT_ASISTENTE, RESPUESTAS, SUGERENCIAS } from "../asistente";
import { CONVERSACION, type Conversacion, FPS } from "../constantes";
import { FUENTE, FUENTE_MONO, NUMEROS, YC, alfa } from "../marca";
import {
  ALTO_CONSULTE,
  ALTO_PENSANDO,
  ALTO_PREGUNTA,
  ANCHO_RESPUESTA,
  BURBUJA,
  MARCO,
  type MensajeDelChat,
  SALUDO,
  type Variante,
  areaDe,
  geometriaAsistente,
  pieDe,
} from "./asistenteGeometria";
import { Icono } from "./Iconos";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** La burbuja flotante con el ícono de chat. Late en --yc-acento (`pulso`) y se hunde al tocarla. */
export const AssistantBubble: React.FC<{ variante: Variante; aparece: number; pulso?: number; toque?: number }> = ({
  variante,
  aparece,
  pulso,
  toque,
}) => {
  const frame = useCurrentFrame();
  const b = BURBUJA[variante];
  const e = spring({ frame: frame - aparece, fps: FPS, config: { damping: 12, stiffness: 150 } });
  const hundida = toque === undefined ? 1 : interpolate(frame, [toque, toque + 4, toque + 10], [1, 0.86, 1], clamp);
  if (frame < aparece) return null;

  return (
    <div style={{ position: "absolute", left: b.x, top: b.y, width: b.lado, height: b.lado }}>
      {pulso === undefined
        ? null
        : [0, 10, 20].map((retraso) => {
            const t = interpolate(frame, [pulso + retraso, pulso + retraso + 30], [0, 1], {
              ...clamp,
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={retraso}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `3px solid ${YC.acento}`,
                  background: alfa(YC.acento, 0.18 * (1 - t)),
                  transform: `scale(${1 + 1.3 * t})`,
                  opacity: t > 0 ? 1 - t : 0,
                }}
              />
            );
          })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: YC.primario,
          display: "grid",
          placeItems: "center",
          transform: `scale(${e * hundida})`,
        }}
      >
        <Icono nombre="chat" tamano={26} color={YC.textoSobrePrimario} grosor={2} />
      </div>
    </div>
  );
};

/** El chat: encabezado, mensajes y el campo para escribir. */
export const AssistantChat: React.FC<{ variante: Variante; conversacion?: Conversacion }> = ({
  variante,
  conversacion = CONVERSACION,
}) => {
  const frame = useCurrentFrame();
  const m = MARCO[variante];
  const area = areaDe(variante);
  const g = geometriaAsistente(conversacion, variante, frame);

  return (
    <div
      style={{
        position: "absolute",
        left: m.x,
        top: m.y,
        width: m.w,
        height: m.h,
        background: YC.superficie,
        border: `1px solid ${YC.borde}`,
        borderRadius: variante === "hoja" ? "16px 16px 0 0" : 16,
        overflow: "hidden",
        fontFamily: FUENTE,
        color: YC.texto,
      }}
    >
      <Encabezado variante={variante} />

      <div style={{ position: "absolute", left: 0, top: area.y - m.y, width: area.w, height: area.h, overflow: "hidden" }}>
        {g.vacio ? (
          <Vacio y={g.vacio.y - area.y} opacidad={g.vacio.opacidad} conversacion={conversacion} frame={frame} />
        ) : null}
        {g.mensajes.map((mensaje) =>
          mensaje.paso.de === "usuario" ? (
            <Pregunta key={mensaje.paso.id} m={mensaje} area={area} texto={mensaje.paso.texto} />
          ) : (
            <Respuesta key={mensaje.paso.id} m={mensaje} area={area} frame={frame} />
          ),
        )}
      </div>

      <Pie variante={variante} conversacion={conversacion} frame={frame} />
    </div>
  );
};

const Encabezado: React.FC<{ variante: Variante }> = ({ variante }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: MARCO[variante].encabezado,
      borderBottom: `1px solid ${YC.bordeSuave}`,
      padding: "14px 8px 0 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}
  >
    <div style={{ display: "grid", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: variante === "hoja" ? 22 : 20, fontWeight: 700, lineHeight: 1.3 }}>
        <Icono nombre="destello" tamano={20} color={YC.acento} grosor={2} />
        {CHAT_ASISTENTE.titulo}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: YC.textoSecundario }}>{CHAT_ASISTENTE.subtitulo}</div>
    </div>
    <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", marginTop: -6 }}>
      <Icono nombre="cerrar" tamano={24} color={YC.textoSecundario} grosor={2} />
    </div>
  </div>
);

/** El chat vacío: el saludo y las sugerencias, como chips del panel. La que se toca, se marca. */
const Vacio: React.FC<{ y: number; opacidad: number; conversacion: Conversacion; frame: number }> = ({
  y,
  opacidad,
  conversacion,
  frame,
}) => {
  const primera = conversacion.pasos.find((paso) => paso.de === "usuario");
  const tocada = primera ? SUGERENCIAS.indexOf(primera.texto) : -1;
  const marcada = primera ? frame >= primera.aparece - 6 : false;
  return (
    <div style={{ position: "absolute", left: 16, right: 16, top: y, opacity: opacidad }}>
      <div style={{ height: SALUDO.alto, fontSize: 16, lineHeight: `${SALUDO.alto}px`, color: YC.texto }}>{CHAT_ASISTENTE.saludo}</div>
      <div style={{ display: "grid", justifyItems: "start", gap: SALUDO.entreSugerencias, marginTop: SALUDO.separacion }}>
        {SUGERENCIAS.map((sugerencia, i) => {
          const e = spring({ frame: frame - conversacion.abre - 8 - i * 3, fps: FPS, config: { damping: 200 }, durationInFrames: 14 });
          const esta = marcada && i === tocada;
          return (
            <div
              key={sugerencia}
              style={{
                height: SALUDO.sugerencia,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${esta ? alfa(YC.primario, 0.35) : YC.borde}`,
                background: esta ? alfa(YC.primario, 0.1) : YC.superficie,
                color: esta ? YC.primario : YC.texto,
                fontSize: 14,
                fontWeight: 500,
                opacity: e,
                transform: `translateY(${(1 - e) * 10}px)`,
              }}
            >
              {sugerencia}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** La pregunta, a la derecha, como un chip con filtro aplicado (--yc-primario al 10 %). */
const Pregunta: React.FC<{ m: MensajeDelChat; area: { x: number; y: number; w: number }; texto: string }> = ({ m, area, texto }) => (
  <div style={{ position: "absolute", right: area.x + area.w - m.caja.x, top: m.caja.y - area.y, height: m.caja.h }}>
    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        height: ALTO_PREGUNTA,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        whiteSpace: "nowrap",
        borderRadius: "16px 16px 4px 16px",
        border: `1px solid ${alfa(YC.primario, 0.35)}`,
        background: alfa(YC.primario, 0.1),
        fontSize: 15,
        fontWeight: 500,
        color: YC.texto,
        transformOrigin: "bottom right",
        transform: `scale(${0.6 + 0.4 * m.entrada})`,
        opacity: Math.min(1, m.entrada * 1.6),
      }}
    >
      {texto}
    </div>
  </div>
);

/** La respuesta, a la izquierda: primero "Buscando en tus datos…" y después el texto y su fuente. */
const Respuesta: React.FC<{ m: MensajeDelChat; area: { x: number; y: number }; frame: number }> = ({ m, area, frame }) => {
  if (m.paso.de !== "asistente") return null;
  const respuesta = RESPUESTAS[m.paso.respuesta];
  const consulte = interpolate(frame, [m.paso.aparece + 8, m.paso.aparece + 16], [0, 1], clamp);
  const altoGlobo = m.caja.h - (respuesta.consulte ? ALTO_CONSULTE * m.respuesta : 0);

  return (
    <div style={{ position: "absolute", left: m.caja.x - area.x, top: m.caja.y - area.y, width: m.caja.w, height: m.caja.h }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: m.caja.w,
          height: Math.max(0, altoGlobo),
          borderRadius: "4px 16px 16px 16px",
          border: `1px solid ${YC.borde}`,
          background: YC.fondoClaro,
          overflow: "hidden",
          transformOrigin: "top left",
          transform: `scale(${0.7 + 0.3 * m.entrada})`,
          opacity: Math.min(1, m.entrada * 1.6),
        }}
      >
        {m.respuesta < 1 ? <Pensando opacidad={1 - m.respuesta} frame={frame} /> : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: ANCHO_RESPUESTA,
            padding: "10px 12px",
            fontSize: 15,
            lineHeight: 1.45,
            opacity: m.respuesta,
            ...NUMEROS,
          }}
        >
          {respuesta.lineas.map((linea) =>
            linea.startsWith("• ") ? (
              <div key={linea} style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span style={{ color: YC.textoTerciario }}>•</span>
                <span>
                  <ConCuentas texto={linea.slice(2)} />
                </span>
              </div>
            ) : (
              <div key={linea} style={{ marginTop: linea === respuesta.lineas[0] ? 0 : 4 }}>
                <ConCuentas texto={linea} />
              </div>
            ),
          )}
        </div>
      </div>
      {respuesta.consulte ? (
        <div
          style={{
            position: "absolute",
            left: 4,
            top: altoGlobo + 6,
            fontSize: 12.5,
            lineHeight: "18px",
            color: YC.textoTerciario,
            whiteSpace: "nowrap",
            opacity: consulte,
          }}
        >
          Consulté: <span style={{ fontWeight: 600 }}>{respuesta.consulte}</span>
        </div>
      ) : null}
    </div>
  );
};

/** Las cuentas (···2002) van en JetBrains Mono (skill diseno §5). */
const ConCuentas: React.FC<{ texto: string }> = ({ texto }) => (
  <>
    {texto.split(/(···\d{4})/).map((parte, i) =>
      i % 2 === 1 ? (
        <span key={i} style={{ fontFamily: FUENTE_MONO, fontSize: "0.93em" }}>
          {parte}
        </span>
      ) : (
        parte
      ),
    )}
  </>
);

/** "Buscando en tus datos…": el destello y tres puntos que suben uno tras otro. */
const Pensando: React.FC<{ opacidad: number; frame: number }> = ({ opacidad, frame }) => (
  <div
    style={{
      position: "absolute",
      left: 12,
      top: 0,
      height: ALTO_PENSANDO,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      color: YC.textoSecundario,
      whiteSpace: "nowrap",
      opacity: opacidad,
    }}
  >
    <Icono nombre="destello" tamano={16} color={YC.acento} grosor={2} />
    {CHAT_ASISTENTE.pensando}
    <span style={{ display: "inline-flex", gap: 3, marginLeft: -4, alignSelf: "flex-end", paddingBottom: 15 }}>
      {[0, 1, 2].map((i) => {
        const fase = ((frame - i * 5) % 24) / 24;
        const salto = fase < 0.5 ? Math.sin(fase * 2 * Math.PI) : 0;
        return (
          <span
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: YC.textoSecundario,
              transform: `translateY(${-3 * Math.max(0, salto)}px)`,
              opacity: 0.45 + 0.55 * Math.max(0, salto),
            }}
          />
        );
      })}
    </span>
  </div>
);

/** Lo que se está escribiendo en el campo en este frame (y si se ve el cursor de texto). */
function borrador(conversacion: Conversacion, frame: number): { texto: string; cursor: boolean } {
  for (const paso of conversacion.pasos) {
    if (paso.de !== "usuario" || !paso.escrito || frame < paso.escrito.desde || frame >= paso.aparece) continue;
    const p = interpolate(frame, [paso.escrito.desde, paso.escrito.hasta], [0, 1], clamp);
    return { texto: paso.texto.slice(0, Math.round(p * paso.texto.length)), cursor: p < 1 || Math.floor(frame / 8) % 2 === 0 };
  }
  return { texto: "", cursor: false };
}

/** El campo para escribir, el botón de enviar y "Solo consulto: no cambio nada." */
const Pie: React.FC<{ variante: Variante; conversacion: Conversacion; frame: number }> = ({ variante, conversacion, frame }) => {
  const m = MARCO[variante];
  const { campo, enviar } = pieDe(variante);
  const { texto, cursor } = borrador(conversacion, frame);
  const envio = conversacion.pasos.find(
    (paso) => paso.de === "usuario" && paso.escrito && frame >= paso.escrito.hasta && frame < paso.escrito.hasta + 14,
  );
  const hundido =
    envio && envio.de === "usuario" && envio.escrito
      ? interpolate(frame, [envio.escrito.hasta + 2, envio.escrito.hasta + 6, envio.escrito.hasta + 12], [1, 0.88, 1], clamp)
      : 1;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: m.pie, borderTop: `1px solid ${YC.bordeSuave}` }}>
      <div
        style={{
          position: "absolute",
          left: campo.x - m.x,
          top: campo.y - (m.y + m.h - m.pie),
          width: campo.w,
          height: campo.h,
          boxSizing: "border-box",
          border: `1px solid ${YC.bordeControl}`,
          borderRadius: 8,
          background: YC.superficie,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          fontSize: 16,
          whiteSpace: "nowrap",
          overflow: "hidden",
          color: texto ? YC.texto : YC.textoTerciario,
        }}
      >
        {texto || (cursor ? "" : CHAT_ASISTENTE.placeholder)}
        {cursor ? <span style={{ width: 2, height: 20, marginLeft: 1, background: YC.primario }} /> : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: enviar.x - m.x,
          top: enviar.y - (m.y + m.h - m.pie),
          width: enviar.w,
          height: enviar.h,
          borderRadius: 8,
          background: YC.primario,
          display: "grid",
          placeItems: "center",
          transform: `scale(${hundido})`,
        }}
      >
        <Icono nombre="enviar" tamano={20} color={YC.textoSobrePrimario} grosor={2} />
      </div>
      <div
        style={{
          position: "absolute",
          left: campo.x - m.x,
          top: campo.y - (m.y + m.h - m.pie) + campo.h + 8,
          fontSize: 12,
          lineHeight: "18px",
          color: YC.textoTerciario,
        }}
      >
        {CHAT_ASISTENTE.aviso}
      </div>
    </div>
  );
};
