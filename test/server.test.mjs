import { spawn } from 'node:child_process';
import net from 'node:net';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

let app;
let baseUrl;

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

const roomRequest = async (pathname, { identity, ...init } = {}) => {
  const headers = { 'Content-Type': 'application/json', ...init.headers };
  if (identity) {
    headers.Authorization = `Bearer ${identity.participantToken}`;
    headers['X-Participant-Id'] = identity.participant.id;
  }
  return fetch(`${baseUrl}/api/rooms${pathname}`, { ...init, headers });
};

before(async () => {
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      STUN_URLS: 'turn:relay.invalid:3478, stun:main.lohr.dev:3478, stun:stun.l.google.com:19302',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForOutput(app.stdout, 'mise is ready');
});

after(() => {
  app?.kill('SIGTERM');
});

test('serves the app and public client configuration', async () => {
  const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
  const configResponse = await fetch(`${baseUrl}/config`);
  const config = await configResponse.json();
  const favicon = await fetch(`${baseUrl}/favicon.svg`);
  const appClient = await fetch(`${baseUrl}/app.js`);
  const appClientSource = await appClient.text();
  const landing = await fetch(`${baseUrl}/`);
  const room = await fetch(`${baseUrl}/room/abc12345`);

  assert.deepEqual(health, { ok: true });
  assert.equal(config.maxParticipants, 12);
  assert.deepEqual(config.iceServers, [{
    urls: ['stun:main.lohr.dev:3478', 'stun:stun.l.google.com:19302'],
  }]);
  assert.equal('demoTurn' in config, false);
  assert.equal(configResponse.headers.get('cache-control'), 'private, no-store');
  assert.equal(favicon.status, 200);
  assert.match(favicon.headers.get('content-type'), /image\/svg\+xml/);
  assert.match(favicon.headers.get('cache-control'), /max-age=0/);
  assert.ok(config.iceServers.every(({ urls }) => {
    const candidates = Array.isArray(urls) ? urls : [urls];
    return candidates.every((url) => url.startsWith('stun:'));
  }));
  assert.match(appClientSource, /getDisplayMedia/);
  assert.match(appClientSource, /RTCPeerConnection/);
  assert.doesNotMatch(appClientSource, /PeerJS/);
  assert.doesNotMatch(appClientSource, /window\.prompt/);
  assert.match(appClientSource, /text-lossless-v1/);
  assert.match(appClientSource, /text-frame-start/);
  assert.match(appClientSource, /text-frame-chunk/);
  assert.match(appClientSource, /text-keyframe-request/);
  assert.equal(landing.status, 200);
  assert.match(await landing.text(), /<base href="\.\/" \/>/);
  assert.equal(room.status, 200);
  const page = await room.text();
  assert.match(page, /<base href="\.\.\/" \/>/);
  assert.match(page, /Create a room/);
  assert.match(page, /Start room/);
  assert.match(page, /Join a room/);
  assert.match(page, /id="join-password-dialog"/);
  assert.match(page, /Enter room password/);
  assert.equal((page.match(/data-room-limit-step/g) || []).length, 2);
  assert.match(page, /Chat &amp; activity/);
  assert.equal((page.match(/data-participant-count/g) || []).length, 2);
  assert.match(page, /Lossless text pipeline/);
  assert.match(page, /Text responsive/);
  assert.match(page, /Smooth motion/);
  assert.match(page, /Pixel-exact tile deltas/);
  assert.match(page, /Estimated upload/);
  assert.match(page, /id="stream-grid"/);
  assert.match(page, /id="leave-room-button"/);
  assert.match(page, /id="stream-button"/);
  assert.match(page, /id="local-audio-button"/);
  assert.match(page, /data-share-audio/);
  assert.equal((page.match(/data-share-audio/g) || []).length, 1);
  assert.match(page, /id="copy-invite-button"/);
  assert.match(page, /id="copy-room-code"/);
  assert.match(page, /Every stream is peer-to-peer encrypted/);
  assert.match(page, /href="https:\/\/github\.com\/michidk\/mise"/);
});

test('room API enforces passwords and participant limits', async () => {
  const invalidLimit = await roomRequest('', {
    method: 'POST',
    body: JSON.stringify({ maxParticipants: 13 }),
  });
  assert.equal(invalidLimit.status, 400);
  assert.equal((await invalidLimit.json()).error.code, 'invalid-participant-limit');

  const createdResponse = await roomRequest('', {
    method: 'POST',
    body: JSON.stringify({ password: 'correct horse', maxParticipants: 2 }),
  });
  assert.equal(createdResponse.status, 201);
  const host = await createdResponse.json();

  const missingPassword = await roomRequest(`/${host.roomId}/join`, { method: 'POST', body: '{}' });
  assert.equal(missingPassword.status, 401);
  assert.equal((await missingPassword.json()).error.code, 'password-required');

  const wrongPassword = await roomRequest(`/${host.roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ password: 'wrong' }),
  });
  assert.equal(wrongPassword.status, 401);
  assert.equal((await wrongPassword.json()).error.code, 'invalid-password');

  const joinedResponse = await roomRequest(`/${host.roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ password: 'correct horse' }),
  });
  assert.equal(joinedResponse.status, 201);
  const viewer = await joinedResponse.json();
  assert.equal(viewer.hostId, host.hostId);
  assert.deepEqual(viewer.participants.map(({ id }) => id), [host.participant.id]);

  const fullResponse = await roomRequest(`/${host.roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ password: 'correct horse' }),
  });
  assert.equal(fullResponse.status, 409);
  assert.equal((await fullResponse.json()).error.code, 'room-full');
});

test('room API relays authenticated WebRTC signaling through a durable mailbox', async () => {
  const host = await roomRequest('', {
    method: 'POST',
    body: JSON.stringify({ maxParticipants: 3 }),
  }).then((response) => response.json());
  const viewer = await roomRequest(`/${host.roomId}/join`, {
    method: 'POST',
    body: '{}',
  }).then((response) => response.json());

  const offer = { type: 'offer', sdp: 'test-sdp' };
  const sendResponse = await roomRequest(`/${host.roomId}/signals`, {
    identity: viewer,
    method: 'POST',
    body: JSON.stringify({ recipientId: host.participant.id, kind: 'description', payload: offer }),
  });
  assert.equal(sendResponse.status, 202);

  const batchResponse = await roomRequest(`/${host.roomId}/signals?after=0`, { identity: host });
  assert.equal(batchResponse.status, 200);
  const batch = await batchResponse.json();
  assert.equal(batch.signals.length, 1);
  assert.equal(batch.signals[0].senderId, viewer.participant.id);
  assert.equal(batch.signals[0].recipientId, host.participant.id);
  assert.deepEqual(batch.signals[0].payload, offer);

  const unauthorized = await roomRequest(`/${host.roomId}/signals?after=0`);
  assert.equal(unauthorized.status, 401);
});
