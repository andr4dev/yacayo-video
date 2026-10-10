// El chat de WhatsApp con YaCayó, como lo ve Caja 1 en su celular (unidades de 390 × 844).
// Los mensajes salen de MENSAJES (constantes.ts) y su posición de chatGeometria.ts.
import type React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CHAT } from "../constantes";
import { FUENTE, FUENTE_MONO, NUMEROS, YC, alfa } from "../marca";
import { CHAT_GEOM, ESCRIBIENDO, geometriaChat, type MensajeVisible } from "./chatGeometria";
import { Comprobante } from "./Comprobante";
import { Icono } from "./Iconos";

const VERDE_SALIDA = `color-mix(in srgb, ${YC.verificado} 14%, white)`;

export const WhatsAppChat: React.FC = () => {
  const frame = useCurrentFrame();
  const mensajes = geometriaChat(frame);
  const arriba = CHAT_GEOM.barraEstado + CHAT_GEOM.encabezado;
  const yHoy = Math.max(arriba + 12, (mensajes[0]?.caja.y ?? 844 - CHAT_GEOM.barraEscribir - CHAT_GEOM.margen) - 40);

  return (
    <div style={{ position: "absolute", inset: 0, background: YC.fondoClaro, fontFamily: FUENTE, color: YC.texto }}>
      {/* "Hoy" */}
      <div style={{ position: "absolute", top: yHoy, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <span
          style={{
            background: YC.superficie,
            border: `1px solid ${YC.borde}`,
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: 12.5,
            fontWeight: 600,
            color: YC.textoSecundario,
          }}
        >
          Hoy
        </span>
      </div>

      {mensajes.map((m) =>
        m.def.lado === "sale" ? <Foto key={m.def.id} m={m} /> : <Respuesta key={m.def.id} m={m} frame={frame} />,
      )}

      <Encabezado />
      <BarraEscribir />
    </div>
  );
};

/** La foto del comprobante que manda Caja 1. */
const Foto: React.FC<{ m: MensajeVisible }> = ({ m }) => (
  <div style={{ position: "absolute", left: m.caja.x, top: m.caja.y, width: m.caja.w, height: m.caja.h }}>
    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: m.def.ancho,
        height: m.def.alto,
        transformOrigin: "bottom right",
        transform: `scale(${0.6 + 0.4 * m.entrada})`,
        opacity: Math.min(1, m.entrada * 1.6),
        background: VERDE_SALIDA,
        borderRadius: 12,
        padding: 5,
        boxSizing: "border-box",
        boxShadow: `0 1px 1px ${alfa(YC.fondoOscuro, 0.08)}`,
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, color: YC.primario, padding: "2px 6px 6px" }}>{CHAT.remitente}</div>
      <div style={{ position: "relative" }}>
        <Comprobante ancho={m.def.ancho - 10} alto={m.def.alto - 42} />
        <div style={{ position: "absolute", right: 8, bottom: 6 }}>
          <Icono nombre="dobleCheck" tamano={16} color={YC.textoInvertido} grosor={2.4} />
        </div>
      </div>
    </div>
  </div>
);

/** "escribiendo…" y después la respuesta de YaCayó. */
const Respuesta: React.FC<{ m: MensajeVisible; frame: number }> = ({ m, frame }) => {
  const esFraude = m.def.id === "yaUsado";
  const texto = interpolate(m.respuesta, [0.45, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: m.caja.x,
        top: m.caja.y,
        width: m.caja.w,
        height: m.caja.h,
        background: YC.superficie,
        border: `1px solid ${YC.borde}`,
        borderRadius: 12,
        overflow: "hidden",
        opacity: Math.min(1, m.entrada * 1.6),
        boxShadow: `0 1px 1px ${alfa(YC.fondoOscuro, 0.06)}`,
      }}
    >
      {esFraude ? (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: YC.fraude, opacity: texto }} />
      ) : null}
      {/* escribiendo… */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ESCRIBIENDO.ancho,
          height: ESCRIBIENDO.alto,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          opacity: 1 - m.respuesta,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: YC.textoTerciario,
              transform: `translateY(${-3 * Math.max(0, Math.sin(frame * 0.4 - i * 0.9))}px)`,
              opacity: 0.6 + 0.4 * Math.max(0, Math.sin(frame * 0.4 - i * 0.9)),
            }}
          />
        ))}
      </div>
      {/* La respuesta, tal cual la manda YaCayó (§9). */}
      <div
        style={{
          position: "absolute",
          left: esFraude ? 4 : 0,
          top: 0,
          width: m.def.ancho - (esFraude ? 4 : 0),
          padding: "10px 13px",
          boxSizing: "border-box",
          fontSize: 16,
          lineHeight: "23px",
          opacity: texto,
          ...NUMEROS,
        }}
      >
        {esFraude ? (
          <>
            <Emoji tipo="alerta" />
            {CHAT.yaUsado}
          </>
        ) : (
          <>
            <Emoji tipo="ok" />
            {CHAT.cayo}
            <span style={{ fontFamily: FUENTE_MONO, fontSize: 14.5 }}>{CHAT.cuenta}</span>
          </>
        )}
      </div>
    </div>
  );
};

