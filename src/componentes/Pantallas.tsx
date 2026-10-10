// Lo que muestra la pantalla del celular en cada momento. Las pantallas cambian dentro del
// celular con un deslizamiento o un recorte, nunca con un corte seco.
import type React from "react";
import { Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAMBIO_PANTALLA, CONFIRMADOS, PANEL, PANTALLAS, POR_REVISAR, type Pantalla } from "../constantes";
import { desplazamientoConfirmados } from "../escenario";
import { YC, alfa } from "../marca";
import zonas from "../../public/screens/zonas.json";
import { CountUp } from "./CountUp";
import { WhatsAppChat } from "./WhatsAppChat";

type NombreCaptura =
  | "ingresos-antes"
  | "ingresos-despues"
  | "ingresos-confirmados"
  | "inicio"
  | "por-revisar-detalle"
  | "por-revisar-dialogo"
  | "por-revisar-confirmado";

/** Una captura real del panel (public/screens/, 390 de ancho a 3x). */
const Captura: React.FC<{ nombre: NombreCaptura; top?: number; alto?: number }> = ({ nombre, top = 0, alto = 844 }) => (
  <Img
    src={staticFile(`screens/${nombre}.png`)}
    style={{ position: "absolute", left: 0, top, width: 390, height: alto }}
  />
);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const dibujo = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) };

const Capa: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>{children}</div>
);

function contenido(pantalla: Pantalla) {
  switch (pantalla) {
    case "chat":
      return <WhatsAppChat />;
    case "ingresos":
      return <PantallaIngresos />;
    case "inicio":
      return <Captura nombre="inicio" />;
    case "porRevisar":
      return <PantallaPorRevisar />;
    case "porRevisarDialogo":
      return <Captura nombre="por-revisar-dialogo" />;
    case "porRevisarConfirmado":
      return <Captura nombre="por-revisar-confirmado" />;
    case "confirmados":
      return <PantallaConfirmados />;
  }
}

