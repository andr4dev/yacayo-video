// Dónde queda cada mensaje del chat en cada frame, en unidades de la pantalla (390 × 844).
// La usan el chat (para dibujar) y la cámara y las tarjetas (para apuntar a un mensaje).
import { spring } from "remotion";
import { FPS, MENSAJES } from "../constantes";

export const CHAT_GEOM = {
  barraEstado: 44,
  encabezado: 60,
  barraEscribir: 66,
  margen: 10,
  separacion: 8,
} as const;

export type IdMensaje = "foto1" | "cayo" | "foto2" | "yaUsado";
export type Caja = { x: number; y: number; w: number; h: number };

type Definicion = {
  id: IdMensaje;
  lado: "sale" | "entra";
  aparece: number;
  /** Desde cuándo se ve "escribiendo…" antes de la respuesta. */
  escribiendo?: number;
  alto: number;
  ancho: number;
};

export const DEFINICIONES: Definicion[] = [
  { id: "foto1", lado: "sale", aparece: MENSAJES.foto1, alto: 304, ancho: 252 },
  { id: "cayo", lado: "entra", escribiendo: MENSAJES.escribiendo1, aparece: MENSAJES.cayo, alto: 70, ancho: 300 },
  { id: "foto2", lado: "sale", aparece: MENSAJES.foto2, alto: 304, ancho: 252 },
  { id: "yaUsado", lado: "entra", escribiendo: MENSAJES.escribiendo2, aparece: MENSAJES.yaUsado, alto: 70, ancho: 300 },
];

export const ESCRIBIENDO = { alto: 44, ancho: 74 } as const;

export const progreso = (frame: number, desde: number) =>
  spring({ frame: frame - desde, fps: FPS, config: { damping: 17, stiffness: 180 } });

export type MensajeVisible = {
  def: Definicion;
  caja: Caja;
  /** Entrada del globo (0 → 1). */
  entrada: number;
  /** Paso de "escribiendo…" a la respuesta (0 → 1); 1 si no hay "escribiendo…". */
  respuesta: number;
};

export function geometriaChat(frame: number): MensajeVisible[] {
  const visibles: MensajeVisible[] = [];
  for (const def of DEFINICIONES) {
    const inicio = def.escribiendo ?? def.aparece;
    if (frame < inicio) continue;
    const entrada = progreso(frame, inicio);
    const respuesta = def.escribiendo === undefined ? 1 : frame < def.aparece ? 0 : progreso(frame, def.aparece);
    const alto =
      def.escribiendo === undefined
        ? def.alto * entrada
        : ESCRIBIENDO.alto * entrada + (def.alto - ESCRIBIENDO.alto) * respuesta;
    const ancho = def.escribiendo === undefined ? def.ancho : ESCRIBIENDO.ancho + (def.ancho - ESCRIBIENDO.ancho) * respuesta;
    visibles.push({ def, entrada, respuesta, caja: { x: 0, y: 0, w: ancho, h: alto } });
  }

  // Se apilan desde abajo, como en WhatsApp: lo nuevo empuja lo viejo hacia arriba.
  let abajo = 844 - CHAT_GEOM.barraEscribir - CHAT_GEOM.margen;
  for (let i = visibles.length - 1; i >= 0; i--) {
    const m = visibles[i];
    m.caja.y = abajo - m.caja.h;
    m.caja.x = m.def.lado === "sale" ? 390 - CHAT_GEOM.margen - m.caja.w : CHAT_GEOM.margen;
    abajo = m.caja.y - CHAT_GEOM.separacion * Math.min(1, m.entrada);
  }
  return visibles;
}

export const cajaMensaje = (id: IdMensaje, frame: number): Caja | null =>
  geometriaChat(frame).find((m) => m.def.id === id)?.caja ?? null;
