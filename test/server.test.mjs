import { spawn } from 'node:child_process';
import net from 'node:net';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

let app;
let baseUrl;
let brokerUrl;

const getAvailablePort = () => new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

const waitForOutput = (stream, expected) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error(`Timed out waiting for: ${expected}`)), 5_000);
  stream.on('data', (chunk) => {
    if (!chunk.toString().includes(expected)) return;
    clearTimeout(timeout);
    resolve();
  });
});

const connectBrokerClient = (id) => new Promise((resolve, reject) => {
  const socket = new WebSocket(`${brokerUrl}?key=peerjs&id=${id}&token=${id}-token`);
  const timeout = setTimeout(() => reject(new Error(`PeerServer did not open ${id}`)), 3_000);
  socket.addEventListener('message', (event) => {
    if (JSON.parse(event.data).type !== 'OPEN') return;
    clearTimeout(timeout);
    resolve(socket);
  });
  socket.addEventListener('error', reject, { once: true });
});

const nextBrokerMessage = (socket) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Timed out waiting for a relayed message')), 3_000);
  socket.addEventListener('message', (event) => {
    clearTimeout(timeout);
    resolve(JSON.parse(event.data));
  }, { once: true });
});

before(async () => {
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  brokerUrl = `ws://127.0.0.1:${port}/peerjs/peerjs`;
  app = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      STUN_URLS: 'turn:relay.invalid:3478, stun:main.lohr.dev:3478',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForOutput(app.stdout, 'screenshare is ready');
});

after(() => {
  app?.kill('SIGTERM');
});

test('serves the app and public client configuration', async () => {
  const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
  const configResponse = await fetch(`${baseUrl}/config`);
  const config = await configResponse.json();
  const favicon = await fetch(`${baseUrl}/favicon.svg`);
  const client = await fetch(`${baseUrl}/vendor/peerjs.min.js`);
  const room = await fetch(`${baseUrl}/room/abc12345`);

  assert.deepEqual(health, { ok: true });
  assert.equal(config.maxViewers, 5);
  assert.deepEqual(config.iceServers, [{ urls: ['stun:main.lohr.dev:3478'] }]);
  assert.equal('demoTurn' in config, false);
  assert.equal(configResponse.headers.get('cache-control'), 'private, no-store');
  assert.equal(favicon.status, 200);
  assert.match(favicon.headers.get('content-type'), /image\/svg\+xml/);
  assert.ok(config.iceServers.every(({ urls }) => {
    const candidates = Array.isArray(urls) ? urls : [urls];
    return candidates.every((url) => url.startsWith('stun:'));
  }));
  assert.equal(client.status, 200);
  assert.match(client.headers.get('content-type'), /javascript/);
  assert.equal(room.status, 200);
  const page = await room.text();
  assert.match(page, /Share my screen/);
  assert.match(page, /Live chat/);
  assert.match(page, /Optimize stream for/);
  assert.match(page, /Text clarity/);
  assert.match(page, /Smooth motion/);
  assert.match(page, /Advanced/);
  assert.match(page, /Estimated host upload/);
  assert.match(page, /Compression is automatic/);
  assert.match(page, /id="close-room-button"/);
  assert.match(page, /id="viewer-share-button"/);
  assert.match(page, /id="host-share-button"/);
  assert.match(page, /id="share-link"/);
  assert.match(page, /id="copy-button"/);
  assert.match(page, /id="copy-code-button"/);
  assert.match(page, /class="room-code-digits"/);
  assert.match(page, /href="https:\/\/github\.com\/michidk\/mise"/);
});

test('PeerServer registers IDs and relays negotiation messages', async () => {
  const host = await connectBrokerClient('test-host');
  const viewer = await connectBrokerClient('test-viewer');
  const relayed = nextBrokerMessage(viewer);

  host.send(JSON.stringify({
    type: 'OFFER',
    dst: 'test-viewer',
    payload: { marker: 'screen-offer' },
  }));

  assert.deepEqual(await relayed, {
    type: 'OFFER',
    src: 'test-host',
    dst: 'test-viewer',
    payload: { marker: 'screen-offer' },
  });

  host.close();
  viewer.close();
});
