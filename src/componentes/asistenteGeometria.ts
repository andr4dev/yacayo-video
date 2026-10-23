// Dónde queda cada cosa del chat del asistente en cada frame, en px de la pantalla donde vive:
// la del celular (390 × 844, la hoja) o la del panel de escritorio (1440 × 900, la tarjeta).
// La usan el chat (para dibujar) y la cámara, el foco y las tarjetas (para apuntar a un mensaje).
import { spring } from "remotion";
import type { RESPUESTAS } from "../asistente";
import { type Conversacion, FPS, type PasoDelChat } from "../constantes";
import type { Caja } from "./chatGeometria";

export type Variante = "hoja" | "tarjeta";

/**
 * Celular: una hoja que sube desde abajo y deja ver 48 px de la página (como las hojas del panel).
 * Escritorio: una tarjeta de 380 px abajo a la derecha, encima de la burbuja.
 */
export const MARCO: Record<Variante, Caja & { encabezado: number; pie: number }> = {
  hoja: { x: 0, y: 48, w: 390, h: 796, encabezado: 76, pie: 104 },
  tarjeta: { x: 1036, y: 248, w: 380, h: 560, encabezado: 72, pie: 100 },
};

/** La burbuja: abajo a la derecha, encima de la barra de navegación en el celular. */
export const BURBUJA: Record<Variante, { x: number; y: number; lado: number }> = {
  hoja: { x: 318, y: 692, lado: 56 },
  tarjeta: { x: 1360, y: 820, lado: 56 },
};

export const MARGEN = 16;
/** El aire arriba y abajo de los mensajes. */
const RELLENO = 12;
const SEPARACION = 12;
/** El ancho de las respuestas; el mismo en las dos variantes, así cortan igual las líneas. */
export const ANCHO_RESPUESTA = 306;
export const ANCHO_PENSANDO = 236;
export const ALTO_PREGUNTA = 44;
export const ALTO_PENSANDO = 44;
/** La línea "Consulté: …" debajo de la respuesta. */
export const ALTO_CONSULTE = 24;
/** El saludo y las cinco sugerencias del chat vacío. */
export const SALUDO = { alto: 24, separacion: 14, sugerencia: 44, entreSugerencias: 8 } as const;
const ALTO_VACIO = SALUDO.alto + SALUDO.separacion + 5 * SALUDO.sugerencia + 4 * SALUDO.entreSugerencias;

/**
 * El alto del globo de cada respuesta, a ANCHO_RESPUESTA (texto de 15 px). Medido en el Studio
 * (composición "AsistenteRespuestas"): si cambia un texto, vuelve a medirlo.
 */
export const ALTO_RESPUESTA: Record<keyof typeof RESPUESTAS, number> = {
  hoy: 66,
  porCuenta: 140,
  porRevisar: 166,
  fraude: 88,
  plan: 66,
  confirmar: 88,
};

export const progreso = (frame: number, desde: number) =>
  spring({ frame: frame - desde, fps: FPS, config: { damping: 18, stiffness: 170 } });

/** El área de los mensajes, entre el encabezado y el pie. */
export const areaDe = (variante: Variante): Caja => {
  const m = MARCO[variante];
  return { x: m.x, y: m.y + m.encabezado, w: m.w, h: m.h - m.encabezado - m.pie };
};

export type MensajeDelChat = {
  paso: PasoDelChat;
  /** Para una pregunta, `x` es su borde derecho (el globo se ajusta al texto). */
  caja: Caja;
  entrada: number;
  /** Paso de "Buscando en tus datos…" a la respuesta (0 → 1). */
  respuesta: number;
};

export type GeometriaDelChat = {
  /** El saludo y las sugerencias (se van al llegar la primera pregunta). */
  vacio: { y: number; opacidad: number } | null;
  mensajes: MensajeDelChat[];
};

export function geometriaAsistente(conversacion: Conversacion, variante: Variante, frame: number): GeometriaDelChat {
  const area = areaDe(variante);
  const primera = conversacion.pasos.find((paso) => paso.de === "usuario");
  const salidaVacio = primera && frame >= primera.aparece - 4 ? progreso(frame, primera.aparece - 4) : 0;
  const hayVacio = frame >= conversacion.abre && salidaVacio < 0.999;

  const mensajes: MensajeDelChat[] = [];
  for (const paso of conversacion.pasos) {
    const inicio = paso.de === "usuario" ? paso.aparece : paso.pensando;
    if (frame < inicio) continue;
    const entrada = progreso(frame, inicio);
    if (paso.de === "usuario") {
      mensajes.push({ paso, entrada, respuesta: 1, caja: { x: 0, y: 0, w: 0, h: ALTO_PREGUNTA * entrada } });
    } else {
      const respuesta = frame < paso.aparece ? 0 : progreso(frame, paso.aparece);
      const alto = ALTO_RESPUESTA[paso.respuesta] + ALTO_CONSULTE;
      const h = ALTO_PENSANDO * entrada + (alto - ALTO_PENSANDO) * respuesta;
      const w = ANCHO_PENSANDO + (ANCHO_RESPUESTA - ANCHO_PENSANDO) * respuesta;
      mensajes.push({ paso, entrada, respuesta, caja: { x: 0, y: 0, w, h } });
    }
  }

  // Se apilan desde arriba; cuando no caben, lo viejo sube y sale por arriba (el chat baja solo).
  const tope = area.y + RELLENO;
  const altoVacio = hayVacio ? ALTO_VACIO * (1 - salidaVacio) : 0;
  const antes = (i: number, m: MensajeDelChat) => (i > 0 || altoVacio > 0 ? SEPARACION * Math.min(1, m.entrada) : 0);
  const alto = mensajes.reduce((suma, m, i) => suma + antes(i, m) + m.caja.h, altoVacio);
  const desplazamiento = Math.max(0, alto - (area.h - 2 * RELLENO));

  let y = tope + altoVacio - desplazamiento;
  mensajes.forEach((m, i) => {
    y += antes(i, m);
    m.caja.y = y;
    m.caja.x = m.paso.de === "usuario" ? area.x + area.w - MARGEN : area.x + MARGEN;
    y += m.caja.h;
  });

  return { vacio: hayVacio ? { y: tope - desplazamiento, opacidad: 1 - salidaVacio } : null, mensajes };
}

/** La caja de un mensaje en un frame (`null` si todavía no aparece). */
export const cajaDelMensaje = (conversacion: Conversacion, variante: Variante, id: string, frame: number): Caja | null =>
  geometriaAsistente(conversacion, variante, frame).mensajes.find((m) => m.paso.id === id)?.caja ?? null;

/** El centro de la sugerencia número `i` del chat vacío. */
export const centroDeSugerencia = (variante: Variante, i: number) => {
  const area = areaDe(variante);
  const y = area.y + RELLENO + SALUDO.alto + SALUDO.separacion + i * (SALUDO.sugerencia + SALUDO.entreSugerencias);
  return { x: area.x + MARGEN + 80, y: y + SALUDO.sugerencia / 2 };
};

/** El campo para escribir y el botón de enviar, abajo. */
export const pieDe = (variante: Variante) => {
  const m = MARCO[variante];
  const y = m.y + m.h - m.pie + 12;
  const enviar = { x: m.x + m.w - MARGEN - 44, y, w: 44, h: 44 };
  const campo = { x: m.x + MARGEN, y, w: enviar.x - 8 - (m.x + MARGEN), h: 44 };
  return { campo, enviar };
};
