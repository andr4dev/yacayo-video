// Celular moderno hecho con código: marco oscuro neutro, isla, espesor con capas en 3D y sombra
// suave al piso. Sin imágenes ni logos de marcas de celulares.
import type React from "react";
import { BISEL, PANTALLA, type Pose } from "../escenario";
import { YC, alfa } from "../marca";

const RADIO_CUERPO = 62; // en unidades de pantalla
const RADIO_PANTALLA = RADIO_CUERPO - BISEL;
const CAPAS_ESPESOR = 9;

type PhoneProps = {
  pose: Pose;
  /** px del cuadro por unidad de pantalla. */
  k: number;
  /**
   * Cuánto acerca la cámara. Chrome rasteriza el celular 3D a su escala local, así que se dibuja
   * `nitidez` veces más grande y se compensa en el transform: nítido también con zoom.
   */
  nitidez?: number;
  children: React.ReactNode;
};

export const Phone: React.FC<PhoneProps> = ({ pose, k: kBase, nitidez = 1, children }) => {
  const k = kBase * nitidez;
  const ancho = (PANTALLA.ancho + 2 * BISEL) * k;
  const alto = (PANTALLA.alto + 2 * BISEL) * k;
  const canto = `color-mix(in srgb, ${YC.fondoOscuro} 82%, white)`;

  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - ancho / 2,
        top: pose.y - alto / 2,
        width: ancho,
        height: alto,
        transformStyle: "preserve-3d",
        transform: `rotateZ(${pose.rz}deg) rotateY(${pose.ry}deg) rotateX(${pose.rx}deg) scale(${pose.s / nitidez})`,
      }}
    >
      {/* Espesor: el canto del celular se ve al girar. */}
      {Array.from({ length: CAPAS_ESPESOR }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: RADIO_CUERPO * k,
            background: i === CAPAS_ESPESOR - 1 ? YC.fondoOscuro : canto,
            transform: `translateZ(${-(i + 1) * 1.5 * k}px)`,
          }}
        />
      ))}

      {/* Botones laterales */}
      {[
        { lado: "left", top: 150, alto: 34 },
        { lado: "left", top: 200, alto: 60 },
        { lado: "left", top: 272, alto: 60 },
        { lado: "right", top: 230, alto: 96 },
      ].map((b) => (
        <div
          key={`${b.lado}${b.top}`}
          style={{
            position: "absolute",
            [b.lado]: -3 * k,
            top: b.top * k,
            width: 5 * k,
            height: b.alto * k,
            borderRadius: 3 * k,
            background: canto,
            transform: `translateZ(${-5 * k}px)`,
          }}
        />
      ))}

      {/* Cuerpo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: RADIO_CUERPO * k,
          background: YC.fondoOscuro,
          boxShadow: `inset 0 0 0 ${1.5 * k}px ${alfa("#FFFFFF", 0.14)}, inset 0 0 0 ${4 * k}px ${alfa("#000000", 0.35)}`,
        }}
      >
        {/* Pantalla */}
        <div
          style={{
            position: "absolute",
            left: BISEL * k,
            top: BISEL * k,
            width: PANTALLA.ancho * k,
            height: PANTALLA.alto * k,
            borderRadius: RADIO_PANTALLA * k,
            overflow: "hidden",
            background: YC.fondoClaro,
          }}
        >
          <div
            style={{
              width: PANTALLA.ancho,
              height: PANTALLA.alto,
              transform: `scale(${k})`,
              transformOrigin: "0 0",
              position: "relative",
            }}
          >
            {children}
          </div>
        </div>

        {/* Isla */}
        <div
          style={{
            position: "absolute",
            top: (BISEL + 11) * k,
            left: "50%",
            width: 112 * k,
            height: 33 * k,
            marginLeft: -56 * k,
            borderRadius: 999,
            background: `color-mix(in srgb, ${YC.fondoOscuro} 60%, black)`,
          }}
        />

        {/* Reflejo muy leve sobre el vidrio */}
        <div
          style={{
            position: "absolute",
            inset: BISEL * k,
            borderRadius: RADIO_PANTALLA * k,
            background: `linear-gradient(125deg, ${alfa("#FFFFFF", 0.1)} 0%, transparent 28%)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

/** Sombra suave al piso, debajo del celular. Se aclara cuando el celular sube. */
export const SombraPiso: React.FC<{ pose: Pose; k: number; cy: number }> = ({ pose, k, cy }) => {
  const alto = (PANTALLA.alto + 2 * BISEL) * k;
  const piso = cy + alto / 2 + 46 * k;
  const distancia = Math.abs(pose.y - cy);
  const opacidad = Math.max(0, 1 - distancia / (220 * k)) * pose.s;
  const ancho = (PANTALLA.ancho + 2 * BISEL) * k * 1.1 * pose.s;
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - ancho / 2,
        top: piso - 40 * k,
        width: ancho,
        height: 80 * k,
        borderRadius: "50%",
        background: `radial-gradient(closest-side, ${alfa(YC.fondoOscuro, 0.3)}, transparent)`,
        opacity: opacidad,
        filter: `blur(${8 * k}px)`,
      }}
    />
  );
};
