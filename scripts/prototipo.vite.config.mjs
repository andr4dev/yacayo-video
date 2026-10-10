// Arranca el prototipo congelado de YaCayó (yacayo-src/front/prototipo) sin editarlo: su
// vite.config.ts importa .figma/make/site.json, que no viene en el export. Solo para capturas.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../yacayo-src/front/prototipo");
const desde = (paquete, archivo) =>
  import(pathToFileURL(path.join(raiz, "node_modules", paquete, "dist", archivo)).href);

const { default: react } = await desde("@vitejs/plugin-react", "index.js");
const { default: tailwindcss } = await desde("@tailwindcss/vite", "index.mjs");

export default {
  root: raiz,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.join(raiz, "src") } },
  server: { host: "localhost", port: 5180, strictPort: true },
};
