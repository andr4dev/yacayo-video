// El video promocional de YaCayó para la hackatón (1920 × 1080): el celular o el panel de
// escritorio a un lado y el texto al otro.
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
import { CREDITO_IA, NOTA_DEMO, PLACA } from "./asistente";
import { CameraZoom } from "./componentes/CameraZoom";
import { cajaMensaje } from "./componentes/chatGeometria";
import { BURBUJA, ANCHO_RESPUESTA, ALTO_CONSULTE, cajaDelMensaje, centroDeSugerencia } from "./componentes/asistenteGeometria";
import { Confirmacion } from "./componentes/Confirmacion";
import { CLICS_ESCRITORIO, Escritorio } from "./componentes/Escritorio";
import { FeatureCard } from "./componentes/FeatureCard";
import { Foco } from "./componentes/Foco";
import { BrilloCierre, Fondo } from "./componentes/Fondo";
import { KineticText } from "./componentes/KineticText";
import { LogoAnimado } from "./componentes/LogoAnimado";
import { PantallaCelular } from "./componentes/Pantallas";
import { Phone, SombraPiso } from "./componentes/Phone";
import { Toque } from "./componentes/Toque";
import {
  ASISTENTE,
  CIERRE,
  CONVERSACION,
  ESCENAS,
  MENSAJES,
  MUSICA,
  NOTA,
  PLACA_TIEMPO,
  TARJETAS,
  TITULARES,
} from "./constantes";
import {
  type Layout,
  type Punto,
  LAYOUT,
  aCuadro,
  camara,
  poseCelular,
  poseEscritorio,
  proyectar,
  proyectarEscritorio,
} from "./escenario";
import { FUENTE, YC, alfa } from "./marca";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const hayMusica = () => getStaticFiles().some((f) => f.name === MUSICA);

/** La última respuesta: "No puedo confirmar pagos: solo consulto…". */
const SOLO_CONSULTO = CONVERSACION.pasos[CONVERSACION.pasos.length - 1];

