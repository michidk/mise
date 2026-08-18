import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { buildIceServerFactory } from '../src/ice-config/index.js';

test('TURN credentials are short-lived HMAC credentials and secrets stay server-side', () => {
  const factory = buildIceServerFactory({
    stunUrls: 'stun:stun.example.test:3478, turn:ignored.example.test:3478',
    turnUrls: 'turn:turn.example.test:3478,turns:turn.example.test:5349',
    turnSharedSecret: 'shared-secret',
    turnTtlSeconds: 600,
  }, () => 1_700_000_000_000);

  const servers = factory.create();
  assert.deepEqual(servers[0], { urls: ['stun:stun.example.test:3478'] });
  const turn = servers[1];
  assert.deepEqual(turn.urls, ['turn:turn.example.test:3478', 'turns:turn.example.test:5349']);
  assert.match(turn.username ?? '', /^1700000600:/);
  assert.equal(turn.credential, createHmac('sha1', 'shared-secret').update(turn.username ?? '').digest('base64'));
  assert.equal(JSON.stringify(servers).includes('shared-secret'), false);
});

test('TURN configuration fails closed when the shared secret is missing', () => {
  assert.throws(() => buildIceServerFactory({
    stunUrls: '',
    turnUrls: 'turn:turn.example.test:3478',
  }), /TURN_SHARED_SECRET/);
});
