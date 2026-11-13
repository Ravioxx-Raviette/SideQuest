"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  const filename = path.resolve(
    root,
    `.${pathname === "/" ? "/index.html" : pathname}`,
  );
  if (filename !== root && !filename.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filename, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type":
        mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  });
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Sidequest is ready at http://127.0.0.1:${port}`),
);
