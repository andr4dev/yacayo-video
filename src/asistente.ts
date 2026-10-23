// El asistente del panel (Gemini en Vertex AI): sus textos y lo que responde.
// Las cifras salen de los datos de ejemplo del panel (yacayo-src/front/apps/panel/src/mocks/
// datos.ts), los mismos que muestran las capturas: nunca escritas a mano. El plan no está en
// datos.ts: sale de lo que dice Inicio en la captura (mocks/suscripcion.ts). Si la tarjeta de
// Inicio de la captura dice otra cifra que el chat, el video no arranca (`revisarConLaCaptura`).
import zonas from "../public/screens/zonas-asistente.json";
import { casosPorRevisar, cuentas, intentosRechazados, pagosDeLaCasona } from "../yacayo-src/front/apps/panel/src/mocks/datos";

/** Va en la escena 1 del asistente y en el cierre. Sin logos de Google ni de Gemini. */
export const CREDITO_IA = "Con Gemini en Vertex AI, de Google";
/** Mientras se ve el chat: es una animación, no una grabación del panel. */
export const NOTA_DEMO = "Demostración con datos de ejemplo";
/** La placa antes del cierre. */
export const PLACA =
  "Gemini en Vertex AI entiende la pregunta y consulta la API de YaCayó con la sesión del usuario: solo ve los datos de su propio negocio.";

export const CHAT_ASISTENTE = {
  titulo: "Asistente",
  subtitulo: "Pregúntame por tus pagos",
  saludo: "Hola. ¿Qué quieres saber de tus pagos?",
  /** Los puntos se animan aparte. */
  pensando: "Buscando en tus datos",
  placeholder: "Escribe tu pregunta…",
  aviso: "Solo consulto: no cambio nada.",
};

