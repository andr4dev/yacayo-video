# Video promocional de YaCayó

Remotion 4 · 30 fps · 25 s · 120 BPM. Dos composiciones: `YacayoVertical` (1080 × 1920) y
`YacayoHorizontal` (1920 × 1080, celular a un lado y texto al otro).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre Remotion Studio en http://localhost:3000 |
| `npm run render` | Renderiza `out/yacayo-demo-vertical.mp4` y `out/yacayo-demo-horizontal.mp4` |
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
   `node node_modules/vite/bin/vite.js --config ../../../scripts/prototipo.vite.config.mjs` (puerto 5174).
4. `npm run capturas`.
