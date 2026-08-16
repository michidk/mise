import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ExpressPeerServer } from 'peer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_VIEWERS = Number(process.env.MAX_VIEWERS || 5);
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);
const publicDirectory = path.join(__dirname, 'public');
const indexHtml = readFileSync(path.join(publicDirectory, 'index.html'), 'utf8')
  .replace('<base href="/" />', `<base href="${BASE_PATH || ''}/" />`);

const app = express();
const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  path: '/',
  proxied: true,
  allow_discovery: false,
  alive_timeout: 60_000,
});

app.disable('x-powered-by');
app.use((_, response, next) => {
  response.set({
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), display-capture=(self)',
  });
  next();
});

app.use(route('/peerjs'), peerServer);

app.get(route('/health'), (_, response) => response.json({ ok: true }));
app.get(route('/config'), (_, response) => {
  const stunUrls = (process.env.STUN_URLS || 'stun:main.lohr.dev:3478')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => /^stuns?:/i.test(url));
  const iceServers = stunUrls.length ? [{ urls: stunUrls }] : [];

  response.set('Cache-Control', 'private, no-store');
  response.json({ iceServers, maxViewers: MAX_VIEWERS });
});

app.get(route('/vendor/peerjs.min.js'), (_, response) => {
  response.sendFile(path.join(__dirname, 'node_modules', 'peerjs', 'dist', 'peerjs.min.js'));
});

app.use(BASE_PATH || '/', express.static(publicDirectory, {
  index: false,
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
}));
app.get([route('/'), route('/room/:roomId')], (_, response) => response.type('html').send(indexHtml));

if (!process.env.VERCEL) {
  server.listen(PORT, HOST, () => {
    console.log(`screenshare is ready at http://${HOST}:${PORT}${BASE_PATH || '/'}`);
  });
}

export default server;

function shutdown() {
  server.close();
  setTimeout(() => process.exit(0), 250).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function normalizeBasePath(value = '') {
  const normalized = String(value).trim().replace(/^\/*|\/*$/g, '');
  return normalized ? `/${normalized}` : '';
}

function route(pathname) {
  return `${BASE_PATH}${pathname}`;
}