/** $85.000: punto de miles, sin decimales (skill diseno §7). */
export const pesos = (n: number) => `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const suma = (pagos: { monto: number }[]) => pagos.reduce((total, pago) => total + pago.monto, 0);

/** Una respuesta del chat. Las líneas que empiezan con "• " son puntos de una lista. */
export type Respuesta = { pregunta: string; lineas: string[]; consulte: string | null };

// --- Hoy, con el pago de Camila (el que llega mientras se mira el panel, como en la captura) ----
const hoy = pagosDeLaCasona({ conPagoNuevo: true }).filter((pago) => pago.diasAtras === 0);
const sinConfirmar = hoy.filter((pago) => !pago.confirmado);

const NOMBRE_BANCO: Record<(typeof cuentas)[number]["banco"], string> = { nequi: "Nequi", bancolombia: "Bancolombia" };

/** Los motivos de un intento rechazado, como los dice la interfaz (skill diseno §4). */
const MOTIVO: Record<(typeof intentosRechazados)[number]["motivo"], string> = {
  pago_ya_usado: "Ese pago ya se usó",
  cuenta_distinta: "El pago fue a otra cuenta",
  monto_menor: "El pago es menor al esperado",
  sin_prueba_del_banco: "No aparece en las cuentas del negocio",
};

function intentosDeHoy(): string[] {
  const deHoy = intentosRechazados.filter((intento) => intento.diasAtras === 0);
  if (deHoy.length === 0) return ["Hoy no se rechazó ningún comprobante."];
  if (deHoy.length === 1) {
    const [intento] = deHoy;
    const original =
      intento.pagoOriginal && intento.leido?.monto !== undefined
        ? ` Era la foto del pago de ${intento.pagoOriginal} por ${pesos(intento.leido.monto)}.`
        : "";
    return [`Hoy se rechazó 1 comprobante: ${MOTIVO[intento.motivo]}.${original}`];
  }
  const porMotivo = new Map<string, number>();
  for (const intento of deHoy) porMotivo.set(MOTIVO[intento.motivo], (porMotivo.get(MOTIVO[intento.motivo]) ?? 0) + 1);
  return [`Hoy se rechazaron ${deHoy.length} comprobantes:`, ...[...porMotivo].map(([motivo, n]) => `• ${motivo}: ${n}`)];
}

/** Los casos de Por revisar, del más antiguo al más nuevo, como los ordena el panel. */
function casosPendientes(): string[] {
  const casos = [...casosPorRevisar].sort((a, b) => b.minutosAtras - a.minutosAtras);
  return [
    `Sí, tienes ${plural(casos.length, "caso", "casos")}:`,
    ...casos.map((caso) =>
      caso.tipo === "ilegible"
        ? `• No se pudo leer la foto que mandó ${caso.quien} (${pesos(caso.montoEsperado)}).`
        : `• Hay dos pagos posibles para la foto de ${pesos(caso.leido.monto)} que mandó ${caso.quien}.`,
    ),
    "Los resuelves en Por revisar.",
  ];
}

const ana = hoy.find((pago) => pago.pagador.startsWith("Ana"));
if (!ana || ana.confirmado) {
  throw new Error("La escena 4 del asistente pide confirmar el pago de Ana, pero en datos.ts no está sin confirmar.");
}

const plan = zonas["panel-inicio"].plan;

export const RESPUESTAS = {
  hoy: {
    pregunta: "¿Cuánto entró hoy?",
    lineas: [
      `Hoy entraron ${pesos(suma(hoy))} en ${plural(hoy.length, "pago", "pagos")}. ${sinConfirmar.length} ${
        sinConfirmar.length === 1 ? "está" : "están"
      } sin confirmar: ${pesos(suma(sinConfirmar))}.`,
    ],
    consulte: "Resumen de ingresos",
  },
  porCuenta: {
    pregunta: "¿Cuánto llevo por cuenta?",
    lineas: [
      "Hoy:",
      ...cuentas.flatMap((cuenta) => {
        const deLaCuenta = hoy.filter((pago) => pago.banco === cuenta.banco);
        if (deLaCuenta.length === 0) return [];
        const confirmado = suma(deLaCuenta.filter((pago) => pago.confirmado));
        return [
          `• ${NOMBRE_BANCO[cuenta.banco]} ···${cuenta.ultimos4}: ${pesos(suma(deLaCuenta))} en ${plural(
            deLaCuenta.length,
            "pago",
            "pagos",
          )}, ${confirmado > 0 ? `${pesos(confirmado)} confirmados` : "ninguno confirmado"}.`,
        ];
      }),
    ],
    consulte: "Recaudado por cuenta",
  },
  porRevisar: { pregunta: "¿Tengo algo por revisar?", lineas: casosPendientes(), consulte: "Por revisar" },
  fraude: { pregunta: "¿Hubo intentos de fraude?", lineas: intentosDeHoy(), consulte: "Intentos de fraude" },
  plan: {
    pregunta: "¿Cuánto me queda del plan?",
    lineas: [
      `Llevas ${plan.usados} de ${plan.limite} comprobantes este mes (${Math.floor((plan.usados / plan.limite) * 100)} %). Te quedan ${
        plan.limite - plan.usados
      }.`,
    ],
    consulte: "Uso del plan",
  },
  confirmar: {
    pregunta: "Confírmame el pago de Ana",
    lineas: ["No puedo confirmar pagos: solo consulto. Ese lo confirmas tú en Ingresos, con el botón Confirmar."],
    consulte: null,
  },
} satisfies Record<string, Respuesta>;

/** Las sugerencias del chat vacío, en el orden del diseño. */
export const SUGERENCIAS = [
  RESPUESTAS.hoy.pregunta,
  RESPUESTAS.porCuenta.pregunta,
  RESPUESTAS.porRevisar.pregunta,
  RESPUESTAS.fraude.pregunta,
  RESPUESTAS.plan.pregunta,
];

/** El total de hoy del chat tiene que ser el mismo de la tarjeta de Inicio de la captura. */
function revisarConLaCaptura() {
  const tarjeta = zonas["panel-inicio"].cifras;
  const chat = { total: pesos(suma(hoy)), pagos: hoy.length, sinConfirmar: sinConfirmar.length };
  if (tarjeta.total !== chat.total || tarjeta.pagos !== chat.pagos || tarjeta.sinConfirmar !== chat.sinConfirmar) {
    throw new Error(
      `El chat dice ${chat.total} · ${chat.pagos} pagos · ${chat.sinConfirmar} sin confirmar, pero la tarjeta de Inicio ` +
        `de la captura dice ${tarjeta.total} · ${tarjeta.pagos} pagos · ${tarjeta.sinConfirmar} sin confirmar. ` +
        "Vuelve a tomar las capturas (npm run capturas:asistente) o revisa datos.ts.",
    );
  }
}
revisarConLaCaptura();
