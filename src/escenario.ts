// El escenario: dónde va cada cosa en cada formato, cómo se mueve el celular, cómo se proyecta
// un punto de la pantalla del celular al cuadro (CSS 3D) y qué enfoca la cámara.
import { Easing, interpolate, spring } from "remotion";
import { CONFIRMADOS, ESCENAS, FPS, MENSAJES, PANEL, POR_REVISAR, TARJETAS } from "./constantes";
import zonas from "../public/screens/zonas.json";

/** La pantalla del celular, en px de CSS (las capturas son de 390 × 844). */
export const PANTALLA = { ancho: 390, alto: 844 } as const;
/** El bisel del celular, en las mismas unidades. */
export const BISEL = 13;

export type Punto = { x: number; y: number };
export type Formato = "vertical" | "horizontal";

export type Layout = {
  formato: Formato;
  ancho: number;
  alto: number;
  /** Centro del celular en reposo y su escala (px del cuadro por unidad de pantalla). */
  celular: { cx: number; cy: number; k: number };
  perspectiva: number;
  /** La caja de los titulares. */
  titular: { x: number; y: number; ancho: number; alto: number; alinear: "center" | "left" };
  /** La caja del titular cuando debajo van píldoras (escena 8): más arriba en horizontal. */
  titularArriba: { y: number; alto: number };
  tamanoTitular: number;
  /** La línea de apoyo debajo del titular. */
  tamanoApoyo: number;
  /** A dónde lleva la cámara lo que enfoca. */
  foco: Punto;
  /** Centro de cada tarjeta. */
  tarjetas: Record<keyof typeof TARJETAS, Punto>;
  tamanoTarjeta: number;
  /** Borde izquierdo de las píldoras de "Quién lo confirmó". */
  xPildoras: number;
  tamanoPildora: number;
  cierre: { anchoLogo: number; yLogo: number; tamanoFrase: number };
};

export const LAYOUTS: Record<Formato, Layout> = {
  vertical: {
    formato: "vertical",
    ancho: 1080,
    alto: 1920,
    celular: { cx: 540, cy: 1150, k: 540 / 390 },
    perspectiva: 2800,
    titular: { x: 80, y: 130, ancho: 920, alto: 360, alinear: "center" },
    titularArriba: { y: 130, alto: 360 },
    tamanoTitular: 92,
    tamanoApoyo: 46,
    foco: { x: 540, y: 1180 },
    tarjetas: { mandaLaFoto: { x: 330, y: 1030 }, confirmado: { x: 540, y: 1600 } },
    tamanoTarjeta: 44,
    xPildoras: 615,
    tamanoPildora: 30,
    cierre: { anchoLogo: 700, yLogo: 820, tamanoFrase: 56 },
  },
  horizontal: {
    formato: "horizontal",
    ancho: 1920,
    alto: 1080,
    celular: { cx: 600, cy: 548, k: 372 / 390 },
    perspectiva: 2400,
    titular: { x: 1040, y: 230, ancho: 800, alto: 380, alinear: "left" },
    titularArriba: { y: 60, alto: 240 },
    tamanoTitular: 92,
    tamanoApoyo: 44,
    foco: { x: 560, y: 540 },
    tarjetas: { mandaLaFoto: { x: 1300, y: 600 }, confirmado: { x: 1400, y: 760 } },
    tamanoTarjeta: 40,
    xPildoras: 960,
    tamanoPildora: 34,
    cierre: { anchoLogo: 760, yLogo: 420, tamanoFrase: 56 },
  },
};

export const layoutPara = (ancho: number, alto: number) => (ancho > alto ? LAYOUTS.horizontal : LAYOUTS.vertical);

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
  let x = cx;
  let y = cy + (1 - e) * (L.alto - cy + altoCelular * 0.65);
  let s = 1;
  let ry = 25 + (8 - 25) * e;
  let rx = 14 + (4 - 14) * e;
  let rz = 0;

  // Escena 4: gira para pasar a Ingresos (8° → −28° → −8°).
  const g1 = ESCENAS.panel.desde;
  ry += tramo(frame, [g1, g1 + 12, g1 + 30], [0, -36, -16]);
  // Escena 5: vuelve al chat.
  const g2 = ESCENAS.repetido.desde;
  ry += tramo(frame, [g2, g2 + 12, g2 + 30], [0, 36, 16]);

  // Escenas 6 a 8: un golpe de giro y de escala en cada cambio de escena.
  const [c0, c1, c2] = [ESCENAS.inicio.desde, ESCENAS.porRevisar.desde, ESCENAS.confirmados.desde];
  ry += tramo(frame, [c0, c0 + 10, c1, c1 + 10, c2, c2 + 12], [0, 8, 8, -8, -8, 2]);
  for (const c of [c0, c1, c2]) s *= 1 + 0.04 * tramo(frame, [c, c + 4, c + 16], [0, 1, 0]);

  // Cierre: se aleja y sale por abajo.
  const c = ESCENAS.cierre.desde;
  s *= tramo(frame, [c, c + 18], [1, 0.62]);
  y += tramo(frame, [c, c + 10], [0, -40]) + tramo(frame, [c + 10, c + 34], [0, L.alto], Easing.bezier(0.55, 0, 0.8, 0.4));
  ry += tramo(frame, [c, c + 30], [0, 16]);
  rx += tramo(frame, [c, c + 30], [0, 12]);

  // Deriva lenta: ±4° y un leve flotar.
  ry += 4 * Math.sin((2 * Math.PI * frame) / 150);
  rx += 1.8 * Math.sin((2 * Math.PI * frame) / 210 + 1.3);
  rz += 0.6 * Math.sin((2 * Math.PI * frame) / 260 + 0.4);
  y += 10 * k * Math.sin((2 * Math.PI * frame) / 120);

  // Temblor leve de 3 frames cuando llega "Ese pago ya se usó".
  const t = frame - MENSAJES.yaUsado;
  if (t >= 0 && t < 3) x += [12, -12, 7][t] * k;

  return { x, y, s, rx, ry, rz };
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

