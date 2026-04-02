import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const [baseUrl, outputPath, routeLimitArg = "12"] = process.argv.slice(2);
if (!baseUrl || !outputPath) {
  console.error("Usage: node capture_state.mjs <baseUrl> <outputPath> [routeLimit]");
  process.exit(1);
}

const routeLimit = Number(routeLimitArg) || 12;

function unique(values) {
  return [...new Set(values)];
}

function safeFileName(value) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "route";
}

async function discoverRoutes(page, rootUrl) {
  await page.goto(rootUrl, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const routes = await page.evaluate((root) => {
    const origin = new URL(root).origin;
    const hrefs = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => anchor.getAttribute("href") || "")
      .filter(Boolean)
      .map((href) => new URL(href, window.location.href).href)
      .filter((href) => href.startsWith(origin));
    return [root, ...hrefs];
  }, rootUrl);
  return unique(routes).slice(0, routeLimit);
}

async function captureRoute(page, route, viewportName, artifactDir, index) {
  const consoleErrors = [];
  const pageErrors = [];

  const consoleHandler = (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };
  const pageErrorHandler = (err) => {
    pageErrors.push(String(err && err.message ? err.message : err));
  };

  page.on("console", consoleHandler);
  page.on("pageerror", pageErrorHandler);

  try {
    await page.goto(route, { waitUntil: "load" });
    await page.waitForTimeout(400);
  } catch (error) {
    pageErrors.push(String(error && error.message ? error.message : error));
  }

  const data = await page.evaluate(() => {
    const textList = (selector, limit) =>
      Array.from(document.querySelectorAll(selector))
        .map((node) => (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, limit);

    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((node) => ({
        text: (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim(),
        href: node.getAttribute("href") || "",
      }))
      .filter((item) => item.text || item.href)
      .slice(0, 20);

    const buttons = Array.from(document.querySelectorAll("button, [role='button']"))
      .map((node) => (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 20);

    const missingImages = Array.from(document.images || [])
      .filter((img) => img.currentSrc && img.naturalWidth === 0)
      .map((img) => ({
        alt: img.alt || "",
        src: img.currentSrc || "",
      }))
      .slice(0, 10);

    return {
      title: document.title || "",
      url: window.location.href,
      headings: textList("h1, h2, h3", 10),
      links,
      buttons,
      bodyText: (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 3000),
      missingImages,
    };
  });

  const relativeShot = path.join(
    "screenshots",
    `${viewportName}-${String(index).padStart(2, "0")}-${safeFileName(route)}.png`
  );
  const screenshotPath = path.join(artifactDir, relativeShot);
  await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  page.off("console", consoleHandler);
  page.off("pageerror", pageErrorHandler);

  return {
    viewport: viewportName,
    route,
    ...data,
    consoleErrors: consoleErrors.slice(0, 10),
    pageErrors: pageErrors.slice(0, 10),
    screenshot: relativeShot,
  };
}

const browser = await chromium.launch({ headless: true });

try {
  const discoveryContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const discoveryPage = await discoveryContext.newPage();
  const routes = await discoverRoutes(discoveryPage, baseUrl);
  await discoveryContext.close();

  const viewportConfigs = [
    { name: "desktop", contextOptions: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", contextOptions: { ...devices["iPhone 13"] } },
  ];

  const summary = {
    baseUrl,
    capturedAt: new Date().toISOString(),
    routes: [],
  };

  const artifactDir = path.dirname(outputPath);

  for (const viewportConfig of viewportConfigs) {
    const context = await browser.newContext(viewportConfig.contextOptions);
    const page = await context.newPage();
    let routeIndex = 0;
    for (const route of routes) {
      routeIndex += 1;
      const captured = await captureRoute(page, route, viewportConfig.name, artifactDir, routeIndex);
      summary.routes.push(captured);
    }
    await context.close();
  }

  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2), "utf8");
} finally {
  await browser.close();
}