/** ✅ y ⚠️ dibujados con los colores de estado, para que se vean igual en cualquier equipo. */
const Emoji: React.FC<{ tipo: "ok" | "alerta" }> = ({ tipo }) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 18 18"
    style={{ display: "inline-block", verticalAlign: "-3px", marginRight: 6 }}
  >
    {tipo === "ok" ? (
      <>
        <rect width={18} height={18} rx={4} fill={YC.verificado} />
        <path d="M4.5 9.3 7.6 12.3 13.5 6" fill="none" stroke={YC.sobreEstado} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <path d="M9 1.5 17 16H1Z" fill={YC.fraude} stroke={YC.fraude} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M9 6.5V11" stroke={YC.sobreEstado} strokeWidth={2} strokeLinecap="round" />
        <circle cx={9} cy={13.4} r={1.1} fill={YC.sobreEstado} />
      </>
    )}
  </svg>
);

const Encabezado: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: CHAT_GEOM.barraEstado + CHAT_GEOM.encabezado,
      background: YC.superficie,
      borderBottom: `1px solid ${YC.borde}`,
    }}
  >
    {/* Barra de estado */}
    <div style={{ position: "absolute", left: 34, top: 14, fontSize: 15, fontWeight: 600, ...NUMEROS }}>{CHAT.hora}</div>
    <div style={{ position: "absolute", right: 28, top: 17, display: "flex", gap: 6, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
        {[4, 6, 8, 10].map((h) => (
          <span key={h} style={{ width: 3, height: h, borderRadius: 1, background: YC.texto }} />
        ))}
      </div>
      <span
        style={{
          width: 23,
          height: 11,
          borderRadius: 3,
          border: `1.4px solid ${YC.texto}`,
          padding: 1.5,
          boxSizing: "border-box",
          display: "flex",
        }}
      >
        <span style={{ width: "72%", background: YC.texto, borderRadius: 1.5 }} />
      </span>
    </div>
    {/* Contacto */}
    <div
      style={{
        position: "absolute",
        top: CHAT_GEOM.barraEstado,
        left: 6,
        right: 0,
        height: CHAT_GEOM.encabezado,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icono nombre="atras" tamano={28} color={YC.texto} grosor={2.2} />
      <Img src={staticFile("marca/perfil-whatsapp-640.png")} style={{ width: 38, height: 38, borderRadius: "50%" }} />
      <div style={{ marginLeft: 6, fontSize: 17, fontWeight: 600 }}>{CHAT.contacto}</div>
    </div>
  </div>
);

const BarraEscribir: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: CHAT_GEOM.barraEscribir,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 10px 10px",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        flex: 1,
        height: 44,
        borderRadius: 22,
        background: YC.superficie,
        border: `1px solid ${YC.borde}`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        justifyContent: "space-between",
        color: YC.textoTerciario,
        fontSize: 16,
      }}
    >
      Mensaje
      <Icono nombre="clip" tamano={20} color={YC.textoTerciario} grosor={2} />
    </div>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: YC.verificado,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Icono nombre="microfono" tamano={20} color={YC.sobreEstado} grosor={2.2} />
    </div>
  </div>
);
