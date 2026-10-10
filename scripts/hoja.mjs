// Junta varios fotogramas en una hoja de contacto (para revisar rápido).
// Uso: node scripts/hoja.mjs salida.png YacayoVertical 300 325 ...
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const [salida, id, ...frames] = process.argv.slice(2);
const dir = path.resolve("out/fotogramas");
const html = `<body style="margin:0;display:flex;gap:6px;background:#888">${frames
  .map((f) => `<figure style="margin:0;font:14px sans-serif"><img src="${id}-${String(f).padStart(3, "0")}.png" style="display:block;height:${process.env.ALTO ?? 900}px"><figcaption>${f}</figcaption></figure>`)
  .join("")}</body>`;
const archivo = path.join(dir, "_hoja.html");
await writeFile(archivo, html);
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 400, height: 930 } });
await p.goto(pathToFileURL(archivo).href);
await p.screenshot({ path: path.join(dir, salida), fullPage: true });
await b.close();
console.log("✓", salida);
