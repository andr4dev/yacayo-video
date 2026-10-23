// El escenario (1920 × 1080: el celular o el panel de escritorio a un lado y el texto al otro):
// dónde va cada cosa, cómo se mueven el celular y el panel, cómo se proyecta un punto de sus
// pantallas al cuadro (CSS 3D) y qué enfoca la cámara.
import { Easing, interpolate, spring } from "remotion";
import { ASISTENTE, CONVERSACION, ESCENAS, FPS, MENSAJES } from "./constantes";
import { MARCO, cajaDelMensaje, centroDeSugerencia } from "./componentes/asistenteGeometria";
import zonas from "../public/screens/zonas-asistente.json";

/** La pantalla del celular, en px de CSS (las capturas son de 390 × 844). */
export const PANTALLA = { ancho: 390, alto: 844 } as const;
/** El bisel del celular, en las mismas unidades. */
export const BISEL = 13;
/** La pantalla del panel de escritorio, en px de CSS (las capturas son de 1440 × 900). */
export const ESCRITORIO = { ancho: 1440, alto: 900 } as const;

export type Punto = { x: number; y: number };

export type Layout = {
  ancho: number;
  alto: number;
  /** Centro del celular en reposo y su escala (px del cuadro por unidad de pantalla). */
  celular: { cx: number; cy: number; k: number };
  perspectiva: number;
  /** La caja de los titulares. */
  titular: { x: number; y: number; ancho: number; alto: number };
  tamanoTitular: number;
  /** La línea de apoyo debajo del titular. */
  tamanoApoyo: number;
  /** A dónde lleva la cámara lo que enfoca. */
  foco: Punto;
  /** Centro de cada tarjeta. */
  tarjetas: { mandaLaFoto: Punto; dato: Punto };
  tamanoTarjeta: number;
  tamanoToque: number;
  tamanoPulso: number;
  /** El panel de escritorio: centro en reposo, ancho de la ventana y alto de su barra (px del cuadro). */
  escritorio: { cx: number; cy: number; ancho: number; barra: number };
  cierre: { anchoLogo: number; yLogo: number; tamanoFrase: number };
};

export const LAYOUT: Layout = {
  ancho: 1920,
  alto: 1080,
  celular: { cx: 600, cy: 548, k: 372 / 390 },
  perspectiva: 2400,
  titular: { x: 1040, y: 230, ancho: 800, alto: 380 },
  tamanoTitular: 92,
  tamanoApoyo: 44,
  foco: { x: 560, y: 540 },
  tarjetas: { mandaLaFoto: { x: 1300, y: 600 }, dato: { x: 1420, y: 760 } },
  tamanoTarjeta: 40,
  tamanoToque: 84,
  tamanoPulso: 80,
  escritorio: { cx: 560, cy: 540, ancho: 960, barra: 36 },
  cierre: { anchoLogo: 760, yLogo: 420, tamanoFrase: 56 },
};

// --- El celular -------------------------------------------------------------------------------
export type Pose = { x: number; y: number; s: number; rx: number; ry: number; rz: number };

