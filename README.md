# Video promocional de YaCayó

Remotion 4 · 30 fps · 44,5 s · 120 BPM. Una composición, `YacayoHorizontal` (1920 × 1080: el
celular o el panel de escritorio a un lado y el texto al otro), para la hackatón de Google: el
asistente del panel (Gemini en Vertex AI) va de 16,5 s a 34 s y la placa de Gemini, de 34 s a 39 s.
El asistente todavía no existe en el front: se dibuja en `src/componentes/Asistente.tsx`, y sus
textos y cifras salen de `src/asistente.ts` (calculadas desde `mocks/datos.ts` del panel).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre Remotion Studio en http://localhost:3000 |
| `npm run render` | Renderiza `out/yacayo-demo-horizontal.mp4` |
| `npm run capturas:asistente` | Toma las capturas del panel para el asistente (`panel-*.png`, con el panel corriendo) |
| `npm run capturas` | Vuelve a tomar las capturas del panel (ver abajo) |
| `node scripts/fotogramas.mjs YacayoVertical 0 150 230` | Saca fotogramas sueltos a `out/fotogramas/` |

## Dónde se cambia qué

- **Textos, cifras y tiempos:** `src/constantes.ts`. Todo sale de la skill `diseno` de YaCayó
  (§5, §8, §9 y §13). Los cortes caen en golpes de 15 frames (`golpe(n)`).
- **Posiciones por formato, movimiento del celular y zooms de cámara:** `src/escenario.ts`.
- **Marca (tokens y fuentes):** `src/marca.ts`, copiada de `yacayo-src/marca/tokens/tokens.css`.
- **Componentes:** `src/componentes/` (`Phone`, `KineticText`, `FeatureCard`, `CameraZoom`,
  `WhatsAppChat`, `CountUp`, …). En el Studio, la carpeta *Elementos* los muestra sueltos.

## Música

Pon una pista en `public/music.mp3` (120 BPM, con el primer golpe en el segundo 0) y suena
sola. Sin ese archivo, el video sale mudo. Los frames de los golpes están en `GOLPES`.

## Capturas del panel

`public/screens/` tiene capturas reales a 3x en 390 × 844 y `zonas.json` (dónde queda cada
elemento, para los zooms y las líneas de las tarjetas). Para volver a tomarlas:

1. `yacayo-src/` es un clon de solo lectura de GitLab (main), ignorado por git.
2. Panel con datos de ejemplo, desde `yacayo-src/front`: `pnpm install` y `VITE_MOCKS=* pnpm dev:panel` (puerto 5173).
3. Prototipo congelado (para *Por revisar*, que en el panel aún es un marcador), desde
   `yacayo-src/front/prototipo`: `npm install` y
   `node node_modules/vite/bin/vite.js --config ../../../scripts/prototipo.vite.config.mjs` (puerto 5180).
4. `npm run capturas` (las aprobadas) o `npm run capturas:asistente` (Inicio y Por revisar del panel de main,
   en celular y escritorio). Si la tarjeta de Inicio no cuadra con el chat, el video no arranca.
