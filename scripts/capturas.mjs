// Capturas reales del panel de YaCayó para el video (390 × 844 a 3x).
// - Inicio e Ingresos: el panel (yacayo-src/front, `VITE_MOCKS=* pnpm dev:panel`, puerto 5173).
// - Por revisar: el prototipo congelado (scripts/prototipo.vite.config.mjs, puerto 5180), porque
//   en el panel todavía es un marcador (FE7-T01).
// Guarda los PNG en public/screens/ y, en public/screens/zonas.json, dónde queda cada elemento
// clave (en px de la pantalla de 390 × 844) para los zooms y las líneas de las tarjetas.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PANEL = "http://localhost:5173";
const PROTOTIPO = "http://localhost:5180";
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

// Dónde queda un texto visible (el texto mismo, no su contenedor); con `tarjeta`, la tarjeta
// que lo contiene.
async function caja(page, texto, tarjeta = false) {
  const el = visible(page, texto);
  await el.waitFor();
  const b = await el.evaluate((nodo, deTarjeta) => {
    let r = nodo.getBoundingClientRect();
    if (deTarjeta) r = (nodo.closest("li, article") ?? nodo).getBoundingClientRect();
    else {
      const rango = document.createRange();
      rango.selectNodeContents(nodo);
      r = rango.getBoundingClientRect();
    }
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, tarjeta);
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)]));
}

// Dónde queda el bloque más chico que contiene un texto visible y también `dentro` (p. ej. la
// tarjeta de un candidato, que contiene "Es este").
async function bloque(page, texto, { dentro }) {
  const el = visible(page, texto);
  await el.waitFor();
  const b = await el.evaluate((nodo, dentro) => {
    let caja = nodo;
    while (caja.parentElement && !caja.innerText.includes(dentro)) caja = caja.parentElement;
    const r = caja.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, dentro);
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)]));
}

async function capturar(page, nombre, { completa = false } = {}) {
  await page.waitForTimeout(400); // fuentes y animaciones de entrada
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`), fullPage: completa });
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

// Ingresos (Hoy) solo con los confirmados (chip Estado → Confirmado), de página completa:
// cada pago con quién lo confirmó y por dónde (§13).
await panel.getByRole("link", { name: "Ingresos" }).first().click();
await visible(panel, "$614.000").waitFor();
await panel.getByRole("button", { name: /^Estado/ }).filter({ visible: true }).first().click();
await panel.getByRole("dialog").getByRole("button", { name: "Confirmado" }).click();
await panel.getByRole("dialog").waitFor({ state: "hidden" });
await visible(panel, "Marta L.").waitFor();
await panel.evaluate(() => window.scrollTo(0, 0));
// En la página completa, la barra de abajo (fija) quedaría en medio de la lista: se oculta
// solo para esta captura; el video la pone encima, recortada de otra captura.
await panel.evaluate(() => {
  for (const el of document.querySelectorAll("body *")) {
    if (getComputedStyle(el).position === "fixed") el.style.visibility = "hidden";
  }
});
await capturar(panel, "ingresos-confirmados", { completa: true });
const confirmo = (pagador) => caja(panel.locator("li, article").filter({ hasText: pagador }), /^Confirmó/);
zonas["ingresos-confirmados"] = {
  alto: await panel.evaluate(() => document.documentElement.scrollHeight),
  juan: await confirmo("Juan P."),
  carlos: await confirmo("Carlos M."),
  luisa: await confirmo("Luisa G."),
  marta: await confirmo("Marta L."),
};

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
// La lista sigue debajo del detalle: la píldora se mide dentro del detalle.
const detalle = proto.locator(".review-detail-pane");
zonas["por-revisar-detalle"] = {
  pildora: await caja(detalle, "Hay dos pagos posibles"),
  montoLeido: await bloque(proto, "Monto leído", { dentro: "$50.000" }),
  horaLeida: await bloque(proto, "Hora leída", { dentro: "8:02" }),
  laura: await bloque(proto, "Laura M.", { dentro: "Es este" }),
  jorge: await bloque(proto, "Jorge R.", { dentro: "Es este" }),
  esEsteLaura: await caja(proto, "Es este"),
};

// Elegir a Laura M. (Jorge R. abre "Ese pago ya se confirmó" en el prototipo).
await visible(proto, "Es este").click();
await proto.getByRole("alertdialog").waitFor();
await capturar(proto, "por-revisar-dialogo");
zonas["por-revisar-dialogo"] = {
  confirmar: await caja(proto.getByRole("alertdialog"), /^Confirmar$/),
};
await proto.getByRole("alertdialog").getByRole("button", { name: "Confirmar" }).click();
await visible(proto, "Pago confirmado").waitFor();
await capturar(proto, "por-revisar-confirmado");
zonas["por-revisar-confirmado"] = { aviso: await caja(proto, "Pago confirmado") };

await writeFile(path.join(SALIDA, "zonas.json"), JSON.stringify(zonas, null, 2));
console.log(zonas);
await navegador.close();
