// Textos, cifras y tiempos del video, en un solo lugar.
// Textos y cifras: yacayo-src/.claude/skills/diseno/SKILL.md (§5 Marca, §8 Voz, §9 WhatsApp,
// §13 Datos de ejemplo). Los del asistente, en asistente.ts. No inventes: si cambias algo aquí,
// que salga de la skill.
//
// Ritmo: una cosa a la vez. Primero pasa la acción en el celular, después entra el titular, y
// cada momento se queda quieto un instante antes del siguiente. Todos los tiempos de una escena
// cuentan desde su inicio (`en(escena, golpes)`): para dar más aire, alarga la escena aquí.
import { CREDITO_IA, RESPUESTAS } from "./asistente";

// --- Ritmo -------------------------------------------------------------------------------
export const FPS = 30;
export const BPM = 120;
/** Frames entre dos golpes: a 120 BPM y 30 fps, 15 frames (medio segundo). */
export const GOLPE = (FPS * 60) / BPM;
/** El frame del golpe número `n` (desde 0). Los cortes caen siempre en un golpe. */
export const golpe = (n: number) => Math.round(n * GOLPE);

// --- Escenas (en golpes) -----------------------------------------------------------------
// Las escenas de Ingresos, Inicio, Por revisar y "Quién lo confirmó" salieron para dejarle sitio
// al asistente en 45 s; siguen en la historia de git.
export const ESCENAS = {
  gancho: { desde: golpe(0), hasta: golpe(6) }, //             0–3 s
  foto: { desde: golpe(6), hasta: golpe(15) }, //              3–7,5 s
  respuesta: { desde: golpe(15), hasta: golpe(24) }, //        7,5–12 s
  repetido: { desde: golpe(24), hasta: golpe(33) }, //         12–16,5 s
  // El asistente: 1 · Pregúntale a tu plata, 2 · Responde con tus datos (celular),
  // 3 · Te sigue entre pantallas, 4 · Solo consulta (panel de escritorio).
  preguntale: { desde: golpe(33), hasta: golpe(40) }, //       16,5–20 s
  responde: { desde: golpe(40), hasta: golpe(50) }, //         20–25 s
  entrePantallas: { desde: golpe(50), hasta: golpe(59) }, //   25–29,5 s
  soloConsulta: { desde: golpe(59), hasta: golpe(68) }, //     29,5–34 s
  placa: { desde: golpe(68), hasta: golpe(78) }, //            34–39 s
  cierre: { desde: golpe(78), hasta: golpe(89) }, //           39–44,5 s
} as const;

export const DURACION = ESCENAS.cierre.hasta; // 1335 frames = 44,5 s

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
  comprobante: { titulo: "Transferencia exitosa", monto: "$85.000", hora: "8:14 p. m.", banco: "Nequi" },
  // ✅ y ⚠️ se dibujan como íconos; el resto del texto va tal cual. Las horas llevan espacios
  // que no se parten ( ) para que "p. m." no quede cortado entre dos líneas.
  cayo: "Cayó · $85.000 · Nequi · 8:14 p. m. · de Juan P. · a tu Nequi ",
  cuenta: "···2002",
  yaUsado: "Ese pago ya se usó (hoy, 8:14 p. m.)",
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

// --- El asistente --------------------------------------------------------------------------
/** Los momentos de las escenas del asistente (frames absolutos del video). */
export const ASISTENTE = {
  // 1 · En Inicio aparece la burbuja, late en --yc-acento, se toca y sube la hoja.
  burbuja: en("preguntale", 1, 3),
  pulso: en("preguntale", 1, 10),
  toqueBurbuja: en("preguntale", 3, 10),
  abre: en("preguntale", 3, 14),
  // 2 · Se toca "¿Cuánto entró hoy?"; al final, corte rápido a la tarjeta de Inicio.
  toqueSugerencia: en("responde", 0, 8),
  /** La cámara pasa de la respuesta a "Consulté: Resumen de ingresos". */
  acercaConsulte: en("responde", 4, 10),
  corte: en("responde", 7, 12),
  // 3 · Panel de escritorio: el cursor va a "Por revisar · 2" y la página cambia; el chat sigue.
  cursor: en("entrePantallas", 1, 7),
  clicPorRevisar: en("entrePantallas", 2, 4),
  cambiaPagina: en("entrePantallas", 2, 6),
} as const;

/** Una pregunta (tocada en una sugerencia o escrita) o una respuesta del asistente. */
export type PasoDelChat =
  | {
      id: string;
      de: "usuario";
      texto: string;
      aparece: number;
      /** Si se escribe en el campo antes de enviarla. Enviar se toca en `hasta` + 2. */
      escrito?: { desde: number; hasta: number };
    }
  | { id: string; de: "asistente"; respuesta: keyof typeof RESPUESTAS; pensando: number; aparece: number };

export type Conversacion = {
  /** Cuándo se abre el chat: desde ahí se ven el saludo y las sugerencias. */
  abre: number;
  pasos: PasoDelChat[];
};

/** "Buscando en tus datos…" dura 1,5 s antes de cada respuesta. */
const PENSANDO = 45;