const suave = Easing.bezier(0.45, 0, 0.2, 1);
const tramo = (frame: number, puntos: number[], valores: number[], easing = suave) =>
  interpolate(frame, puntos, valores, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Dónde está el celular y cómo está girado en cada frame. Nunca está quieto: deriva. */
export function poseCelular(frame: number, L: Layout): Pose {
  const { cx, cy, k } = L.celular;
  const altoCelular = (PANTALLA.alto + 2 * BISEL) * k;

  // Entrada (escena 2): sube desde abajo con un spring y gira de 25° a 8°.
  const e = spring({
    frame: frame - ESCENAS.foto.desde,
    fps: FPS,
    config: { damping: 15, stiffness: 70, mass: 1.1 },
  });
  const x = cx;
  let y = cy + (1 - e) * (L.alto - cy + altoCelular * 0.65);
  let s = 1;
  let ry = 25 + (8 - 25) * e;
  let rx = 14 + (4 - 14) * e;
  let rz = 0;

  // El asistente: un golpe de giro y de escala al pasar del chat de WhatsApp al panel.
  const a = ESCENAS.preguntale.desde;
  ry += tramo(frame, [a, a + 10], [0, 8]);
  s *= 1 + 0.04 * tramo(frame, [a, a + 4, a + 16], [0, 1, 0]);

  // Deriva lenta: ±4° y un leve flotar.
  ry += 4 * Math.sin((2 * Math.PI * frame) / 150);
  rx += 1.8 * Math.sin((2 * Math.PI * frame) / 210 + 1.3);
  rz += 0.6 * Math.sin((2 * Math.PI * frame) / 260 + 0.4);
  y += 10 * k * Math.sin((2 * Math.PI * frame) / 120);

  // Temblor leve de 3 frames cuando llega "Ese pago ya se usó".
  const t = frame - MENSAJES.yaUsado;
  const temblor = t >= 0 && t < 3 ? [12, -12, 7][t] * k : 0;

  return { x: x + temblor, y, s, rx, ry, rz };
}

const rad = (g: number) => (g * Math.PI) / 180;

/**
 * Un punto de la pantalla del celular (unidades de 390 × 844) proyectado al escenario, con la
 * misma matemática que el CSS de <Phone>: scale → rotateX → rotateY → rotateZ → perspectiva.
 */
export function proyectar(p: Punto, pose: Pose, L: Layout): Punto {
  const { k, cx, cy } = L.celular;
  let X = (p.x - PANTALLA.ancho / 2) * k * pose.s;
  let Y = (p.y - PANTALLA.alto / 2) * k * pose.s;
  let Z = 0;
  const a = rad(pose.rx);
  [Y, Z] = [Y * Math.cos(a) - Z * Math.sin(a), Y * Math.sin(a) + Z * Math.cos(a)];
  const b = rad(pose.ry);
  [X, Z] = [X * Math.cos(b) + Z * Math.sin(b), -X * Math.sin(b) + Z * Math.cos(b)];
  const c = rad(pose.rz);
  [X, Y] = [X * Math.cos(c) - Y * Math.sin(c), X * Math.sin(c) + Y * Math.cos(c)];
  const f = L.perspectiva / (L.perspectiva - Z);
  return { x: cx + (pose.x - cx + X) * f, y: cy + (pose.y - cy + Y) * f };
}

// --- El panel de escritorio ---------------------------------------------------------------------
export type PoseEscritorio = { x: number; y: number; s: number };

/** Entra desde abajo al empezar "Te sigue entre pantallas" y se va hacia abajo con la placa. */
export function poseEscritorio(frame: number, L: Layout): PoseEscritorio {
  const { cx, cy } = L.escritorio;
  const e = spring({ frame: frame - ESCENAS.entrePantallas.desde, fps: FPS, config: { damping: 16, stiffness: 90 } });
  const p = ESCENAS.placa.desde;
  const sale = Easing.bezier(0.55, 0, 0.8, 0.4);
  const y = cy + (1 - e) * L.alto * 0.8 + tramo(frame, [p, p + 20], [0, L.alto], sale) + 6 * Math.sin((2 * Math.PI * frame) / 140);
  const s = (0.9 + 0.1 * e) * tramo(frame, [p, p + 20], [1, 0.9]);
  return { x: cx, y, s };
}

/** Un punto del panel de escritorio (px de la captura de 1440 × 900) en el escenario. */
export function proyectarEscritorio(p: Punto, pose: PoseEscritorio, L: Layout): Punto {
  const ke = L.escritorio.ancho / ESCRITORIO.ancho;
  const ancho = L.escritorio.ancho;
  const alto = ESCRITORIO.alto * ke + L.escritorio.barra;
  return {
    x: pose.x + (-ancho / 2 + p.x * ke) * pose.s,
    y: pose.y + (-alto / 2 + L.escritorio.barra + p.y * ke) * pose.s,
  };
}

// --- La cámara ---------------------------------------------------------------------------------
/** `foco` y `escala` pueden moverse: la cámara recorre la pantalla sin alejarse. */
export type Zoom = {
  desde: number;
  hasta: number;
  escala: number | ((frame: number) => number);
  foco: Punto | ((frame: number) => Punto);
  /** La pantalla del foco: la del celular (por defecto) o la del panel de escritorio. */
  en?: "celular" | "escritorio";
  /** Termina con un corte (la escena siguiente ya no muestra lo mismo) en vez de alejarse. */
  corte?: boolean;
};

const centro = (c: { x: number; y: number; w: number; h: number }): Punto => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });
const mezclar = (a: Punto, b: Punto, t: number): Punto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const primeraPregunta = CONVERSACION.pasos[0].aparece;

