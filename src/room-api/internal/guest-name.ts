import { guestIdentity, guestIdentityCount } from '../../room/index.js';
import type { StoredParticipant } from './types.js';

export function withUniqueGuestName(participant: StoredParticipant, members: readonly StoredParticipant[]) {
  const usedNames = new Set(members.map((member) => member.name));
  for (let attempt = 0; attempt < guestIdentityCount; attempt += 1) {
    const name = guestIdentity(participant.id, attempt).name;
    if (!usedNames.has(name)) return { ...participant, name };
  }
  throw new Error('No anonymous guest identities are available.');
}
