import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { ok: false, errors: [], checks: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...(process.env.DSH_BROWSER_STORAGE_STATE ? { storageState: process.env.DSH_BROWSER_STORAGE_STATE } : {}) });
  if (process.env.DSH_BROWSER_AUTH_HELPER) {
    const { authorize } = await import(pathToFileURL(process.env.DSH_BROWSER_AUTH_HELPER).href);
    await authorize(context);
  }
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  const response = await page.goto("http://127.0.0.1:3080/");
  assert.equal(response.status(), 200, "supply an authenticated storage state or local verification helper");
  const canvas = page.locator("#dsh-ascii-ocean-background canvas");
  await canvas.waitFor({ state: "visible" });
  await page.waitForTimeout(700);
  assert.equal(await canvas.count(), 1);
  assert.equal(await page.locator("#dsh-ascii-ocean-background").getAttribute("inert"), "");
  assert.equal(await canvas.evaluate((element) => getComputedStyle(element).pointerEvents), "none");
  assert.equal(await canvas.evaluate((element) => element.width), 1440);
  const first = await canvas.evaluate((element) => element.toDataURL());
  await page.waitForTimeout(400);
  assert.notEqual(await canvas.evaluate((element) => element.toDataURL()), first, "background animates");
  assert.equal(await page.getByText("原版鲨鱼", { exact: true }).count(), 0);
  const composer = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
  await composer.fill("背景输入验证");
  assert.equal(await composer.evaluate((element) => element.value ?? element.innerText), "背景输入验证");
  await composer.fill("");
  await page.screenshot({ path: `${root}/artifacts/dsh-ocean-home-light.png` });
  report.checks.push("installed self-contained plugin, one canvas, animation, inert click-through layer and composer input");

  await page.getByText("tmp", { exact: true }).first().click();
  await page.getByText("读取并了解字符鲨鱼代码库", { exact: true }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${root}/artifacts/dsh-ocean-chat-light.png` });
  assert.equal(await canvas.count(), 1, "session navigation does not duplicate the background");
  // Exercise both presentation modes in this test document only; do not write
  // the user's durable appearance preference during verification.
  await page.evaluate(() => document.body.setAttribute("data-ds-dark-theme", ""));
  assert.equal(await canvas.evaluate((element) => getComputedStyle(element).filter), "none");
  await page.screenshot({ path: `${root}/artifacts/dsh-ocean-chat-dark.png` });
  report.checks.push("real chat session, light and dark presentation, navigation without duplicate canvas");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  assert.equal(await canvas.evaluate((element) => element.width), 390);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: `${root}/artifacts/dsh-ocean-mobile.png` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(250);
  const still = await canvas.evaluate((element) => element.toDataURL());
  await page.waitForTimeout(350);
  assert.equal(await canvas.evaluate((element) => element.toDataURL()), still);
  report.checks.push("mobile viewport, no horizontal overflow, reduced-motion static frame");

  const isolated = await context.newPage();
  await isolated.setContent('<div id="root"></div>');
  const bundle = await readFile(new URL("../dsh-background/client.js", import.meta.url), "utf8");
  const lifecycle = await isolated.evaluate(async (code) => {
    let plugin;
    window.__ModuleLoader__ = { load(registration) { plugin = registration.factory(() => { throw Error("unexpected dependency"); }); } };
    (0, eval)(code);
    let dispose;
    const listeners = [];
    const originalAdd = window.addEventListener;
    window.addEventListener = function(type, ...args) { listeners.push(type); return originalAdd.call(this, type, ...args); };
    plugin.apply({ effect(setup) { dispose = setup(); }, theme: { overrideTokens() { return () => {}; } } });
    window.addEventListener = originalAdd;
    await new Promise((resolve) => setTimeout(resolve, 200));
    const noPointerListeners = !listeners.some((type) => type.startsWith("pointer"));
    dispose();
    return {
      noPointerListeners,
      remainingLayers: document.querySelectorAll("#dsh-ascii-ocean-background").length,
      remainingStyles: document.querySelectorAll('style[data-plugin="dsh-ascii-ocean-background"]').length,
      bodyMarker: document.body.hasAttribute("data-dsh-ocean-background"),
    };
  }, bundle);
  assert.deepEqual(lifecycle, { noPointerListeners: true, remainingLayers: 0, remainingStyles: 0, bodyMarker: false });
  report.checks.push("no pointer listeners; disable cleanup releases canvas, engine, styles and theme override");

  const demo = await context.newPage();
  await demo.goto("http://127.0.0.1:5173/");
  assert.equal(await demo.locator("nav, button, a").count(), 0, "standalone demo has no scene buttons");
  assert.deepEqual(report.errors, []);
  report.ok = true;
  await writeFile(new URL("../artifacts/dsh-background-verification.json", import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