// --- La cámara ---------------------------------------------------------------------------------
/** `foco` puede moverse: la cámara recorre la pantalla sin alejarse. */
export type Zoom = { desde: number; hasta: number; escala: number; foco: Punto | ((frame: number) => Punto) };

const centro = (c: { x: number; y: number; w: number; h: number }): Punto => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });

/** Los acercamientos de cámara, con el punto de la pantalla del celular que enfocan. */
export const ZOOMS: Zoom[] = [
  // Escena 3: el chat, donde llega la respuesta.
  { desde: ESCENAS.respuesta.desde, hasta: ESCENAS.respuesta.hasta - 4, escala: 1.8, foco: { x: 195, y: 640 } },
  // Escena 4: la fila de Juan P., de donde sale "Confirmado · Caja 1".
  {
    desde: TARJETAS.confirmado.desde - 20,
    hasta: PANEL.llegaCamila - 4,
    escala: 1.5,
    foco: centro(zonas["ingresos-antes"].tarjetaJuan),
  },
  // Escena 4: el total que cuenta.
  { desde: PANEL.cuenta.desde - 15, hasta: ESCENAS.panel.hasta - 4, escala: 2, foco: { x: 195, y: 262 } },
  // Escena 5: "Ese pago ya se usó".
  { desde: MENSAJES.foto2 + 5, hasta: ESCENAS.repetido.hasta - 6, escala: 1.8, foco: { x: 195, y: 650 } },
  // Escena 7: de lo leído en la foto a los dos candidatos, al diálogo y al aviso.
  {
    desde: ESCENAS.porRevisar.desde + 3,
    hasta: ESCENAS.porRevisar.hasta - 2,
    escala: 1.55,
    foco: (frame) => ({
      x: 195,
      y: tramo(frame, [POR_REVISAR.baja, POR_REVISAR.baja + 24, POR_REVISAR.confirmado - 6, POR_REVISAR.confirmado + 10], [250, 590, 590, 650]),
    }),
  },
  // Escena 8: la lista de confirmados.
  { desde: ESCENAS.confirmados.desde + 3, hasta: ESCENAS.confirmados.hasta - 2, escala: 1.15, foco: { x: 195, y: 420 } },
];

/** Cuánto ha subido la lista de confirmados (px de pantalla). */
export const desplazamientoConfirmados = (frame: number) =>
  tramo(frame, [CONFIRMADOS.desplazamiento.desde, CONFIRMADOS.desplazamiento.hasta], [0, CONFIRMADOS.desplazamiento.px]);

export type Camara = { s: number; tx: number; ty: number };

export function camara(frame: number, pose: Pose, L: Layout): Camara {
  for (const z of ZOOMS) {
    // Entradas y salidas sin prisa: casi un segundo para acercarse.
    const e = interpolate(frame, [z.desde, z.desde + 24, z.hasta - 20, z.hasta], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    });
    if (e <= 0) continue;
    const f = proyectar(typeof z.foco === "function" ? z.foco(frame) : z.foco, pose, L);
    const s = 1 + (z.escala - 1) * e;
    return { s, tx: f.x + (L.foco.x - f.x) * e - s * f.x, ty: f.y + (L.foco.y - f.y) * e - s * f.y };
  }
  return { s: 1, tx: 0, ty: 0 };
}

/** Un punto del escenario, visto por la cámara (px del cuadro). */
export const aCuadro = (q: Punto, cam: Camara): Punto => ({ x: cam.tx + cam.s * q.x, y: cam.ty + cam.s * q.y });
