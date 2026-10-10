// La foto del comprobante que manda Caja 1: un papel sobre la mesa, como la foto del comprobante
// del prototipo (Review.tsx, ReceiptPhoto). Los datos son los de Juan P. (§9 y §13).
import type React from "react";
import { CHAT } from "../constantes";
import { FUENTE, NUMEROS, YC, alfa } from "../marca";

export const Comprobante: React.FC<{ ancho: number; alto: number }> = ({ ancho, alto }) => {
  const c = CHAT.comprobante;
  return (
    <div
      style={{
        width: ancho,
        height: alto,
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        background: `linear-gradient(160deg, ${YC.borde}, ${YC.bordeSuave})`,
        fontFamily: FUENTE,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: ancho * 0.66,
          height: alto * 0.8,
          transform: "translate(-50%, -50%) rotate(-4deg)",
          background: YC.superficie,
          borderRadius: 6,
          boxShadow: `0 6px 14px ${alfa(YC.fondoOscuro, 0.16)}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
          gap: 7,
          color: YC.texto,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: YC.primario,
            color: YC.textoInvertido,
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          N
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: YC.textoSecundario }}>{c.titulo}</div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em", ...NUMEROS }}>{c.monto}</div>
        <div style={{ fontSize: 11.5, color: YC.textoSecundario, ...NUMEROS }}>{c.hora}</div>
        <div style={{ fontSize: 11, color: YC.textoTerciario }}>{c.banco}</div>
        <div style={{ width: "62%", height: 6, borderRadius: 3, background: YC.bordeSuave, marginTop: 6 }} />
        <div style={{ width: "44%", height: 6, borderRadius: 3, background: YC.bordeSuave }} />
      </div>
    </div>
  );
};
