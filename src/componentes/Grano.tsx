// Grano fino, como el inicio índigo de la landing ("índigo profundo con grano y brillo dorado").
// Cambia cada dos frames para que se sienta vivo, y además evita que los degradados se vean en
// bandas al comprimir el MP4.
import type React from "react";
import { useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const Grano: React.FC<{ opacidad: number }> = ({ opacidad }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity: opacidad, mixBlendMode: "overlay", pointerEvents: "none" }}
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.9}
          numOctaves={2}
          seed={Math.floor(frame / 2) % 12}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};
