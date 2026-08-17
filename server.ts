import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createRoomApi } from './src/room-api/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const configuredMaximum = Number(process.env.MAX_PARTICIPANTS || process.env.MAX_VIEWERS || 6);
const MAX_PARTICIPANTS = Number.isSafeInteger(configuredMaximum)
  ? Math.min(20, Math.max(2, configuredMaximum))
  : 6;
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);
const publicDirectory = path.join(__dirname, 'public');
const indexHtml = readFileSync(path.join(publicDirectory, 'index.html'), 'utf8');
const landingHtml = indexHtml.replace('<base href="/" />', '<base href="./" />');
const roomHtml = indexHtml.replace('<base href="/" />', '<base href="../" />');

if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for shared room signaling on Vercel.');
}

const app = express();
const server = http.createServer(app);
const roomApi = createRoomApi({
  databaseUrl: process.env.DATABASE_URL,
  maximumParticipants: MAX_PARTICIPANTS,
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

app.use(route('/api/rooms'), express.json({ limit: '192kb' }), roomApi.router);

app.get(route('/health'), (_, response) => response.json({ ok: true }));
app.get(route('/config'), (_, response) => {
  const stunUrls = (process.env.STUN_URLS || 'stun:main.lohr.dev:3478,stun:stun.l.google.com:19302')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => /^stuns?:/i.test(url));
  const iceServers = stunUrls.length ? [{ urls: stunUrls }] : [];

  response.set('Cache-Control', 'private, no-store');
  response.json({ iceServers, maxParticipants: MAX_PARTICIPANTS });
});

app.use(BASE_PATH || '/', express.static(publicDirectory, {
  index: false,
  extensions: ['html'],
  maxAge: 0,
}));
app.get(route('/'), (_, response) => response.type('html').send(landingHtml));
app.get(route('/room/:roomId'), (_, response) => response.type('html').send(roomHtml));

if (!process.env.VERCEL) {
  server.listen(PORT, HOST, () => {
    console.log(`mise is ready at http://${HOST}:${PORT}${BASE_PATH || '/'}`);
  });
}

export default server;

function shutdown() {
  server.close(() => void roomApi.close().finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 1_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function normalizeBasePath(value = ''): string {
  const normalized = String(value).trim().replace(/^\/*|\/*$/g, '');
  return normalized ? `/${normalized}` : '';
}

function route(pathname: string): string {
  return `${BASE_PATH}${pathname}`;
}
