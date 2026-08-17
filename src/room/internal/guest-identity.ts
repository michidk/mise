const MOODS = [
  'Bouncy', 'Cranky', 'Dapper', 'Dizzy', 'Fluffy', 'Giggly', 'Grumpy', 'Jolly',
  'Loopy', 'Noodly', 'Pickled', 'Puffy', 'Sleepy', 'Sneaky', 'Sparkly', 'Spicy',
  'Squiggly', 'Toasty', 'Wiggly', 'Wobbly', 'Wonky', 'Yappy', 'Zany', 'Zippy',
] as const;

const CREATURES = [
  ['Bumbleyak', '🦬'], ['Chortlefox', '🦊'], ['Doodleduck', '🦆'], ['Fizzlebear', '🐻'],
  ['Floofalope', '🦙'], ['Fluffasaur', '🦕'], ['Fumblebee', '🐝'], ['Gigglemoth', '🦋'],
  ['Gobblefinch', '🐦'], ['Grumblepup', '🐶'], ['Jellymoose', '🦤'], ['Marshmole', '🦔'],
  ['Muffalo', '🦬'], ['Noodlebeast', '🦎'], ['Paddlebop', '🐧'], ['Picklephant', '🐘'],
  ['Pifflepanda', '🐼'], ['Ploomaroo', '🦘'], ['Puffaroo', '🦘'], ['Quirkadillo', '🦔'],
  ['Rumbletoad', '🐸'], ['Snickerbat', '🦇'], ['Snortlehog', '🦔'], ['Socksquatch', '🦧'],
  ['Sprinkleotter', '🦦'], ['Squishgull', '🐦'], ['Taterbug', '🐞'], ['Toodleowl', '🦉'],
  ['Wafflewombat', '🐻'], ['Wobblecat', '🐈'], ['Yoodleyak', '🦬'], ['Zoodlephant', '🐘'],
] as const;

const IDENTITY_COUNT = MOODS.length * CREATURES.length;

export interface GuestIdentity {
  name: string;
  emoji: string;
  color: number;
}

/** Returns one of 768 stable fake-animal identities; attempt walks every option exactly once. */
export function guestIdentity(participantId: string, attempt = 0): GuestIdentity {
  const hash = hashString(participantId);
  const index = (hash + normalizeAttempt(attempt) * 31) % IDENTITY_COUNT;
  const mood = MOODS[index % MOODS.length];
  const creature = CREATURES[Math.floor(index / MOODS.length)];
  return { name: `Anonymous ${mood} ${creature[0]}`, emoji: creature[1], color: hash % 8 };
}

export function guestIdentityWithName(participantId: string, name: string): GuestIdentity {
  for (let attempt = 0; attempt < IDENTITY_COUNT; attempt += 1) {
    const identity = guestIdentity(participantId, attempt);
    if (identity.name === name) return identity;
  }
  return guestIdentity(participantId);
}

export const guestIdentityCount = IDENTITY_COUNT;

function normalizeAttempt(attempt: number) {
  return Number.isSafeInteger(attempt) && attempt > 0 ? attempt % IDENTITY_COUNT : 0;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
