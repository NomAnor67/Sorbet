import http from "http";
import fs from "fs";
import path from "path";

const root = process.cwd();
const dist = path.join(root, "dist");
const port = process.env.PORT || 4173;

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function getMime(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function fileExists(filePath) {
  try {
    const stat = await fs.promises.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url?.split("?")[0] || "/";
  const safeUrl = decodeURIComponent(url.replace(/\.+/g, "."));
  const requested = safeUrl === "/" ? "/index.html" : safeUrl;
  const filePath = path.join(dist, requested);

  let finalPath = filePath;
  if (!(await fileExists(finalPath))) {
    finalPath = path.join(dist, "index.html");
  }

  try {
    const data = await fs.promises.readFile(finalPath);
    res.writeHead(200, { "Content-Type": getMime(finalPath) });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("File not found");
  }
});

server.listen(port, () => {
  console.log(`Serving static site from ${dist}`);
  console.log(`Open http://localhost:${port}`);
});