/** Los acercamientos de cámara, con el punto de la pantalla que enfocan. */
export const ZOOMS: Zoom[] = [
  // 3: el chat, donde llega la respuesta.
  { desde: ESCENAS.respuesta.desde, hasta: ESCENAS.respuesta.hasta - 4, escala: 1.8, foco: { x: 195, y: 640 } },
  // 5: "Ese pago ya se usó".
  { desde: MENSAJES.foto2 + 5, hasta: ESCENAS.repetido.hasta - 6, escala: 1.8, foco: { x: 195, y: 650 } },
  // Asistente 1 y 2: las sugerencias, la respuesta, "Consulté: …" y, tras el corte, la cifra en
  // la tarjeta de Inicio.
  {
    desde: ASISTENTE.abre - 6,
    hasta: ESCENAS.responde.hasta,
    corte: true,
    escala: (frame) =>
      frame >= ASISTENTE.corte ? 2.4 : tramo(frame, [ASISTENTE.acercaConsulte, ASISTENTE.acercaConsulte + 22], [1.5, 2.1]),
    foco: (frame) => {
      if (frame >= ASISTENTE.corte) return centro(zonas["panel-inicio"].total);
      const sugerencias = { x: 195, y: centroDeSugerencia("hoja", 2).y };
      const mensajes = mezclar(sugerencias, { x: 195, y: 250 }, tramo(frame, [primeraPregunta, primeraPregunta + 20], [0, 1]));
      const respuesta = cajaDelMensaje(CONVERSACION, "hoja", "r1", frame);
      if (!respuesta) return mensajes;
      return mezclar(mensajes, centro(respuesta), tramo(frame, [ASISTENTE.acercaConsulte, ASISTENTE.acercaConsulte + 22], [0, 1]));
    },
  },
  // Asistente 3 y 4: la tarjeta del chat en el panel de escritorio.
  {
    en: "escritorio",
    desde: ASISTENTE.cambiaPagina + 4,
    hasta: ESCENAS.soloConsulta.hasta,
    escala: 1.9,
    foco: centro(MARCO.tarjeta),
  },
];

export type Camara = { s: number; tx: number; ty: number };

export function camara(frame: number, celular: Pose, escritorio: PoseEscritorio, L: Layout): Camara {
  for (const z of ZOOMS) {
    if (frame < z.desde || frame >= z.hasta) continue;
    // Entradas y salidas sin prisa: casi un segundo para acercarse.
    const e = interpolate(frame, z.corte ? [z.desde, z.desde + 24] : [z.desde, z.desde + 24, z.hasta - 20, z.hasta], z.corte ? [0, 1] : [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    });
    const punto = typeof z.foco === "function" ? z.foco(frame) : z.foco;
    const f = z.en === "escritorio" ? proyectarEscritorio(punto, escritorio, L) : proyectar(punto, celular, L);
    const escala = typeof z.escala === "function" ? z.escala(frame) : z.escala;
    const s = 1 + (escala - 1) * e;
    return { s, tx: f.x + (L.foco.x - f.x) * e - s * f.x, ty: f.y + (L.foco.y - f.y) * e - s * f.y };
  }
  return { s: 1, tx: 0, ty: 0 };
}

/** Un punto del escenario, visto por la cámara (px del cuadro). */
export const aCuadro = (q: Punto, cam: Camara): Punto => ({ x: cam.tx + cam.s * q.x, y: cam.ty + cam.s * q.y });
