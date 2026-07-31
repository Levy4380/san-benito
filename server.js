#!/usr/bin/env node
/**
 * Minimal static file server for Railway.
 * - Serves index.html for /
 * - Redirects directories to a trailing slash so relative ../css|js|assets resolve
 * - Never shows directory listings
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

function pathnameOf(url) {
  let pathname = decodeURIComponent((url || '/').split('?')[0]);
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  return pathname;
}

function resolveFile(pathname) {
  let p = pathname;
  if (p === '/') p = '/index.html';
  const resolved = path.resolve(ROOT, `.${p}`);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) {
    return null;
  }
  return resolved;
}

function send(res, status, type, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(301, {
    Location: location,
    'Cache-Control': 'no-store',
  });
  res.end();
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
  }

  const pathname = pathnameOf(req.url);
  const filePath = resolveFile(pathname);
  if (!filePath) {
    return send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
  }

  fs.stat(filePath, (err, st) => {
    if (err) {
      return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
    }

    // Directory: force trailing slash so "../css" stays under /demo/...
    if (st.isDirectory()) {
      if (!pathname.endsWith('/')) {
        const qs = (req.url || '').includes('?') ? `?${(req.url || '').split('?')[1]}` : '';
        return redirect(res, `${pathname}/${qs}`);
      }
      const indexPath = path.join(filePath, 'index.html');
      return fs.readFile(indexPath, (readErr, data) => {
        if (readErr) {
          return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
        }
        if (req.method === 'HEAD') {
          res.writeHead(200, {
            'Content-Type': TYPES['.html'],
            'Content-Length': data.length,
          });
          return res.end();
        }
        send(res, 200, TYPES['.html'], data);
      });
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
      }
      const ext = path.extname(filePath).toLowerCase();
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
