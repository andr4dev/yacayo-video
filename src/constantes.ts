// Textos, cifras y tiempos del video, en un solo lugar.
// Textos y cifras: yacayo-src/.claude/skills/diseno/SKILL.md (§5 Marca, §8 Voz, §9 WhatsApp,
// §13 Datos de ejemplo). No inventes: si cambias algo aquí, que salga de la skill.
//
// Ritmo: una cosa a la vez. Primero pasa la acción en el celular, después entra el titular, y
// cada momento se queda quieto un instante antes del siguiente. Todos los tiempos de una escena
// cuentan desde su inicio (`en(escena, golpes)`): para dar más aire, alarga la escena aquí.

// --- Ritmo -------------------------------------------------------------------------------
export const FPS = 30;
export const BPM = 120;
/** Frames entre dos golpes: a 120 BPM y 30 fps, 15 frames (medio segundo). */
export const GOLPE = (FPS * 60) / BPM;
/** El frame del golpe número `n` (desde 0). Los cortes caen siempre en un golpe. */
export const golpe = (n: number) => Math.round(n * GOLPE);

// --- Escenas (en golpes) -----------------------------------------------------------------
export const ESCENAS = {
  gancho: { desde: golpe(0), hasta: golpe(6) }, //         0–3 s
  foto: { desde: golpe(6), hasta: golpe(15) }, //          3–7,5 s
  respuesta: { desde: golpe(15), hasta: golpe(24) }, //    7,5–12 s
  panel: { desde: golpe(24), hasta: golpe(37) }, //        12–18,5 s
  repetido: { desde: golpe(37), hasta: golpe(46) }, //     18,5–23 s
  inicio: { desde: golpe(46), hasta: golpe(51) }, //       23–25,5 s
  porRevisar: { desde: golpe(51), hasta: golpe(66) }, //   25,5–33 s
  confirmados: { desde: golpe(66), hasta: golpe(77) }, //  33–38,5 s
  cierre: { desde: golpe(77), hasta: golpe(88) }, //       38,5–44 s
} as const;

export const DURACION = ESCENAS.cierre.hasta; // 1320 frames = 44 s

/** Todos los golpes del video, para sincronizar con la música. */
export const GOLPES = Array.from({ length: DURACION / GOLPE }, (_, i) => golpe(i));

/** Un momento de una escena: `golpes` golpes después de que empieza, más `frames`. */
const en = (escena: keyof typeof ESCENAS, golpes: number, frames = 0) => ESCENAS[escena].desde + golpe(golpes) + frames;

/**
 * Pista opcional: si existe public/music.mp3, suena (a 120 BPM, con el primer golpe en el
 * frame 0). Si no, el video queda mudo.
 */
export const MUSICA = "music.mp3";

// --- WhatsApp (§9) -------------------------------------------------------------------------
export const CHAT = {
  contacto: "YaCayó",
  remitente: "Caja 1",
  hora: "8:15", // el reloj del celular: Juan P. se confirmó a las 8:15 p. m. (§3.1)
  comprobante: { titulo: "Transferencia exitosa", monto: "$85.000", hora: "8:14 p. m.", banco: "Nequi" },
  // ✅ y ⚠️ se dibujan como íconos; el resto del texto va tal cual. Las horas llevan espacios
  // que no se parten ( ) para que "p. m." no quede cortado entre dos líneas.
  cayo: "Cayó · $85.000 · Nequi · 8:14 p. m. · de Juan P. · a tu Nequi ",
  cuenta: "···2002",
  yaUsado: "Ese pago ya se usó (hoy, 8:14 p. m.)",
};

/** Cuándo aparece cada mensaje del chat (frames absolutos del video). */
export const MENSAJES = {
  foto1: en("foto", 3),
  escribiendo1: en("respuesta", 1),
  cayo: en("respuesta", 2),
  foto2: en("repetido", 2),
  escribiendo2: en("repetido", 2, 12),
  yaUsado: en("repetido", 3),
} as const;

// --- Tarjetas que salen del celular ----------------------------------------------------------
export const TARJETAS = {
  mandaLaFoto: { texto: "Manda la foto", desde: en("foto", 4), hasta: en("foto", 8) },
  confirmado: { texto: "Confirmado · Caja 1 · WhatsApp", desde: en("panel", 4, 5), hasta: en("panel", 7, -2) },
} as const;

// --- Panel (§13, totales de control) -------------------------------------------------------
export const PANEL = {
  totalSinCamila: 542_000,
  totalConCamila: 614_000,
  resumenSinCamila: "6 pagos · 2 sin confirmar",
  resumenConCamila: "7 pagos · 3 sin confirmar",
  /** Entra el pago de Camila R. y el total cuenta. */
  llegaCamila: en("panel", 8),
  cuenta: { desde: en("panel", 9, 5), duracion: golpe(3) },
};

