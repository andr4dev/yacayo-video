// El video promocional de YaCayó. La misma composición sirve para 1080 × 1920 (vertical) y
// 1920 × 1080 (horizontal: celular a un lado y texto al otro); el formato sale del tamaño.
import { Audio } from "@remotion/media";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  getStaticFiles,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraZoom } from "./componentes/CameraZoom";
import { cajaMensaje } from "./componentes/chatGeometria";
import { Confirmacion } from "./componentes/Confirmacion";
import { FeatureCard } from "./componentes/FeatureCard";
import { Fondo } from "./componentes/Fondo";
import { KineticText } from "./componentes/KineticText";
import { LogoAnimado } from "./componentes/LogoAnimado";
import { PantallaCelular } from "./componentes/Pantallas";
import { Phone, SombraPiso } from "./componentes/Phone";
import { CIERRE, ESCENAS, MENSAJES, MONTAJE, MUSICA, TARJETAS, TITULARES } from "./constantes";
import { type Layout, type Punto, ZOOMS, aCuadro, camara, layoutPara, poseCelular, proyectar } from "./escenario";
import { FUENTE, YC } from "./marca";
import zonas from "../public/screens/zonas.json";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const hayMusica = () => getStaticFiles().some((f) => f.name === MUSICA);

export const YacayoDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const L = layoutPara(width, height);
  const pose = poseCelular(frame, L);
  const cam = camara(frame, pose, L);
  /** Un punto de la pantalla del celular, en px del cuadro. */
  const enCuadro = (p: Punto) => aCuadro(proyectar(p, pose, L), cam);

  const celularVisible = frame >= ESCENAS.foto.desde - 1 && frame < ESCENAS.cierre.desde + 40;
  const zoomMax = Math.max(...ZOOMS.map((z) => z.escala));

  return (
    <AbsoluteFill style={{ fontFamily: FUENTE, background: YC.fondoClaro, overflow: "hidden" }}>
      <Fondo />

      {/* 7 · Cierre: el fondo --yc-primario crece por detrás del celular, que se va. */}
      <Sequence name="Cierre · fondo" from={CIERRE.fondo} premountFor={fps}>
        <CierreFondo L={L} />
      </Sequence>

      {celularVisible ? (
        <CameraZoom cam={cam}>
          <AbsoluteFill
            style={{ perspective: L.perspectiva, perspectiveOrigin: `${L.celular.cx}px ${L.celular.cy}px` }}
          >
            <SombraPiso pose={pose} k={L.celular.k} cy={L.celular.cy} />
            <Phone pose={pose} k={L.celular.k} nitidez={cam.s}>
              <PantallaCelular />
            </Phone>
          </AbsoluteFill>
        </CameraZoom>
      ) : null}

      {/* Velo para leer el titular cuando la cámara se acerca (solo vertical). */}
      {L.formato === "vertical" ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(${YC.fondoClaro} 0%, ${YC.fondoClaro} 18%, transparent 34%)`,
            opacity: interpolate(cam.s, [1, 1 + (zoomMax - 1) * 0.35], [0, 0.94], clamp),
          }}
        />
      ) : null}

      {/* 1 · Gancho */}
      <Sequence name="Gancho" from={TITULARES.ganchoA.desde} durationInFrames={TITULARES.ganchoA.hasta} premountFor={fps}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
          <div style={{ width: "100%", textAlign: "center" }}>
            <KineticText texto={TITULARES.ganchoA.texto} tamano={96} duracion={TITULARES.ganchoA.hasta} />
            <Sequence from={TITULARES.ganchoB.desde} layout="none">
              <KineticText
                texto={TITULARES.ganchoB.texto}
                clave={TITULARES.ganchoB.clave}
                monedaToca={TITULARES.ganchoB.monedaToca - TITULARES.ganchoB.desde}
                tamano={96}
                duracion={TITULARES.ganchoB.hasta - TITULARES.ganchoB.desde}
              />
            </Sequence>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* 2 · Manda la foto */}
      <Sequence
        name="Tarjeta · Manda la foto"
        from={TARJETAS.mandaLaFoto.desde}
        durationInFrames={TARJETAS.mandaLaFoto.hasta - TARJETAS.mandaLaFoto.desde}
        premountFor={fps}
      >
        <TarjetaFoto L={L} frame={frame} enCuadro={enCuadro} />
      </Sequence>

      {/* 3 · Cayó */}
      <Sequence name="Pulso · Cayó" from={MENSAJES.cayo + 3} durationInFrames={50} premountFor={fps}>
        <Confirmacion
          tipo="cayo"
          duracion={50}
          tamano={L.formato === "vertical" ? 96 : 80}
          centro={esquinaMensaje("cayo", frame, enCuadro)}
        />
      </Sequence>
      <Titular L={L} {...TITULARES.segundos} />

      {/* 4 · Panel */}
      <Sequence
        name="Tarjeta · Confirmado"
        from={TARJETAS.confirmado.desde}
        durationInFrames={TARJETAS.confirmado.hasta - TARJETAS.confirmado.desde}
        premountFor={fps}
      >
        <FeatureCard
          ancla={enCuadro({ x: zonas["ingresos-antes"].confirmoJuan.x + 150, y: centroY(zonas["ingresos-antes"].confirmoJuan) })}
          centro={L.tarjetas.confirmado}
          icono="check"
          colorIcono={YC.verificado}
          tamano={L.tamanoTarjeta}
          duracion={TARJETAS.confirmado.hasta - TARJETAS.confirmado.desde}
        >
          <span style={{ color: YC.verificado }}>Confirmado</span>
          <span style={{ color: YC.textoSecundario }}> · Caja 1 · WhatsApp</span>
        </FeatureCard>
      </Sequence>
      <Titular L={L} {...TITULARES.panel} />

      {/* 5 · Ese pago ya se usó */}
      <Sequence name="Pulso · Ya se usó" from={MENSAJES.yaUsado + 2} durationInFrames={50} premountFor={fps}>
        <Confirmacion
          tipo="fraude"
          duracion={50}
          tamano={L.formato === "vertical" ? 96 : 80}
          centro={esquinaMensaje("yaUsado", frame, enCuadro)}
        />
      </Sequence>
      <Titular L={L} {...TITULARES.unaVez} />

      {/* 6 · Montaje */}
      {MONTAJE.map((m) => (
        <Titular key={m.pantalla} L={L} texto={m.etiqueta} clave={m.clave} desde={m.desde} hasta={m.desde + 30} rapido />
      ))}

      {/* 7 · Cierre: logo, frase y dominio */}
      <Sequence name="Cierre" from={CIERRE.fondo} premountFor={fps}>
        <Cierre L={L} />
      </Sequence>

      {hayMusica() ? <Audio src={staticFile(MUSICA)} /> : null}
    </AbsoluteFill>
  );
};

const centroY = (c: { y: number; h: number }) => c.y + c.h / 2;

/** La esquina de arriba a la derecha de un mensaje del chat, en px del cuadro. */
function esquinaMensaje(id: "cayo" | "yaUsado", frame: number, enCuadro: (p: Punto) => Punto): Punto {
  const c = cajaMensaje(id, frame);
  return c ? enCuadro({ x: c.x + c.w + 2, y: c.y - 2 }) : { x: -999, y: -999 };
}

/** "Manda la foto": sale del globo de la foto, hacia el lado libre. */
const TarjetaFoto: React.FC<{ L: Layout; frame: number; enCuadro: (p: Punto) => Punto }> = ({ L, frame, enCuadro }) => {
  const c = cajaMensaje("foto1", frame);
  const ancla = c
    ? enCuadro({ x: L.formato === "vertical" ? c.x + 18 : c.x + c.w - 18, y: c.y + c.h * 0.45 })
    : L.tarjetas.mandaLaFoto;
  return (
    <FeatureCard
      ancla={ancla}
      centro={L.tarjetas.mandaLaFoto}
      icono="camara"
      colorIcono={YC.primario}
      tamano={L.tamanoTarjeta}
      duracion={TARJETAS.mandaLaFoto.hasta - TARJETAS.mandaLaFoto.desde}
    >
      {TARJETAS.mandaLaFoto.texto}
    </FeatureCard>
  );
};

/** Un titular en la caja de titulares del formato. */
const Titular: React.FC<{
  L: Layout;
  texto: string;
  clave?: string;
  desde: number;
  hasta: number;
  rapido?: boolean;
}> = ({ L, texto, clave, desde, hasta, rapido }) => {
  const { fps } = useVideoConfig();
  const t = L.titular;
  return (
    <Sequence name={`Titular · ${texto}`} from={desde} durationInFrames={hasta - desde} premountFor={fps}>
      <div
        style={{
          position: "absolute",
          left: t.x,
          top: t.y,
          width: t.ancho,
          height: t.alto,
          display: "flex",
          alignItems: "center",
          justifyContent: t.alinear === "center" ? "center" : "flex-start",
        }}
      >
        <KineticText
          texto={texto}
          clave={clave}
          tamano={L.tamanoTitular}
          alinear={t.alinear}
          escalonado={rapido ? 3 : 4}
          duracion={hasta - desde}
          style={{ width: "100%" }}
        />
      </div>
    </Sequence>
  );
};

/** El fondo --yc-primario, que crece en círculo desde donde está el celular. */
const CierreFondo: React.FC<{ L: Layout }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const radio = interpolate(frame, [0, 20], [0, Math.hypot(width, height)], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  return (
    <AbsoluteFill
      style={{ background: YC.primario, clipPath: `circle(${radio}px at ${L.celular.cx}px ${L.celular.cy}px)` }}
    />
  );
};

/** Logo negativo animado, la frase y el dominio. */
const Cierre: React.FC<{ L: Layout }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const dominio = spring({ frame: frame - (CIERRE.dominio - CIERRE.fondo), fps, config: { damping: 200 } });
  const c = L.cierre;

  return (
    <AbsoluteFill>
      <Sequence from={CIERRE.logo - CIERRE.fondo} premountFor={fps}>
        <div
          style={{
            position: "absolute",
            left: (width - c.anchoLogo) / 2,
            top: c.yLogo,
            width: c.anchoLogo,
          }}
        >
          <LogoAnimado ancho={c.anchoLogo} />
        </div>
      </Sequence>

      <Sequence from={CIERRE.frase - CIERRE.fondo} premountFor={fps}>
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: c.yLogo + (c.anchoLogo * 92.46) / 353.09 + (L.formato === "vertical" ? 120 : 80),
            textAlign: "center",
          }}
        >
          <KineticText texto={CIERRE.frase1} tamano={c.tamanoFrase} tema="oscuro" peso={600} escalonado={2} />
          <Sequence from={6} layout="none">
            <KineticText texto={CIERRE.frase2} clave="cayó." tamano={c.tamanoFrase} tema="oscuro" peso={600} escalonado={2} />
          </Sequence>
          <div
            style={{
              marginTop: L.formato === "vertical" ? 72 : 48,
              fontSize: 44,
              fontWeight: 600,
              color: YC.textoInvertido,
              opacity: dominio,
              transform: `translateY(${(1 - dominio) * 24}px)`,
              letterSpacing: "0.01em",
            }}
          >
            {CIERRE.url}
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
