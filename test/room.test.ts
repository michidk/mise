import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  RoomAdmission,
  RoomSession,
  parseHostRoomMessage,
  parseViewerRoomMessage,
} from '../src/room/index.js';

const token = (value: number) => value.toString(16).padStart(32, '0');

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

test('room admission authorizes only host-issued peer credentials and revokes them on leave', () => {
  let nextToken = 0;
  const hostAdmission = new RoomAdmission(() => token(++nextToken));
  hostAdmission.startHost('host-room');
  const viewerCredential = hostAdmission.admit('viewer-1');

  assert.equal(hostAdmission.isAuthorized('viewer-1', viewerCredential.mediaToken), true);
  assert.equal(hostAdmission.isAuthorized('viewer-1', token(999)), false);
  assert.equal(hostAdmission.isAuthorized('outsider', viewerCredential.mediaToken), false);
  assert.deepEqual(hostAdmission.credentials('viewer-1'), [{ peerId: 'host-room', mediaToken: token(1) }]);

  assert.equal(hostAdmission.revoke('viewer-1'), true);
  assert.equal(hostAdmission.isAuthorized('viewer-1', viewerCredential.mediaToken), false);
});

test('viewer admission installs its own token and the host-approved participant roster', () => {
  const viewerAdmission = new RoomAdmission();
  viewerAdmission.startViewer('host-room');

  assert.equal(viewerAdmission.accept('viewer-1', token(2), [
    { peerId: 'host-room', mediaToken: token(1) },
  ]), true);
  assert.equal(viewerAdmission.localMediaToken, token(2));
  assert.equal(viewerAdmission.isAuthorized('host-room', token(1)), true);
  assert.equal(viewerAdmission.authorize({ peerId: 'viewer-2', mediaToken: token(3) }), true);
  assert.equal(viewerAdmission.isAuthorized('viewer-2', token(3)), true);
  assert.equal(viewerAdmission.authorize({ peerId: 'viewer-1', mediaToken: token(4) }), false);
});

test('viewer admission rejects a roster that does not authorize the room host', () => {
  const viewerAdmission = new RoomAdmission();
  viewerAdmission.startViewer('host-room');

  assert.equal(viewerAdmission.accept('viewer-1', token(2), [
    { peerId: 'viewer-2', mediaToken: token(3) },
  ]), false);
  assert.equal(viewerAdmission.localMediaToken, '');
});

test('host protocol parser validates admission credentials', () => {
  assert.deepEqual(parseHostRoomMessage({
    type: 'accepted',
    name: 'Guest 1',
    hostId: 'host-room',
    mediaToken: token(2),
    participants: [{ peerId: 'host-room', mediaToken: token(1) }],
  }, 'host-room'), {
    type: 'accepted',
    name: 'Guest 1',
    hostId: 'host-room',
    mediaToken: token(2),
    participants: [{ peerId: 'host-room', mediaToken: token(1) }],
  });

  assert.equal(parseHostRoomMessage({
    type: 'accepted',
    name: 'Guest 1',
    hostId: 'host-room',
    mediaToken: 'guessable',
    participants: [],
  }, 'host-room'), undefined);
});