export const YacayoDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT;
  const pose = poseCelular(frame, L);
  const poseE = poseEscritorio(frame, L);
  const cam = camara(frame, pose, poseE, L);
  /** Un punto de la pantalla del celular, en px del cuadro. */
  const enCuadro = (p: Punto) => aCuadro(proyectar(p, pose, L), cam);
  /** Un punto del panel de escritorio, en px del cuadro. */
  const enEscritorio = (p: Punto) => aCuadro(proyectarEscritorio(p, poseE, L), cam);

  const celularVisible = frame >= ESCENAS.foto.desde - 1 && frame < ESCENAS.entrePantallas.desde;
  const escritorioVisible = frame >= ESCENAS.entrePantallas.desde && frame < ESCENAS.placa.desde + 24;
  const luz = celularVisible
    ? enCuadro({ x: 195, y: 422 })
    : escritorioVisible
      ? enEscritorio({ x: 720, y: 450 })
      : { x: L.ancho / 2, y: L.alto / 2 };

  return (
    <AbsoluteFill style={{ fontFamily: FUENTE, background: YC.fondoClaro, overflow: "hidden" }}>
      <Fondo luz={luz} escalaLuz={celularVisible ? cam.s * pose.s : escritorioVisible ? cam.s * 1.3 : 1} />

      {/* Cierre: el fondo --yc-primario crece en círculo. */}
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
              <Foco />
            </Phone>
          </AbsoluteFill>
        </CameraZoom>
      ) : null}

      {escritorioVisible ? (
        <CameraZoom cam={cam}>
          <Escritorio pose={poseE} L={L} />
        </CameraZoom>
      ) : null}

      {/* Velo para leer el titular cuando la cámara se acerca al panel de escritorio. */}
      {escritorioVisible ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(90deg, transparent 0%, transparent 45%, ${YC.fondoClaro} 53%)`,
            opacity: interpolate(cam.s, [1, 1.3], [0, 0.97], clamp),
          }}
        />
      ) : null}

      {/* 1 · Gancho, sobre índigo: "cayó?" en dorado y un salto cuando la moneda toca */}
      <Sequence name="Gancho" from={TITULARES.ganchoA.desde} durationInFrames={TITULARES.ganchoA.hasta} premountFor={fps}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
          <div
            style={{
              width: "100%",
              textAlign: "center",
              scale: interpolate(
                frame,
                [TITULARES.ganchoB.monedaToca, TITULARES.ganchoB.monedaToca + 3, TITULARES.ganchoB.monedaToca + 14],
                [1, 1.06, 1],
                clamp,
              ),
            }}
          >
            <KineticText texto={TITULARES.ganchoA.texto} tamano={96} tema="oscuro" duracion={TITULARES.ganchoA.hasta} />
            <Sequence from={TITULARES.ganchoB.desde} layout="none">
              <KineticText
                texto={TITULARES.ganchoB.texto}
                clave={TITULARES.ganchoB.clave}
                monedaToca={TITULARES.ganchoB.monedaToca - TITULARES.ganchoB.desde}
                tamano={96}
                tema="oscuro"
                colorClave={YC.acento}
                subrayado={false}
                colorMoneda={YC.logoMonedaNegativo}
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
        <Confirmacion tipo="cayo" duracion={50} tamano={L.tamanoPulso} centro={esquinaMensaje("cayo", frame, enCuadro)} />
      </Sequence>
      <Titular L={L} {...TITULARES.segundos} />

      {/* 5 · Ese pago ya se usó */}
      <Sequence name="Pulso · Ya se usó" from={MENSAJES.yaUsado + 2} durationInFrames={50} premountFor={fps}>
        <Confirmacion tipo="fraude" duracion={50} tamano={L.tamanoPulso} centro={esquinaMensaje("yaUsado", frame, enCuadro)} />
      </Sequence>
      <Titular L={L} {...TITULARES.unaVez} />

      {/* Asistente 1 · Pregúntale a tu plata: se toca la burbuja y sube el chat */}
      <Sequence name="Toque · Burbuja" from={ASISTENTE.toqueBurbuja} durationInFrames={22} premountFor={fps}>
        <Toque
          tamano={L.tamanoToque}
          centro={enCuadro({ x: BURBUJA.hoja.x + BURBUJA.hoja.lado / 2, y: BURBUJA.hoja.y + BURBUJA.hoja.lado / 2 })}
        />
      </Sequence>
      <Titular L={L} {...TITULARES.preguntale} />

      {/* Asistente 2 · Responde con tus datos: "¿Cuánto entró hoy?" y de dónde sacó el dato */}
      <Sequence name="Toque · ¿Cuánto entró hoy?" from={ASISTENTE.toqueSugerencia} durationInFrames={22} premountFor={fps}>
        <Toque tamano={L.tamanoToque} centro={enCuadro(centroDeSugerencia("hoja", 0))} />
      </Sequence>
      <Sequence
        name="Tarjeta · De dónde sacó el dato"
        from={TARJETAS.dato.desde}
        durationInFrames={TARJETAS.dato.hasta - TARJETAS.dato.desde}
        premountFor={fps}
      >
        <TarjetaDato L={L} frame={frame} enCuadro={enCuadro} />
      </Sequence>
      <Titular L={L} {...TITULARES.responde} />

      {/* Asistente 3 · Te sigue entre pantallas, y 4 · Solo consulta (panel de escritorio) */}
      {CLICS_ESCRITORIO.map((clic) => (
        <Sequence key={clic.frame} name={`Clic · ${clic.nombre}`} from={clic.frame} durationInFrames={22} premountFor={fps}>
          <Toque tamano={48} centro={enEscritorio(clic.punto)} />
        </Sequence>
      ))}
      <Titular L={L} {...TITULARES.entrePantallas} />
      <Sequence
        name="Escudo · Solo consulta"
        from={SOLO_CONSULTO.aparece + 6}
        durationInFrames={ESCENAS.soloConsulta.hasta - SOLO_CONSULTO.aparece - 6}
        premountFor={fps}
      >
        <Confirmacion
          tipo="escudo"
          duracion={ESCENAS.soloConsulta.hasta - SOLO_CONSULTO.aparece - 6}
          tamano={L.tamanoPulso}
          centro={esquinaSoloConsulto(frame, enEscritorio)}
        />
      </Sequence>
      <Titular L={L} {...TITULARES.soloConsulta} />

      {/* Mientras se ve el chat: es una animación con datos de ejemplo. */}
      <Sequence name="Nota · Demostración" from={NOTA.desde} durationInFrames={NOTA.hasta - NOTA.desde} premountFor={fps}>
        <Nota duracion={NOTA.hasta - NOTA.desde} />
      </Sequence>

      {/* Placa · Gemini en Vertex AI */}
      <Sequence
        name="Placa · Gemini"
        from={PLACA_TIEMPO.desde}
        durationInFrames={PLACA_TIEMPO.hasta - PLACA_TIEMPO.desde}
        premountFor={fps}
      >
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <KineticText
            texto={PLACA}
            clave="propio"
            tamano={64}
            peso={600}
            escalonado={2}
            duracion={PLACA_TIEMPO.hasta - PLACA_TIEMPO.desde}
            style={{ width: 1440 }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Cierre: logo, frase, dominio y el crédito de Gemini */}
      <Sequence name="Cierre" from={CIERRE.fondo} premountFor={fps}>
        <Cierre L={L} />
      </Sequence>

      {hayMusica() ? <Audio src={staticFile(MUSICA)} /> : null}
    </AbsoluteFill>
  );
};

/** La esquina de arriba a la derecha de un mensaje del chat, en px del cuadro. */
function esquinaMensaje(id: "cayo" | "yaUsado", frame: number, enCuadro: (p: Punto) => Punto): Punto {
  const c = cajaMensaje(id, frame);
  return c ? enCuadro({ x: c.x + c.w + 2, y: c.y - 2 }) : { x: -999, y: -999 };
}

/** El borde derecho de "No puedo confirmar pagos: solo consulto…", a media altura. */
function esquinaSoloConsulto(frame: number, enEscritorio: (p: Punto) => Punto): Punto {
  const c = cajaDelMensaje(CONVERSACION, "tarjeta", SOLO_CONSULTO.id, frame);
  return c ? enEscritorio({ x: c.x + ANCHO_RESPUESTA, y: c.y + c.h / 2 }) : { x: -999, y: -999 };
}

/** "Manda la foto": sale del globo de la foto, hacia el lado libre. */
const TarjetaFoto: React.FC<{ L: Layout; frame: number; enCuadro: (p: Punto) => Punto }> = ({ L, frame, enCuadro }) => {
  const c = cajaMensaje("foto1", frame);
  const ancla = c ? enCuadro({ x: c.x + c.w - 18, y: c.y + c.h * 0.45 }) : L.tarjetas.mandaLaFoto;
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

/** "Te dice de dónde sacó el dato": sale de "Consulté: Resumen de ingresos". */
const TarjetaDato: React.FC<{ L: Layout; frame: number; enCuadro: (p: Punto) => Punto }> = ({ L, frame, enCuadro }) => {
  const c = cajaDelMensaje(CONVERSACION, "hoja", "r1", frame);
  // La línea "Consulté: …" va debajo del globo; la tarjeta sale de su final.
  const ancla = c ? enCuadro({ x: c.x + 186, y: c.y + c.h - ALTO_CONSULTE / 2 + 3 }) : L.tarjetas.dato;
  return (
    <FeatureCard
      ancla={ancla}
      centro={L.tarjetas.dato}
      icono="datos"
      colorIcono={YC.primario}
      tamano={L.tamanoTarjeta}
      duracion={TARJETAS.dato.hasta - TARJETAS.dato.desde}
    >
      {TARJETAS.dato.texto}
    </FeatureCard>
  );
};

/** Un titular en la caja de titulares, alineado a la izquierda. */
const Titular: React.FC<{
  L: Layout;
  texto: string;
  clave?: string;
  /** Línea más pequeña debajo del titular. */
  apoyo?: string;
  desde: number;
  hasta: number;
}> = ({ L, texto, clave, apoyo, desde, hasta }) => {
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
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <KineticText
          texto={texto}
          clave={clave}
          tamano={L.tamanoTitular}
          alinear="left"
          escalonado={5}
          duracion={hasta - desde}
          style={{ width: "100%" }}
        />
        {apoyo ? (
          <Sequence from={10} layout="none">
            <KineticText
              texto={apoyo}
              tamano={L.tamanoApoyo}
              alinear="left"
              peso={500}
              colorTexto={YC.textoSecundario}
              escalonado={2}
              duracion={hasta - desde - 10}
              style={{ width: "100%", marginTop: L.tamanoApoyo * 0.4 }}
            />
          </Sequence>
        ) : null}
      </div>
    </Sequence>
  );
};

/** "Demostración con datos de ejemplo", pequeña, abajo a la derecha, en --yc-texto-terciario. */
const Nota: React.FC<{ duracion: number }> = ({ duracion }) => {
  const frame = useCurrentFrame();
  const opacidad = interpolate(frame, [0, 12, duracion - 12, duracion], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.titular.x,
        bottom: 56,
        fontSize: 24,
        fontWeight: 500,
        color: YC.textoTerciario,
        opacity: opacidad,
      }}
    >
      {NOTA_DEMO}
    </div>
  );
};

/** El fondo --yc-primario, que crece en círculo desde el centro del escenario. */
const CierreFondo: React.FC<{ L: Layout }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const radio = interpolate(frame, [0, 20], [0, Math.hypot(width, height)], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  return (
    <AbsoluteFill style={{ background: YC.primario, clipPath: `circle(${radio}px at ${width / 2}px ${height / 2}px)` }}>
      <BrilloCierre centro={{ x: width / 2, y: L.cierre.yLogo + (L.cierre.anchoLogo * 92.46) / 353.09 / 2 }} />
    </AbsoluteFill>
  );
};

/** Logo negativo animado, la frase, el dominio y el crédito de Gemini. */
const Cierre: React.FC<{ L: Layout }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const dominio = spring({ frame: frame - (CIERRE.dominio - CIERRE.fondo), fps, config: { damping: 200 } });
  const credito = spring({ frame: frame - (CIERRE.credito - CIERRE.fondo), fps, config: { damping: 200 } });
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
            top: c.yLogo + (c.anchoLogo * 92.46) / 353.09 + 80,
            textAlign: "center",
          }}
        >
          <KineticText texto={CIERRE.texto} clave="pago" tamano={c.tamanoFrase} tema="oscuro" peso={600} escalonado={3} />
          <div
            style={{
              marginTop: 48,
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
          <div
            style={{
              marginTop: 20,
              fontSize: 30,
              fontWeight: 500,
              color: alfa(YC.textoInvertido, 0.8),
              opacity: credito,
              transform: `translateY(${(1 - credito) * 16}px)`,
            }}
          >
            {CREDITO_IA}
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
