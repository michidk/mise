import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString('base64url');
}

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function passwordHash(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 32) as Buffer;
  return `scrypt:${salt.toString('base64url')}:${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltValue, hashValue] = encoded.split(':');
  if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, 'base64url');
  const actual = await scrypt(password, Buffer.from(saltValue, 'base64url'), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
