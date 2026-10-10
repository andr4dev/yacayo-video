// Textos, cifras y tiempos del video, en un solo lugar.
// Textos y cifras: yacayo-src/.claude/skills/diseno/SKILL.md (§5 Marca, §8 Voz, §9 WhatsApp,
// §13 Datos de ejemplo). No inventes: si cambias algo aquí, que salga de la skill.

// --- Ritmo -------------------------------------------------------------------------------
export const FPS = 30;
export const BPM = 120;
/** Frames entre dos golpes: a 120 BPM y 30 fps, 15 frames (medio segundo). */
export const GOLPE = (FPS * 60) / BPM;
/** El frame del golpe número `n` (desde 0). Los cortes caen siempre en un golpe. */
export const golpe = (n: number) => Math.round(n * GOLPE);

export const DURACION = golpe(50); // 750 frames = 25 s

/** Todos los golpes del video, para sincronizar con la música. */
export const GOLPES = Array.from({ length: DURACION / GOLPE }, (_, i) => golpe(i));

/**
 * Pista opcional: si existe public/music.mp3, suena (a 120 BPM, con el primer golpe en el
 * frame 0). Si no, el video queda mudo.
 */
export const MUSICA = "music.mp3";

// --- Escenas (en golpes) -----------------------------------------------------------------
export const ESCENAS = {
  gancho: { desde: golpe(0), hasta: golpe(5) }, //        0–2,5 s
  foto: { desde: golpe(5), hasta: golpe(12) }, //         2,5–6 s
  respuesta: { desde: golpe(12), hasta: golpe(18) }, //   6–9 s
  panel: { desde: golpe(18), hasta: golpe(28) }, //       9–14 s
  repetido: { desde: golpe(28), hasta: golpe(36) }, //    14–18 s
  montaje: { desde: golpe(36), hasta: golpe(42) }, //     18–21 s
  cierre: { desde: golpe(42), hasta: golpe(50) }, //      21–25 s
} as const;

// --- Textos en movimiento ------------------------------------------------------------------
// `clave` es la palabra en --yc-primario con el subrayado de --yc-acento. Máximo 5 palabras.
export const TITULARES = {
  ganchoA: { texto: "¿Ese pago", desde: golpe(0), hasta: golpe(5) },
  // "cayó?" termina de entrar justo cuando la moneda toca, en el golpe 3.
  ganchoB: { texto: "sí cayó?", clave: "cayó?", desde: golpe(2) - 4, hasta: golpe(5), monedaToca: golpe(3) },
  segundos: { texto: "En segundos.", clave: "segundos.", desde: golpe(14) + 7, hasta: golpe(18) },
  panel: { texto: "Todo queda en tu panel.", clave: "panel.", desde: golpe(19) + 7, hasta: golpe(27) + 7 },
  unaVez: { texto: "Un pago, una sola vez.", clave: "una", desde: golpe(31) + 7, hasta: golpe(36) },
} as const;

/** El montaje de la escena 6: una pantalla por cada dos golpes, con su etiqueta. */
export const MONTAJE = [
  { pantalla: "inicio", etiqueta: "Cuánto te entró", clave: "entró", desde: golpe(36) },
  { pantalla: "porRevisar", etiqueta: "Tú eliges cuál", clave: "eliges", desde: golpe(38) },
  { pantalla: "ingresosDespues", etiqueta: "Quién lo confirmó", clave: "confirmó", desde: golpe(40) },
] as const;

export const CIERRE = {
  fondo: golpe(43), //   el fondo pasa a --yc-primario
  logo: golpe(44), //    cae la moneda del logo
  frase: golpe(47), //   "Reenvía los correos…"
  dominio: golpe(48),
  frase1: "Reenvía los correos de tu banco.",
  frase2: "Te decimos si cayó.",
  url: "yacayo.co",
};

// --- WhatsApp (§9) -------------------------------------------------------------------------
export const CHAT = {
  contacto: "YaCayó",
  remitente: "Caja 1",
  hora: "8:15", // el reloj del celular: Juan P. se confirmó a las 8:15 p. m. (§3.1)
  comprobante: { titulo: "Transferencia exitosa", monto: "$85.000", hora: "8:14\u00a0p.\u00a0m.", banco: "Nequi" },
  // ✅ y ⚠️ se dibujan como íconos; el resto del texto va tal cual. Las horas llevan espacios
  // que no se parten (\u00a0) para que "p. m." no quede cortado entre dos líneas.
  cayo: "Cayó · $85.000 · Nequi · 8:14\u00a0p.\u00a0m. · de Juan\u00a0P. · a tu Nequi ",
  cuenta: "···2002",
  yaUsado: "Ese pago ya se usó (hoy, 8:14\u00a0p.\u00a0m.)",
};

/** Cuándo aparece cada mensaje del chat (frames absolutos del video). */
export const MENSAJES = {
  foto1: golpe(8),
  escribiendo1: golpe(13),
  cayo: golpe(14),
  foto2: golpe(30),
  escribiendo2: golpe(30) + 12,
  yaUsado: golpe(31),
} as const;

// --- Tarjetas que salen del celular ----------------------------------------------------------
export const TARJETAS = {
  mandaLaFoto: { texto: "Manda la foto", desde: golpe(9), hasta: golpe(12) - 2 },
  confirmado: { texto: "Confirmado · Caja 1 · WhatsApp", desde: golpe(20) + 5, hasta: golpe(23) + 5 },
} as const;

// --- Panel (§13, totales de control) -------------------------------------------------------
export const PANEL = {
  totalSinCamila: 542_000,
  totalConCamila: 614_000,
  resumenSinCamila: "6 pagos · 2 sin confirmar",
  resumenConCamila: "7 pagos · 3 sin confirmar",
  /** Entra el pago de Camila R. y el total cuenta. */
  llegaCamila: golpe(23),
  cuenta: { desde: golpe(24) + 5, duracion: golpe(2) + 5 },
};

// --- Pantallas dentro del celular ------------------------------------------------------------
export type Pantalla = "chat" | "ingresos" | "inicio" | "porRevisar" | "ingresosDespues";
export type Entrada = "desliza-izq" | "desliza-der" | "recorte";

export const PANTALLAS: { pantalla: Pantalla; desde: number; entrada: Entrada }[] = [
  { pantalla: "chat", desde: 0, entrada: "recorte" },
  { pantalla: "ingresos", desde: golpe(18) + 10, entrada: "desliza-izq" },
  { pantalla: "chat", desde: golpe(28), entrada: "desliza-der" },
  { pantalla: "inicio", desde: golpe(36), entrada: "recorte" },
  { pantalla: "porRevisar", desde: golpe(38), entrada: "recorte" },
  { pantalla: "ingresosDespues", desde: golpe(40), entrada: "recorte" },
];
/** Cuánto dura el cambio de pantalla (deslizamiento o recorte). */
export const CAMBIO_PANTALLA = 14;
