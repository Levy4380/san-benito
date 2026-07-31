#!/usr/bin/env node
/**
 * Minimal static file server for Railway (no directory listings, keeps .html URLs).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.toml': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function resolveFile(urlPath) {
  let pathname = decodeURIComponent((urlPath || '/').split('?')[0]);
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (pathname === '/') pathname = '/index.html';

  const resolved = path.resolve(ROOT, `.${pathname}`);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) {
    return null;
  }
  return resolved;
}

function send(res, status, type, body) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
  }

  const filePath = resolveFile(req.url || '/');
  if (!filePath) {
    return send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
  }

  fs.stat(filePath, (err, st) => {
    if (err) {
      return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
    }

    let target = filePath;
    if (st.isDirectory()) {
      target = path.join(filePath, 'index.html');
    }

    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
      }
      const ext = path.extname(target).toLowerCase();
      const type = TYPES[ext] || 'application/octet-stream';
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length });
        return res.end();
      }
      send(res, 200, type, data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`San Benito demo listening on 0.0.0.0:${PORT}`);
});