/** La conversación de las escenas 2 a 4. Es una sola: el chat sigue abierto de una a otra. */
export const CONVERSACION: Conversacion = {
  abre: ASISTENTE.abre,
  pasos: [
    { id: "p1", de: "usuario", texto: RESPUESTAS.hoy.pregunta, aparece: en("responde", 0, 14) },
    { id: "r1", de: "asistente", respuesta: "hoy", pensando: en("responde", 1, 1), aparece: en("responde", 1, 1 + PENSANDO) },
    {
      id: "p2",
      de: "usuario",
      texto: RESPUESTAS.porRevisar.pregunta,
      escrito: { desde: en("entrePantallas", 3, 5), hasta: en("entrePantallas", 4, 6) },
      aparece: en("entrePantallas", 4, 10),
    },
    {
      id: "r2",
      de: "asistente",
      respuesta: "porRevisar",
      pensando: en("entrePantallas", 4, 12),
      aparece: en("entrePantallas", 4, 12 + PENSANDO),
    },
    {
      id: "p3",
      de: "usuario",
      texto: RESPUESTAS.confirmar.pregunta,
      escrito: { desde: en("soloConsulta", 0, 10), hasta: en("soloConsulta", 1, 13) },
      aparece: en("soloConsulta", 2, 2),
    },
    {
      id: "r3",
      de: "asistente",
      respuesta: "confirmar",
      pensando: en("soloConsulta", 2, 4),
      aparece: en("soloConsulta", 2, 4 + PENSANDO),
    },
  ],
};

// --- Tarjetas que salen del celular ----------------------------------------------------------
export const TARJETAS = {
  mandaLaFoto: { texto: "Manda la foto", desde: en("foto", 4), hasta: en("foto", 8) },
  dato: { texto: "Te dice de dónde sacó el dato", desde: ASISTENTE.acercaConsulte + 6, hasta: ASISTENTE.corte },
} as const;

// --- Textos en movimiento ------------------------------------------------------------------
// `clave` es la palabra en --yc-primario con el subrayado de --yc-acento. Máximo 5 palabras.
// `apoyo` es una línea más pequeña debajo del titular.
export const TITULARES = {
  ganchoA: { texto: "¿Ese pago", desde: golpe(0), hasta: ESCENAS.gancho.hasta },
  // "cayó?" termina de entrar justo cuando la moneda toca, en el golpe 3.
  ganchoB: { texto: "sí cayó?", clave: "cayó?", desde: golpe(2) - 4, hasta: ESCENAS.gancho.hasta, monedaToca: golpe(3) },
  segundos: { texto: "En segundos.", clave: "segundos.", desde: en("respuesta", 3), hasta: en("respuesta", 8) },
  unaVez: { texto: "Un pago, una sola vez.", clave: "una", desde: en("repetido", 4), hasta: ESCENAS.repetido.hasta },
  preguntale: {
    texto: "Pregúntale a tu plata.",
    clave: "plata.",
    apoyo: CREDITO_IA,
    desde: en("preguntale", 1, 5),
    hasta: ESCENAS.preguntale.hasta,
  },
  responde: { texto: "Responde con tus datos.", clave: "datos.", desde: en("responde", 1, 10), hasta: ESCENAS.responde.hasta },
  entrePantallas: {
    texto: "Te sigue entre pantallas.",
    clave: "pantallas.",
    desde: en("entrePantallas", 2, 10),
    hasta: ESCENAS.entrePantallas.hasta,
  },
  soloConsulta: {
    texto: "Solo consulta. No toca nada.",
    clave: "consulta.",
    desde: en("soloConsulta", 2, 10),
    hasta: ESCENAS.soloConsulta.hasta,
  },
} as const;

/** "Demostración con datos de ejemplo", mientras se ve el chat. */
export const NOTA = { desde: ESCENAS.preguntale.desde, hasta: ESCENAS.soloConsulta.hasta } as const;

/** La placa de Gemini en Vertex AI, antes del cierre. */
export const PLACA_TIEMPO = { desde: en("placa", 0, 12), hasta: ESCENAS.placa.hasta } as const;

export const CIERRE = {
  fondo: en("cierre", 1), //   el fondo pasa a --yc-primario
  logo: en("cierre", 2), //    cae la moneda del logo
  frase: en("cierre", 5),
  dominio: en("cierre", 6),
  credito: en("cierre", 7),
  texto: "Verificamos cada pago que recibes.",
  url: "yacayo.co",
};

// --- Pantallas dentro del celular ------------------------------------------------------------
export type Pantalla = "chat" | "inicio";
export type Entrada = "desliza-izq" | "desliza-der" | "recorte";

export const PANTALLAS: { pantalla: Pantalla; desde: number; entrada: Entrada }[] = [
  { pantalla: "chat", desde: 0, entrada: "recorte" },
  { pantalla: "inicio", desde: ESCENAS.preguntale.desde, entrada: "recorte" },
];
/** Cuánto dura el cambio de pantalla (deslizamiento o recorte). Sin prisa. */
export const CAMBIO_PANTALLA = 20;
