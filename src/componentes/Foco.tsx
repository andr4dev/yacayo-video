// Foco: para no saturar, en cada momento clave la pantalla del celular se oscurece suavemente y
// solo queda iluminado lo que importa (la foto enviada, la respuesta, la fila de Juan P., el
// total, cada confirmado). Si un foco sigue a otro sin pausa, la luz se desliza de uno al otro.
// Va dentro del celular, encima de la pantalla (unidades de 390 × 844).
import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CONFIRMADOS, ESCENAS, MENSAJES, PANEL, POR_REVISAR, TARJETAS, TITULARES } from "../constantes";
import { desplazamientoConfirmados } from "../escenario";
import { YC, alfa } from "../marca";
import zonas from "../../public/screens/zonas.json";
import { type Caja, cajaMensaje } from "./chatGeometria";

type FocoDef = { desde: number; hasta: number; caja: (frame: number) => Caja | null };

const fija = (c: Caja) => () => c;
const OSCURO = 0.42;
const MARGEN = 8;

/** En la lista de confirmados, la tarjeta de cada pago (su línea "Confirmó …" va abajo). */
const tarjetaConfirmada = (id: (typeof CONFIRMADOS.filas)[number]["id"]) => (frame: number): Caja => {
  const linea = zonas["ingresos-confirmados"][id];
  const arriba = zonas["ingresos-antes"].confirmoJuan.y - zonas["ingresos-antes"].tarjetaJuan.y;
  return { x: 17, y: linea.y - arriba - desplazamientoConfirmados(frame), w: 356, h: 150 };
};

const filas = CONFIRMADOS.filas;
const d = zonas["por-revisar-detalle"];

export const FOCOS: FocoDef[] = [
  // 2 · La foto que manda Caja 1.
  { desde: TARJETAS.mandaLaFoto.desde, hasta: TARJETAS.mandaLaFoto.hasta, caja: (f) => cajaMensaje("foto1", f) },
  // 3 · La respuesta de YaCayó.
  { desde: MENSAJES.cayo + 4, hasta: TITULARES.segundos.hasta - 10, caja: (f) => cajaMensaje("cayo", f) },
  // 4 · La fila de Juan P. y, después, el total que cuenta.
  { desde: TARJETAS.confirmado.desde - 6, hasta: TARJETAS.confirmado.hasta, caja: fija(zonas["ingresos-antes"].tarjetaJuan) },
  { desde: PANEL.cuenta.desde - 6, hasta: ESCENAS.panel.hasta - 8, caja: fija({ x: 40, y: 236, w: 310, h: 92 }) },
  // 5 · "Ese pago ya se usó".
  { desde: MENSAJES.yaUsado + 2, hasta: ESCENAS.repetido.hasta - 8, caja: (f) => cajaMensaje("yaUsado", f) },
  // 7 · Lo leído en la foto y, después, el pago de Laura M.
  {
    desde: ESCENAS.porRevisar.desde + 15,
    hasta: POR_REVISAR.baja,
    caja: fija({ x: d.montoLeido.x, y: d.montoLeido.y, w: d.horaLeida.x + d.horaLeida.w - d.montoLeido.x, h: d.montoLeido.h }),
  },
  { desde: POR_REVISAR.baja, hasta: POR_REVISAR.dialogo - 2, caja: fija(d.laura) },
  // 8 · Cada pago confirmado, uno por uno.
  { desde: filas[0].desde - 4, hasta: filas[1].desde - 4, caja: tarjetaConfirmada("juan") },
  { desde: filas[1].desde - 4, hasta: filas[2].desde - 4, caja: tarjetaConfirmada("carlos") },
  { desde: filas[2].desde - 4, hasta: filas[3].desde - 4, caja: tarjetaConfirmada("luisa") },
  { desde: filas[3].desde - 4, hasta: ESCENAS.confirmados.hasta - 10, caja: tarjetaConfirmada("marta") },
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
