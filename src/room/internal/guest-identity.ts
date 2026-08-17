const ANIMALS = [
  ['Alpaca', '🦙'], ['Axolotl', '🦎'], ['Badger', '🦡'], ['Bat', '🦇'],
  ['Bear', '🐻'], ['Beaver', '🦫'], ['Bee', '🐝'], ['Bison', '🦬'],
  ['Butterfly', '🦋'], ['Camel', '🐫'], ['Capybara', '🦦'], ['Cat', '🐈'],
  ['Chameleon', '🦎'], ['Cheetah', '🐆'], ['Chicken', '🐔'], ['Chipmunk', '🐿️'],
  ['Cobra', '🐍'], ['Cow', '🐄'], ['Crab', '🦀'], ['Crocodile', '🐊'],
  ['Deer', '🦌'], ['Dodo', '🦤'], ['Dolphin', '🐬'], ['Duck', '🦆'],
  ['Eagle', '🦅'], ['Elephant', '🐘'], ['Flamingo', '🦩'], ['Fox', '🦊'],
  ['Frog', '🐸'], ['Giraffe', '🦒'], ['Goat', '🐐'], ['Gorilla', '🦍'],
  ['Hedgehog', '🦔'], ['Hippo', '🦛'], ['Horse', '🐎'], ['Hummingbird', '🐦'],
  ['Kangaroo', '🦘'], ['Koala', '🐨'], ['Ladybug', '🐞'], ['Leopard', '🐆'],
  ['Lion', '🦁'], ['Llama', '🦙'], ['Lobster', '🦞'], ['Manatee', '🦭'],
  ['Monkey', '🐒'], ['Moose', '🦤'], ['Mouse', '🐁'], ['Octopus', '🐙'],
  ['Orangutan', '🦧'], ['Otter', '🦦'], ['Owl', '🦉'], ['Panda', '🐼'],
  ['Parrot', '🦜'], ['Peacock', '🦚'], ['Penguin', '🐧'], ['Porcupine', '🦔'],
  ['Rabbit', '🐇'], ['Raccoon', '🦝'], ['Rhino', '🦏'], ['Seal', '🦭'],
  ['Shark', '🦈'], ['Sloth', '🦥'], ['Snail', '🐌'], ['Swan', '🦢'],
  ['Tiger', '🐅'], ['Toucan', '🦜'], ['Turtle', '🐢'], ['Walrus', '🦭'],
  ['Whale', '🐋'], ['Wolf', '🐺'], ['Wombat', '🐻'], ['Zebra', '🦓'],
] as const;

export interface GuestIdentity {
  name: string;
  emoji: string;
  color: number;
}

/** Derives a stable, anonymous collaborator identity from a random participant ID. */
export function guestIdentity(participantId: string): GuestIdentity {
  const hash = hashString(participantId);
  const animal = ANIMALS[hash % ANIMALS.length];
  return { name: `Anonymous ${animal[0]}`, emoji: animal[1], color: hash % 8 };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
