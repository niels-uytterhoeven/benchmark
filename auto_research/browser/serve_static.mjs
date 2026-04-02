import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const port = Number.parseInt(process.argv[2] ?? "3013", 10);
const rootDir = path.resolve(process.argv[3] ?? process.cwd());

const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".htm", "text/html; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
]);

function toSafePath(requestUrl) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  const relativePath = decodeURIComponent(url.pathname);
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.resolve(rootDir, `.${normalized}`);
  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }
  return absolutePath;
}

async function resolveFilePath(requestUrl) {
  let absolutePath = toSafePath(requestUrl);
  if (!absolutePath) {
    return null;
  }

  try {
    const stats = await fs.stat(absolutePath);
    if (stats.isDirectory()) {
      absolutePath = path.join(absolutePath, "index.html");
    }
    return absolutePath;
  } catch {
    if (!path.extname(absolutePath)) {
      return path.join(rootDir, "index.html");
    }
    return absolutePath;
  }
}

const server = createServer(async (req, res) => {
  const filePath = await resolveFilePath(req.url ?? "/");
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES.get(ext) ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving ${rootDir} at http://127.0.0.1:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
