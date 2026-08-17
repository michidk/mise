import assert from 'node:assert/strict';
import { test } from 'node:test';
import { guestIdentity } from '../src/room/index.js';
import { withUniqueGuestName } from '../src/room-api/internal/guest-name.js';
import type { StoredParticipant } from '../src/room-api/internal/types.js';

test('guest name allocation resolves collisions beyond full room capacity', () => {
  const participant = storedParticipant('new-guest', 'unused');
  const existing = Array.from({ length: 12 }, (_, attempt) =>
    storedParticipant(`guest-${attempt}`, guestIdentity(participant.id, attempt).name));

  const assigned = withUniqueGuestName(participant, existing);
  assert.equal(assigned.name, guestIdentity(participant.id, 12).name);
  assert.ok(!existing.some(({ name }) => name === assigned.name));
});

function storedParticipant(id: string, name: string): StoredParticipant {
  return { id, roomId: 'room-test', name, tokenHash: 'token', isHost: false, lastSeenAt: 0 };
}
