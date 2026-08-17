import type { RoomConnectionState, RoomRole, RoomSessionSnapshot } from '../types.js';

const INITIAL_STATE: RoomSessionSnapshot = {
  role: 'none',
  connection: 'idle',
  roomId: '',
  hostId: '',
  viewerName: '',
  presentationPending: false,
  participantCount: 1,
};

export class RoomSession {
  private current: RoomSessionSnapshot = { ...INITIAL_STATE };

  get snapshot(): Readonly<RoomSessionSnapshot> {
    return this.current;
  }

  get role(): RoomRole { return this.current.role; }
  get connection(): RoomConnectionState { return this.current.connection; }
  get roomId() { return this.current.roomId; }
  get hostId() { return this.current.hostId; }
  get viewerName() { return this.current.viewerName; }
  get presentationPending() { return this.current.presentationPending; }
  get participantCount() { return this.current.participantCount; }
  get isHost() { return this.current.role === 'host'; }
  get ended() { return this.current.connection === 'ended'; }

  startHosting(roomId: string) {
    this.current = {
      ...INITIAL_STATE,
      role: 'host',
      connection: 'connecting',
      roomId,
      hostId: roomId,
    };
  }

  startJoining(roomId: string) {
    this.current = {
      ...INITIAL_STATE,
      role: 'viewer',
      connection: 'connecting',
      roomId,
      hostId: roomId,
      participantCount: 0,
    };
  }

  markLive(details: { viewerName?: string; hostId?: string } = {}) {
    if (this.current.role === 'none' || this.ended) return false;
    this.current = {
      ...this.current,
      connection: 'live',
      viewerName: details.viewerName ?? this.current.viewerName,
      hostId: details.hostId ?? this.current.hostId,
    };
    return true;
  }

  beginPresentation() {
    if (this.current.connection !== 'live' || this.current.presentationPending) return false;
    this.current = { ...this.current, presentationPending: true };
    return true;
  }

  finishPresentation() {
    this.current = { ...this.current, presentationPending: false };
  }

  setParticipantCount(participantCount: number) {
    if (!Number.isSafeInteger(participantCount) || participantCount < 0 || participantCount > 100) return false;
    this.current = { ...this.current, participantCount };
    return true;
  }

  end() {
    if (this.current.role === 'none' || this.ended) return false;
    this.current = { ...this.current, connection: 'ended', presentationPending: false };
    return true;
  }

  reset() {
    this.current = { ...INITIAL_STATE };
  }
}
