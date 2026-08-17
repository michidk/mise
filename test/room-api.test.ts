import assert from 'node:assert/strict';
import { test } from 'node:test';
import { guestIdentity } from '../src/room/index.js';
import { withUniqueGuestName } from '../src/room-api/internal/guest-name.js';
import { RoomService } from '../src/room-api/internal/service.js';
import type { RoomStore, StoredParticipant } from '../src/room-api/internal/types.js';

test('guest name allocation resolves collisions beyond full room capacity', () => {
  const participant = storedParticipant('new-guest', 'unused');
  const existing = Array.from({ length: 12 }, (_, attempt) =>
    storedParticipant(`guest-${attempt}`, guestIdentity(participant.id, attempt).name));

  const assigned = withUniqueGuestName(participant, existing);
  assert.equal(assigned.name, guestIdentity(participant.id, 12).name);
  assert.ok(!existing.some(({ name }) => name === assigned.name));
});

test('signaling storage derives routing identity from the authenticated request', async () => {
  let appended: Parameters<RoomStore['appendSignal']>[0] | undefined;
  const store = {
    authenticate: async () => storedParticipant('real-sender', 'Sender'),
    appendSignal: async (input) => {
      appended = input;
      return true;
    },
  } as unknown as RoomStore;
  const service = new RoomService(store, 12, () => 1_000);

  await service.sendSignal('real-room', 'real-sender', 'token', {
    recipientId: 'recipient-123',
    kind: 'candidate',
    payload: { candidate: 'candidate:1' },
    roomId: 'forged-room',
    senderId: 'forged-sender',
  } as never);

  assert.deepEqual(appended, {
    roomId: 'real-room',
    senderId: 'real-sender',
    recipientId: 'recipient-123',
    kind: 'candidate',
    payload: { candidate: 'candidate:1' },
    now: 1_000,
  });
});

function storedParticipant(id: string, name: string): StoredParticipant {
  return { id, roomId: 'room-test', name, tokenHash: 'token', isHost: false, lastSeenAt: 0 };
}
