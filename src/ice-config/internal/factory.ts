import { createHmac, randomBytes } from 'node:crypto';
import type { IceServerFactory, IceServerFactoryOptions } from '../types.js';

const DEFAULT_TURN_TTL_SECONDS = 60 * 60;

export function buildIceServerFactory(options: IceServerFactoryOptions, now: () => number = Date.now): IceServerFactory {
  const stunUrls = urls(options.stunUrls, /^stuns?:/i);
  const turnUrls = urls(options.turnUrls ?? '', /^turns?:/i);
  const turnSecret = options.turnSharedSecret?.trim() ?? '';
  if (turnUrls.length && !turnSecret) throw new Error('TURN_SHARED_SECRET is required when TURN_URLS is configured.');
  if (turnSecret && !turnUrls.length) throw new Error('TURN_URLS is required when TURN_SHARED_SECRET is configured.');
  const ttl = boundedTtl(options.turnTtlSeconds);

  return {
    create() {
      const servers: RTCIceServer[] = [];
      if (stunUrls.length) servers.push({ urls: stunUrls });
      if (turnUrls.length) {
        const expiresAt = Math.floor(now() / 1_000) + ttl;
        const username = `${expiresAt}:${randomBytes(12).toString('base64url')}`;
        const credential = createHmac('sha1', turnSecret).update(username).digest('base64');
        servers.push({ urls: turnUrls, username, credential });
      }
      return servers;
    },
  };
}

function urls(value: string, protocol: RegExp) {
  return value.split(',').map((url) => url.trim()).filter((url) => protocol.test(url));
}

function boundedTtl(value: number | undefined) {
  if (value === undefined) return DEFAULT_TURN_TTL_SECONDS;
  if (!Number.isSafeInteger(value) || value < 60 || value > 24 * 60 * 60) {
    throw new Error('TURN_TTL_SECONDS must be an integer between 60 and 86400.');
  }
  return value;
}