// --- Por revisar: el dueño elige cuál de los dos pagos era (prototipo, §3.3) -----------------
export const POR_REVISAR = {
  /** La cámara baja de lo leído en la foto a los dos candidatos. */
  baja: en("porRevisar", 7, -5),
  /** Se dibuja el borde alrededor de Laura M. */
  borde: en("porRevisar", 8),
  toqueEsEste: en("porRevisar", 9),
  dialogo: en("porRevisar", 9, 8), // sube "Confirmar el pago de Laura M. por $50.000"
  toqueConfirmar: en("porRevisar", 12, -2),
  confirmado: en("porRevisar", 12, 7), // "Pago confirmado"
};

// --- Quién lo confirmó: Ingresos con Estado → Confirmado (§13) -------------------------------
export const CONFIRMADOS = {
  /** Una fila cada dos golpes: se subraya "Confirmó …" y sale su píldora (quién · por dónde). */
  filas: [
    { id: "juan", quien: "Caja 1 · WhatsApp", desde: en("confirmados", 1) },
    { id: "carlos", quien: "AgendNow", desde: en("confirmados", 3) },
    { id: "luisa", quien: "Web · a mano", desde: en("confirmados", 5) },
    { id: "marta", quien: "Caja 2 · QR de Nequi", desde: en("confirmados", 7) },
  ],
  /** La lista sube sola para mostrar a Luisa G. y a Marta L. */
  desplazamiento: { desde: en("confirmados", 4), hasta: en("confirmados", 6), px: 300 },
} as const;

// --- Textos en movimiento ------------------------------------------------------------------
// `clave` es la palabra en --yc-primario con el subrayado de --yc-acento. Máximo 5 palabras.
// `apoyo` es una línea más pequeña debajo del titular.
export const TITULARES = {
  ganchoA: { texto: "¿Ese pago", desde: golpe(0), hasta: ESCENAS.gancho.hasta },
  // "cayó?" termina de entrar justo cuando la moneda toca, en el golpe 3.
  ganchoB: { texto: "sí cayó?", clave: "cayó?", desde: golpe(2) - 4, hasta: ESCENAS.gancho.hasta, monedaToca: golpe(3) },
  segundos: { texto: "En segundos.", clave: "segundos.", desde: en("respuesta", 3), hasta: en("respuesta", 8) },
  panel: { texto: "Todo queda en tu panel.", clave: "panel.", desde: en("panel", 2), hasta: en("panel", 12) },
  unaVez: { texto: "Un pago, una sola vez.", clave: "una", desde: en("repetido", 4), hasta: ESCENAS.repetido.hasta },
  inicio: { texto: "Cuánto te entró", clave: "entró", desde: en("inicio", 0, 8), hasta: ESCENAS.inicio.hasta },
  dosPagos: {
    texto: "¿Dos pagos iguales?",
    clave: "iguales?",
    apoyo: "Si YaCayó duda, te pregunta.",
    desde: en("porRevisar", 1),
    hasta: en("porRevisar", 7),
  },
  eliges: { texto: "Tú eliges cuál.", clave: "eliges", desde: en("porRevisar", 7), hasta: ESCENAS.porRevisar.hasta },
  quien: {
    texto: "Quién lo confirmó",
    clave: "confirmó",
    apoyo: "y por dónde.",
    desde: en("confirmados", 0, 6),
    hasta: ESCENAS.confirmados.hasta,
  },
} as const;

export const CIERRE = {
  fondo: en("cierre", 1), //   el fondo pasa a --yc-primario
  logo: en("cierre", 2), //    cae la moneda del logo
  frase: en("cierre", 5),
  dominio: en("cierre", 6),
  texto: "Verificamos cada pago que recibes.",
  url: "yacayo.co",
};

// --- Pantallas dentro del celular ------------------------------------------------------------
export type Pantalla =
  | "chat"
  | "ingresos"
  | "inicio"
  | "porRevisar"
  | "porRevisarDialogo"
  | "porRevisarConfirmado"
  | "confirmados";
export type Entrada = "desliza-izq" | "desliza-der" | "recorte";

export const PANTALLAS: { pantalla: Pantalla; desde: number; entrada: Entrada }[] = [
  { pantalla: "chat", desde: 0, entrada: "recorte" },
  { pantalla: "ingresos", desde: en("panel", 0, 10), entrada: "desliza-izq" },
  { pantalla: "chat", desde: ESCENAS.repetido.desde, entrada: "desliza-der" },
  { pantalla: "inicio", desde: ESCENAS.inicio.desde, entrada: "recorte" },
  { pantalla: "porRevisar", desde: ESCENAS.porRevisar.desde, entrada: "recorte" },
  { pantalla: "porRevisarDialogo", desde: POR_REVISAR.dialogo, entrada: "recorte" },
  { pantalla: "porRevisarConfirmado", desde: POR_REVISAR.confirmado, entrada: "recorte" },
  { pantalla: "confirmados", desde: ESCENAS.confirmados.desde, entrada: "desliza-izq" },
];
/** Cuánto dura el cambio de pantalla (deslizamiento o recorte). Sin prisa. */
export const CAMBIO_PANTALLA = 20;
