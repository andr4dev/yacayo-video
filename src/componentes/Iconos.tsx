// Íconos de una sola familia (lucide, trazo uniforme), como pide la skill de diseño §6.
import type React from "react";

const TRAZOS = {
  // lucide "check"
  check: <path d="M20 6 9 17l-5-5" />,
  // lucide "camera"
  camara: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  // lucide "chevron-left"
  atras: <path d="m15 18-6-6 6-6" />,
  // lucide "mic"
  microfono: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </>
  ),
  // lucide "paperclip"
  clip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  // lucide "check-check"
  dobleCheck: (
    <>
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type NombreIcono = keyof typeof TRAZOS;

export const Icono: React.FC<{ nombre: NombreIcono; tamano: number; color: string; grosor?: number }> = ({
  nombre,
  tamano,
  color,
  grosor = 2.5,
}) => (
  <svg
    width={tamano}
    height={tamano}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={grosor}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    {TRAZOS[nombre]}
  </svg>
);
