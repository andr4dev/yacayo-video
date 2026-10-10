import type React from "react";
import { AbsoluteFill, Composition, Folder, useCurrentFrame } from "remotion";
import { CountUp } from "./componentes/CountUp";
import { FeatureCard } from "./componentes/FeatureCard";
import { KineticText } from "./componentes/KineticText";
import { Phone } from "./componentes/Phone";
import { PantallaCelular } from "./componentes/Pantallas";
import { WhatsAppChat } from "./componentes/WhatsAppChat";
import { DURACION, ESCENAS, FPS } from "./constantes";
import { LAYOUTS, poseCelular } from "./escenario";
import { YC } from "./marca";
import { YacayoDemo } from "./YacayoDemo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="YacayoVertical"
      component={YacayoDemo}
      durationInFrames={DURACION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="YacayoHorizontal"
      component={YacayoDemo}
      durationInFrames={DURACION}
      fps={FPS}
      width={1920}
      height={1080}
    />

    {/* Los componentes sueltos, para revisarlos uno por uno en el Studio. */}
    <Folder name="Elementos">
      <Composition
        id="KineticText"
        component={KineticTextDemo}
        durationInFrames={60}
        fps={FPS}
        width={1080}
        height={600}
        defaultProps={{ texto: "Todo queda en tu panel.", clave: "panel.", tamano: 92 }}
      />
      <Composition id="FeatureCard" component={FeatureCardDemo} durationInFrames={60} fps={FPS} width={1080} height={600} />
      <Composition id="CountUp" component={CountUpDemo} durationInFrames={60} fps={FPS} width={1080} height={400} />
      <Composition id="WhatsAppChat" component={WhatsAppChat} durationInFrames={DURACION} fps={FPS} width={390} height={844} />
      <Composition id="Phone" component={PhoneDemo} durationInFrames={DURACION} fps={FPS} width={1080} height={1920} />
    </Folder>
  </>
);

const Lienzo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: YC.fondoClaro, justifyContent: "center", alignItems: "center" }}>{children}</AbsoluteFill>
);

const KineticTextDemo: React.FC<{ texto: string; clave: string; tamano: number }> = (props) => (
  <Lienzo>
    <KineticText {...props} duracion={58} style={{ width: 900 }} />
  </Lienzo>
);

const FeatureCardDemo: React.FC = () => (
  <Lienzo>
    <FeatureCard
      ancla={{ x: 200, y: 300 }}
      centro={{ x: 620, y: 300 }}
      icono="check"
      colorIcono={YC.verificado}
      tamano={44}
      duracion={58}
    >
      <span style={{ color: YC.verificado }}>Confirmado</span>
      <span style={{ color: YC.textoSecundario }}> · Caja 1</span>
    </FeatureCard>
  </Lienzo>
);

const CountUpDemo: React.FC = () => (
  <Lienzo>
    <CountUp desde={542_000} hasta={614_000} duracion={40} style={{ fontSize: 120, color: YC.texto }} />
  </Lienzo>
);

const PhoneDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = LAYOUTS.vertical;
  return (
    <Lienzo>
      <AbsoluteFill style={{ perspective: L.perspectiva, perspectiveOrigin: `${L.celular.cx}px ${L.celular.cy}px` }}>
        <Phone pose={poseCelular(Math.max(frame, ESCENAS.foto.desde), L)} k={L.celular.k}>
          <PantallaCelular />
        </Phone>
      </AbsoluteFill>
    </Lienzo>
  );
};
