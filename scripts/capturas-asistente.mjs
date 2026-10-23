// Capturas del panel para las escenas del asistente: Inicio y Por revisar, en celular (390 × 844
// a 3x) y en escritorio (1440 × 900 a 2x), del panel de main con datos simulados
// (yacayo-src/front, `VITE_MOCKS=* pnpm dev:panel`, puerto 5173).
// Guarda los PNG en public/screens/ (panel-*.png) y, en public/screens/zonas-asistente.json, dónde
// queda cada elemento (en px de CSS) y las cifras que muestra la tarjeta de Inicio, para que el
// chat las compare con las suyas (src/asistente/datos.ts).
//
// Uso: npm run capturas:asistente
//   PW_CANAL=chromium       usa el Chromium de Playwright en vez de Chrome
//   PW_EJECUTABLE=/ruta     usa ese navegador (por ejemplo, el de /opt/pw-browsers)
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PANEL = "http://localhost:5173";
const SALIDA = fileURLToPath(new URL("../public/screens/", import.meta.url));

// Usuario simulado de MSW (front/README.md, "Datos simulados"; mocks/datos.ts, usuarioSimulado).
const USUARIO = { correo: "lacasona.pagos@gmail.com", clave: "lacasona2026" };

await mkdir(SALIDA, { recursive: true });
const zonas = {};

const canal = process.env.PW_CANAL ?? "chrome";
const navegador = await chromium.launch(
  process.env.PW_EJECUTABLE
    ? { executablePath: process.env.PW_EJECUTABLE }
    : canal === "chromium"
      ? {}
      : { channel: canal },
);

// "Avisar en voz alta" (FE13-T01) se deshabilita si el navegador no tiene una voz en español, como
// el Chromium sin voces de las pruebas. Un celular o un computador de verdad sí la tiene: se le da
// una para que el interruptor salga como lo ve el dueño.
const conVozEnEspanol = () => {
  const voz = { lang: "es-CO", name: "Español (Colombia)", default: true, localService: true, voiceURI: "es-CO" };
  window.speechSynthesis.getVoices = () => [voz];
};

async function nuevoContexto({ celular }) {
  const contexto = await navegador.newContext({
    viewport: celular ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: celular ? 3 : 2,
    isMobile: celular,
    hasTouch: celular,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    colorScheme: "light",
  });
  await contexto.addInitScript(conVozEnEspanol);
  return contexto;
}

const visible = (page, texto) => page.getByText(texto).filter({ visible: true }).first();

/** La caja de un elemento, redondeada, en px de CSS. */
async function cajaDe(locator) {
  await locator.waitFor();
  const b = await locator.boundingBox();
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k === "width" ? "w" : k === "height" ? "h" : k, Math.round(v)]));
}

/** Dónde queda un texto visible (el texto mismo, no su contenedor). */
async function caja(page, texto) {
  const el = visible(page, texto);
  await el.waitFor();
  const b = await el.evaluate((nodo) => {
    const rango = document.createRange();
    rango.selectNodeContents(nodo);
    const r = rango.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)]));
}

async function capturar(page, nombre) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600); // animaciones de entrada
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`) });
  console.log("✓", nombre);
}

/** Entra y espera a Camila (llega a los 20 s de abrir, mocks/ingresos.ts): Hoy queda en $614.000. */
async function entrar(page) {
  await page.goto(`${PANEL}/ingresos`);
  await page.getByLabel("Correo").fill(USUARIO.correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(USUARIO.clave);
  await page.getByRole("button", { name: "Entrar" }).click();
  await visible(page, "Camila R.").waitFor({ timeout: 45_000 });
}

/** Lo que dice la tarjeta "Pagos recibidos" de Inicio. */
async function tarjetaDeInicio(page) {
  const tarjeta = page.locator("section").filter({ hasText: "Pagos recibidos" }).filter({ visible: true }).first();
  await tarjeta.waitFor();
  const texto = await tarjeta.innerText();
  const total = texto.match(/\$[\d.]+/)?.[0] ?? null;
  const pagos = Number(texto.match(/(\d+) pagos?/)?.[1] ?? NaN);
  const sinConfirmar = Number(texto.match(/Sin confirmar\s+(\d+) pagos?/)?.[1] ?? NaN);
  return { texto: { total, pagos, sinConfirmar }, caja: await cajaDe(tarjeta) };
}

for (const celular of [true, false]) {
  const sufijo = celular ? "" : "-escritorio";
  const contexto = await nuevoContexto({ celular });
  const page = await contexto.newPage();
  await entrar(page);

  // --- Inicio ------------------------------------------------------------------------------
  await page.getByRole("link", { name: "Inicio" }).filter({ visible: true }).first().click();
  await page.getByRole("heading", { level: 1, name: "Inicio" }).waitFor();
  await page.waitForLoadState("networkidle");
  const tarjeta = await tarjetaDeInicio(page);
  // El plan en pequeño junto al título: "82 % · 330 de 400" (mocks/suscripcion.ts).
  const [, usados, limite] = (await visible(page, /\d+ % · [\d.]+ de [\d.]+/).innerText())
    .replaceAll(".", "")
    .match(/([\d]+) de ([\d]+)/);
  await capturar(page, `panel-inicio${sufijo}`);
  zonas[`panel-inicio${sufijo}`] = {
    tarjeta: tarjeta.caja,
    total: await caja(page, tarjeta.texto.total),
    cifras: tarjeta.texto,
    plan: { usados: Number(usados), limite: Number(limite) },
    porRevisar: await cajaDe(page.getByRole("link", { name: /^Por revisar/ }).filter({ visible: true }).first()),
  };

  // --- Por revisar -------------------------------------------------------------------------
  await page.getByRole("link", { name: /^Por revisar/ }).filter({ visible: true }).first().click();
  await page.getByRole("heading", { level: 1, name: "Por revisar" }).waitFor();
  await visible(page, "Hay dos pagos posibles").waitFor();
  await visible(page, "No se pudo leer la foto").waitFor();
  await page.waitForLoadState("networkidle");
  await capturar(page, `panel-por-revisar${sufijo}`);
  zonas[`panel-por-revisar${sufijo}`] = {
    ambiguo: await caja(page, "Hay dos pagos posibles"),
    ilegible: await caja(page, "No se pudo leer la foto"),
  };

  await contexto.close();
}

await writeFile(path.join(SALIDA, "zonas-asistente.json"), `${JSON.stringify(zonas, null, 2)}\n`);
console.log(JSON.stringify(zonas, null, 2));
await navegador.close();
