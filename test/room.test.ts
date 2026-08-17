import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  RoomSession,
  parseHostRoomMessage,
  parseViewerRoomMessage,
} from '../src/room/index.js';

const settings = {
  codec: 'text-lossless-v1',
  frameRate: 6,
  compressionLevel: 6,
  tileSize: 128,
  label: 'Native pixels',
  buttonLabel: 'Lossless text',
};

test('room session enforces explicit host, live, presenting, and ended transitions', () => {
  const session = new RoomSession();
  assert.equal(session.beginPresentation(), false);

  session.startHosting('abcd-2345');
  assert.equal(session.isHost, true);
  assert.equal(session.connection, 'connecting');
  assert.equal(session.beginPresentation(), false);

  assert.equal(session.markLive(), true);
  assert.equal(session.beginPresentation(), true);
  assert.equal(session.beginPresentation(), false);
  session.finishPresentation();
  assert.equal(session.beginPresentation(), true);

  assert.equal(session.end(), true);
  assert.equal(session.presentationPending, false);
  assert.equal(session.beginPresentation(), false);
  assert.equal(session.end(), false);
});

test('host protocol parser returns typed presenters and derives host authority locally', () => {
  const message = parseHostRoomMessage({
    type: 'stream-started',
    presenter: {
      id: 'host-room',
      name: 'Host',
      isHost: false,
      audioEnabled: true,
      settings,
    },
  }, 'host-room');

  assert.equal(message?.type, 'stream-started');
  if (message?.type !== 'stream-started') assert.fail('Expected a stream-started message.');
  assert.equal(message.presenter.isHost, true);
});

test('viewer protocol parser rejects malformed codec settings', () => {
  assert.equal(parseViewerRoomMessage({
    type: 'settings-changed',
    streamSettings: { ...settings, frameRate: Number.NaN },
  }), undefined);

  assert.deepEqual(parseViewerRoomMessage({
    type: 'settings-changed',
    streamSettings: settings,
  }), { type: 'settings-changed', streamSettings: settings });
});

test('host protocol parser validates REST-admitted participant identity', () => {
  assert.deepEqual(parseHostRoomMessage({
    type: 'accepted',
    name: 'Guest 1',
    hostId: 'host-room',
  }, 'host-room'), {
    type: 'accepted',
    name: 'Guest 1',
    hostId: 'host-room',
  });

  assert.equal(parseHostRoomMessage({
    type: 'accepted',
    name: 'Guest 1',
    hostId: '',
  }, 'host-room'), undefined);
});
