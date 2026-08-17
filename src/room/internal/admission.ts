import type { MediaCredential, RoomRole } from '../types.js';

const MEDIA_TOKEN_PATTERN = /^[a-f0-9]{32}$/;
const PEER_ID_PATTERN = /^[a-z0-9-]{1,80}$/i;

export class RoomAdmission {
  private readonly participants = new Map<string, string>();
  private role: RoomRole = 'none';
  private localPeerId = '';
  private requiredHostPeerId = '';

  constructor(private readonly createToken: () => string = randomMediaToken) {}

  get localMediaToken() {
    return this.participants.get(this.localPeerId) ?? '';
  }

  startHost(hostPeerId: string) {
    if (!validPeerId(hostPeerId)) throw new Error('Cannot start admission for an invalid host.');
    this.reset();
    this.role = 'host';
    this.localPeerId = hostPeerId;
    this.participants.set(hostPeerId, this.issueToken());
  }

  startViewer(hostPeerId: string) {
    if (!validPeerId(hostPeerId)) throw new Error('Cannot join admission for an invalid host.');
    this.reset();
    this.role = 'viewer';
    this.requiredHostPeerId = hostPeerId;
  }

  admit(peerId: string): MediaCredential {
    if (this.role !== 'host') throw new Error('Only the room host can admit participants.');
    if (!validPeerId(peerId) || peerId === this.localPeerId) throw new Error('Cannot admit an invalid participant.');
    const credential = { peerId, mediaToken: this.issueToken() };
    this.participants.set(peerId, credential.mediaToken);
    return credential;
  }

  accept(localPeerId: string, mediaToken: string, participants: MediaCredential[]) {
    if (this.role !== 'viewer' || !validPeerId(localPeerId) || !validMediaToken(mediaToken)) return false;
    this.participants.clear();
    this.localPeerId = localPeerId;
    this.participants.set(localPeerId, mediaToken);
    for (const participant of participants) {
      if (participant.peerId === localPeerId || !this.authorize(participant)) {
        this.participants.clear();
        this.localPeerId = '';
        return false;
      }
    }
    if (!this.participants.has(this.requiredHostPeerId)) {
      this.participants.clear();
      this.localPeerId = '';
      return false;
    }
    return true;
  }

  authorize(credential: MediaCredential) {
    if (!validPeerId(credential.peerId) || !validMediaToken(credential.mediaToken)) return false;
    if (credential.peerId === this.localPeerId
      && this.participants.get(this.localPeerId) !== credential.mediaToken) return false;
    this.participants.set(credential.peerId, credential.mediaToken);
    return true;
  }

  revoke(peerId: string) {
    if (peerId === this.localPeerId) return false;
    return this.participants.delete(peerId);
  }

  isAuthorized(peerId: string, mediaToken: unknown) {
    return typeof mediaToken === 'string' && this.participants.get(peerId) === mediaToken;
  }

  credentials(excludePeerId = ''): MediaCredential[] {
    return [...this.participants]
      .filter(([peerId]) => peerId !== excludePeerId)
      .map(([peerId, mediaToken]) => ({ peerId, mediaToken }));
  }

  reset() {
    this.participants.clear();
    this.role = 'none';
    this.localPeerId = '';
    this.requiredHostPeerId = '';
  }

  private issueToken() {
    const token = this.createToken();
    if (!validMediaToken(token)) throw new Error('Media credential generation failed.');
    return token;
  }
}

export function validMediaToken(value: unknown): value is string {
  return typeof value === 'string' && MEDIA_TOKEN_PATTERN.test(value);
}

function validPeerId(value: unknown): value is string {
  return typeof value === 'string' && PEER_ID_PATTERN.test(value);
}

function randomMediaToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
