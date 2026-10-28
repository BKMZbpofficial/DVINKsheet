/* ============================================================
   TARKELIA • HERO TEST — local static server
   Usage: node server.js [port]
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2]) || Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (_) {
    send(res, 400, 'Bad request');
    return;
  }

  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': ['html', 'js', 'css', 'webmanifest'].includes(ext.replace('.', '')) ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log('');
  console.log('  DVINKsheets • Tarkelia Hero Test');
  console.log(`  http://localhost:${port}`);
  console.log('');
  console.log('  Для Telegram Mini App нужен HTTPS-адрес (ngrok, Cloudflare Tunnel и т.п.).');
  console.log('  Нажми Ctrl+C, чтобы остановить сервер.');
  console.log('');
});
