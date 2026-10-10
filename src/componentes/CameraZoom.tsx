// La cámara: acerca y aleja todo lo que tiene adentro (el celular y su sombra). Los valores salen
// de `camara()` en escenario.ts, que lleva un punto de la pantalla del celular al foco.
import type React from "react";
import { AbsoluteFill } from "remotion";
import type { Camara } from "../escenario";

export const CameraZoom: React.FC<{ cam: Camara; children: React.ReactNode }> = ({ cam, children }) => (
  <AbsoluteFill
    style={{
      transformOrigin: "0 0",
      transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`,
    }}
  >
    {children}
  </AbsoluteFill>
);