export const PantallaCelular: React.FC = () => {
  const frame = useCurrentFrame();
  let i = 0;
  PANTALLAS.forEach((s, j) => {
    if (frame >= s.desde) i = j;
  });
  const actual = PANTALLAS[i];
  const previa = PANTALLAS[i - 1];
  const t = frame - actual.desde;
  if (!previa || t >= CAMBIO_PANTALLA) return <Capa>{contenido(actual.pantalla)}</Capa>;

  const p = interpolate(t, [0, CAMBIO_PANTALLA], [0, 1], { easing: Easing.bezier(0.65, 0, 0.35, 1) });

  if (actual.entrada === "recorte") {
    return (
      <>
        <Capa>{contenido(previa.pantalla)}</Capa>
        <Capa style={{ clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}>
          <Capa style={{ transform: `scale(${1.08 - 0.08 * p})`, transformOrigin: "50% 100%" }}>
            {contenido(actual.pantalla)}
          </Capa>
        </Capa>
      </>
    );
  }

  const dir = actual.entrada === "desliza-izq" ? 1 : -1;
  return (
    <>
      <Capa style={{ transform: `translateX(${-dir * 30 * p}%)` }}>
        {contenido(previa.pantalla)}
        <Capa style={{ background: YC.fondoOscuro, opacity: 0.25 * p }}>{null}</Capa>
      </Capa>
      <Capa
        style={{
          transform: `translateX(${dir * 100 * (1 - p)}%)`,
          boxShadow: `${-dir * 8}px 0 24px ${alfa(YC.fondoOscuro, 0.18)}`,
        }}
      >
        {contenido(actual.pantalla)}
      </Capa>
    </>
  );
};

// --- Ingresos: llega el pago de Camila R. y el total cuenta ---------------------------------------
const LISTA = zonas["ingresos-despues"].tarjetaCamila.y; // donde empieza la lista
const ALTO_CAMILA = zonas["ingresos-despues"].tarjetaJuan.y - LISTA; // lo que empuja la tarjeta nueva
const BARRA_INFERIOR = 764; // la navegación de abajo, que no se mueve
const RESUMEN = { top: 288, alto: 36 }; // "6 pagos · 2 sin confirmar"
const TOTAL = zonas["ingresos-antes"].total;

const PantallaIngresos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fin = PANEL.cuenta.desde + PANEL.cuenta.duracion;
  if (frame >= fin + 2) return <Captura nombre="ingresos-despues" />;

  const p =
    frame < PANEL.llegaCamila
      ? 0
      : spring({ frame: frame - PANEL.llegaCamila, fps, config: { damping: 18, stiffness: 110 } });

  return (
    <>
      <Captura nombre="ingresos-antes" />

      {p > 0 ? (
        <Capa style={{ top: LISTA, bottom: 844 - BARRA_INFERIOR, background: YC.fondoClaro }}>
          {/* La lista de antes baja… */}
          <Captura nombre="ingresos-antes" top={-LISTA + ALTO_CAMILA * p} />
          {/* …y la tarjeta de Camila R. entra desde arriba. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: -ALTO_CAMILA * (1 - p),
              height: ALTO_CAMILA,
              overflow: "hidden",
            }}
          >
            <Captura nombre="ingresos-despues" top={-LISTA} />
          </div>
        </Capa>
      ) : null}

      {/* "7 pagos · 3 sin confirmar" */}
      <Capa
        style={{
          top: RESUMEN.top,
          bottom: 844 - RESUMEN.top - RESUMEN.alto,
          opacity: interpolate(frame, [PANEL.llegaCamila + 6, PANEL.llegaCamila + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Captura nombre="ingresos-despues" top={-RESUMEN.top} />
      </Capa>

      {/* El total cuenta de $542.000 a $614.000 (Hanken Grotesk 700, 30 px, como el panel). */}
      {frame >= PANEL.cuenta.desde ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: TOTAL.y - 4,
            height: TOTAL.h + 8,
            background: YC.fondoClaro,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sequence from={PANEL.cuenta.desde} layout="none">
            <CountUp
              desde={PANEL.totalSinCamila}
              hasta={PANEL.totalConCamila}
              duracion={PANEL.cuenta.duracion}
              style={{ fontSize: 30, lineHeight: `${TOTAL.h}px`, color: YC.texto }}
            />
          </Sequence>
        </div>
      ) : null}
    </>
  );
};

// --- Por revisar: el borde que marca a Laura M. antes de tocar "Es este" ---------------------
const PantallaPorRevisar: React.FC = () => {
  const frame = useCurrentFrame();
  const c = zonas["por-revisar-detalle"].laura;
  const p = interpolate(frame, [POR_REVISAR.borde, POR_REVISAR.borde + 12], [0, 1], dibujo);
  return (
    <>
      <Captura nombre="por-revisar-detalle" />
      {p > 0 ? (
        <svg width={390} height={844} style={{ position: "absolute", inset: 0 }}>
          <rect
            x={c.x - 1.5}
            y={c.y - 1.5}
            width={c.w + 3}
            height={c.h + 3}
            rx={12}
            fill="none"
            stroke={YC.primario}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
          />
        </svg>
      ) : null}
    </>
  );
};

// --- Quién lo confirmó: la lista sube sola y se subraya cada "Confirmó …" ----------------------
const PantallaConfirmados: React.FC = () => {
  const frame = useCurrentFrame();
  const z = zonas["ingresos-confirmados"];
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: -desplazamientoConfirmados(frame), width: 390, height: z.alto }}>
        <Captura nombre="ingresos-confirmados" alto={z.alto} />
        {CONFIRMADOS.filas.map((fila) => {
          const c = z[fila.id];
          const p = interpolate(frame, [fila.desde - 2, fila.desde + 8], [0, 1], dibujo);
          return (
            <div
              key={fila.id}
              style={{
                position: "absolute",
                left: c.x - 4,
                top: c.y - 2,
                width: c.w + 8,
                height: c.h + 4,
                borderRadius: 4,
                background: alfa(YC.acento, 0.38),
                mixBlendMode: "multiply",
                transformOrigin: "left center",
                transform: `scaleX(${p})`,
              }}
            />
          );
        })}
      </div>
      {/* La barra de abajo es fija: no sube con la lista. */}
      <Capa style={{ top: BARRA_INFERIOR }}>
        <Captura nombre="ingresos-despues" top={-BARRA_INFERIOR} />
      </Capa>
    </>
  );
};
