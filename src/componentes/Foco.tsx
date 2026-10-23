// Foco: para no saturar, en cada momento clave la pantalla del celular se oscurece suavemente y
// solo queda iluminado lo que importa (la foto enviada, la respuesta, "Ese pago ya se usó", la
// respuesta del asistente con su fuente). Si un foco sigue a otro sin pausa, la luz se desliza
// de uno al otro. Va dentro del celular, encima de la pantalla (unidades de 390 × 844).
import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ASISTENTE, CONVERSACION, ESCENAS, MENSAJES, TARJETAS, TITULARES } from "../constantes";
import { YC, alfa } from "../marca";
import { cajaDelMensaje } from "./asistenteGeometria";
import { type Caja, cajaMensaje } from "./chatGeometria";

type FocoDef = { desde: number; hasta: number; caja: (frame: number) => Caja | null };

const OSCURO = 0.42;
const MARGEN = 8;

export const FOCOS: FocoDef[] = [
  // 2 · La foto que manda Caja 1.
  { desde: TARJETAS.mandaLaFoto.desde, hasta: TARJETAS.mandaLaFoto.hasta, caja: (f) => cajaMensaje("foto1", f) },
  // 3 · La respuesta de YaCayó.
  { desde: MENSAJES.cayo + 4, hasta: TITULARES.segundos.hasta - 10, caja: (f) => cajaMensaje("cayo", f) },
  // 5 · "Ese pago ya se usó".
  { desde: MENSAJES.yaUsado + 2, hasta: ESCENAS.repetido.hasta - 8, caja: (f) => cajaMensaje("yaUsado", f) },
  // Asistente 2 · La respuesta y "Consulté: Resumen de ingresos".
  { desde: ASISTENTE.acercaConsulte, hasta: ASISTENTE.corte, caja: (f) => cajaDelMensaje(CONVERSACION, "hoja", "r1", f) },
];

const suave = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.2, 1) } as const;
const mezclar = (a: Caja, b: Caja, t: number): Caja => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

export const Foco: React.FC = () => {
  const frame = useCurrentFrame();
  const i = FOCOS.findIndex((f) => frame >= f.desde && frame < f.hasta);
  if (i < 0) return null;
  const foco = FOCOS[i];
  const pegadoAntes = i > 0 && FOCOS[i - 1].hasta === foco.desde;
  const pegadoDespues = i < FOCOS.length - 1 && FOCOS[i + 1].desde === foco.hasta;

  let caja = foco.caja(frame);
  if (!caja) return null;
  if (pegadoAntes) {
    const anterior = FOCOS[i - 1].caja(frame);
    if (anterior) caja = mezclar(anterior, caja, interpolate(frame, [foco.desde, foco.desde + 14], [0, 1], suave));
  }
  const entra = pegadoAntes ? 1 : interpolate(frame, [foco.desde, foco.desde + 12], [0, 1], suave);
  const sale = pegadoDespues ? 1 : interpolate(frame, [foco.hasta - 12, foco.hasta], [1, 0], suave);

  return (
    <div
      style={{
        position: "absolute",
        left: caja.x - MARGEN,
        top: caja.y - MARGEN,
        width: caja.w + 2 * MARGEN,
        height: caja.h + 2 * MARGEN,
        borderRadius: 16,
        boxShadow: `0 0 0 1400px ${alfa(YC.fondoOscuro, OSCURO * Math.min(entra, sale))}`,
        pointerEvents: "none",
      }}
    />
  );
};
