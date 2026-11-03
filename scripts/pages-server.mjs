// Minimal local stand-in for GitHub Pages: serves ./site under /<repo>/, resolves
// extensionless .html and index.html, and falls back to /<repo>/404.html with status 404.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const repo = process.env.PAGES_REPO ?? "Portfolio";
const port = Number(process.env.PORT ?? 4180);
const root = path.resolve(process.argv[2] ?? "site");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

function resolve(urlPath) {
  const rel = decodeURIComponent(urlPath).replace(new RegExp(`^/${repo}`), "");
  const base = path.join(root, rel);
  if (!base.startsWith(root)) return null;
  for (const c of [base, `${base}.html`, path.join(base, "index.html")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (!url.pathname.startsWith(`/${repo}`)) {
      res.writeHead(404).end("not found");
      return;
    }
    if (url.pathname === `/${repo}`) {
      res.writeHead(301, { Location: `/${repo}/` }).end();
      return;
    }
    const file = resolve(url.pathname);
    const target = file ?? path.join(root, "404.html");
    res.writeHead(file ? 200 : 404, {
      "Content-Type": types[path.extname(target)] ?? "application/octet-stream",
    });
    fs.createReadStream(target).pipe(res);
  })
  .listen(port, () =>
    console.log(`serving ${root} at http://localhost:${port}/${repo}/`),
  );
