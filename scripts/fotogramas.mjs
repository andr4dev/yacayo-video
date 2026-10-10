// Saca fotogramas sueltos de una composición para revisarlos sin abrir el Studio.
// Uso: node scripts/fotogramas.mjs YacayoVertical 0 45 120 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [id = "YacayoVertical", ...frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
for (const f of frames.map(Number)) {
  const output = path.resolve(`out/fotogramas/${id}-${String(f).padStart(3, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: f, output, scale: Number(process.env.ESCALA ?? 0.5) });
  console.log("✓", output);
}
