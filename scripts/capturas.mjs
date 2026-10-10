// Capturas reales del panel de YaCayó para el video (390 × 844 a 3x).
// - Inicio e Ingresos: el panel (yacayo-src/front, `VITE_MOCKS=* pnpm dev:panel`, puerto 5173).
// - Por revisar: el prototipo congelado (scripts/prototipo.vite.config.mjs, puerto 5174), porque
//   en el panel todavía es un marcador (FE7-T01).
// Guarda los PNG en public/screens/ y, en public/screens/zonas.json, dónde queda cada elemento
// clave (en px de la pantalla de 390 × 844) para los zooms y las líneas de las tarjetas.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PANEL = "http://localhost:5173";
const PROTOTIPO = "http://localhost:5174";
const SALIDA = fileURLToPath(new URL("../public/screens/", import.meta.url));

// Usuario simulado de MSW (front/README.md, "Datos simulados").
const USUARIO = { correo: "lacasona.pagos@gmail.com", clave: "lacasona2026" };

await mkdir(SALIDA, { recursive: true });
const zonas = {};

const navegador = await chromium.launch({ channel: "chrome" });
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "es-CO",
  timezoneId: "America/Bogota",
});

// En celular, la lista son tarjetas y la tabla de escritorio queda oculta: solo cuenta lo visible.
const visible = (page, texto) => page.getByText(texto).filter({ visible: true }).first();

// Dónde queda un texto visible; con `tarjeta`, la tarjeta que lo contiene.
async function caja(page, texto, tarjeta = false) {
  const el = visible(page, texto);
  await el.waitFor();
  const b = await el.evaluate((nodo, deTarjeta) => {
    const r = (deTarjeta ? nodo.closest("li, article") ?? nodo : nodo).getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, tarjeta);
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)]));
}

async function capturar(page, nombre) {
  await page.waitForTimeout(400); // fuentes y animaciones de entrada
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`) });
  console.log("✓", nombre);
}

// --- Panel: Ingresos (Hoy) antes y después de Camila, e Inicio -------------------------
const panel = await contexto.newPage();
await panel.goto(`${PANEL}/ingresos`);
await panel.getByLabel("Correo").fill(USUARIO.correo);
await panel.getByLabel("Contraseña", { exact: true }).fill(USUARIO.clave);
await panel.getByRole("button", { name: "Entrar" }).click();
await visible(panel, "$542.000").waitFor();
await panel.evaluate(() => document.fonts.ready);

await capturar(panel, "ingresos-antes");
zonas["ingresos-antes"] = {
  total: await caja(panel, "$542.000"),
  tarjetaJuan: await caja(panel, "Juan P.", true),
  confirmoJuan: await caja(panel, /Confirmó Caja 1/),
};

// El pago de Camila llega a los 20 s de abrir (mocks/ingresos.ts); sale resaltado.
await visible(panel, "Camila R.").waitFor({ timeout: 45_000 });
await visible(panel, "$614.000").waitFor();
await capturar(panel, "ingresos-despues");
zonas["ingresos-despues"] = {
  total: await caja(panel, "$614.000"),
  tarjetaCamila: await caja(panel, "Camila R.", true),
  tarjetaJuan: await caja(panel, "Juan P.", true),
  confirmoJuan: await caja(panel, /Confirmó Caja 1/),
};

await panel.getByRole("link", { name: "Inicio" }).first().click();
await panel.getByRole("heading", { level: 1, name: "Inicio" }).waitFor();
await panel.waitForLoadState("networkidle");
await capturar(panel, "inicio");

// --- Prototipo: Por revisar ---------------------------------------------------------------
const proto = await contexto.newPage();
await proto.goto(`${PROTOTIPO}/panel`);
await proto.getByRole("button", { name: /^Por revisar/ }).last().click();
// El selector "Solo diseño" no va en producción (README del prototipo).
await proto.addStyleTag({ content: ".design-review{display:none!important}" });
await proto.evaluate(() => document.fonts.ready);
await capturar(proto, "por-revisar");

// El detalle del caso "Hay dos pagos posibles": los candidatos con "Es este".
await visible(proto, "Hay dos pagos posibles").click();
await visible(proto, "Es este").waitFor();
await capturar(proto, "por-revisar-detalle");

await writeFile(path.join(SALIDA, "zonas.json"), JSON.stringify(zonas, null, 2));
console.log(zonas);
await navegador.close();
