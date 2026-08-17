import type { SignalEnvelope } from '../../signaling/index.js';
import type { JoinStoreResult, RoomStore, StoredParticipant, StoredRoom } from './types.js';

const PARTICIPANT_STALE_MS = 60_000;
const SIGNAL_TTL_MS = 2 * 60_000;

interface MemorySignal extends SignalEnvelope {
  roomId: string;
  createdAt: number;
}

export class MemoryRoomStore implements RoomStore {
  private readonly rooms = new Map<string, StoredRoom>();
  private readonly participants = new Map<string, Map<string, StoredParticipant>>();
  private readonly signals: MemorySignal[] = [];
  private nextSignalId = 1;

  async createRoom(room: StoredRoom, host: StoredParticipant) {
    if (this.rooms.has(room.id)) throw new Error('Room ID collision.');
    this.rooms.set(room.id, { ...room });
    this.participants.set(room.id, new Map([[host.id, { ...host }]]));
  }

  async getRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    return room ? { ...room } : undefined;
  }

  async joinRoom(roomId: string, participant: StoredParticipant, now: number): Promise<JoinStoreResult> {
    const room = this.rooms.get(roomId);
    const members = this.participants.get(roomId);
    if (!room || !members || room.closed || room.expiresAt <= now) return { status: 'unavailable' };
    this.pruneParticipants(roomId, now);
    if (members.size >= room.maxParticipants) return { status: 'full' };
    const existing = [...members.values()].map((member) => ({ ...member }));
    members.set(participant.id, { ...participant });
    return { status: 'joined', participants: existing };
  }

  async authenticate(roomId: string, participantId: string, expectedTokenHash: string, now: number) {
    const room = this.rooms.get(roomId);
    const participant = this.participants.get(roomId)?.get(participantId);
    if (!room || room.closed || room.expiresAt <= now || !participant
      || participant.tokenHash !== expectedTokenHash || participant.lastSeenAt < now - PARTICIPANT_STALE_MS) return undefined;
    return { ...participant };
  }

  async heartbeat(roomId: string, participantId: string, expectedTokenHash: string, now: number, roomExpiresAt: number) {
    const participant = await this.authenticate(roomId, participantId, expectedTokenHash, now);
    if (!participant) return false;
    participant.lastSeenAt = now;
    this.participants.get(roomId)?.set(participantId, participant);
    if (participant.isHost) {
      const room = this.rooms.get(roomId);
      if (room) room.expiresAt = roomExpiresAt;
    }
    return true;
  }

  async leaveRoom(roomId: string, participantId: string, expectedTokenHash: string) {
    const participant = this.participants.get(roomId)?.get(participantId);
    if (!participant || participant.tokenHash !== expectedTokenHash || participant.isHost) return false;
    return this.participants.get(roomId)?.delete(participantId) ?? false;
  }

  async closeRoom(roomId: string, participantId: string, expectedTokenHash: string) {
    const room = this.rooms.get(roomId);
    const participant = this.participants.get(roomId)?.get(participantId);
    if (!room || !participant?.isHost || participant.id !== room.hostId || participant.tokenHash !== expectedTokenHash) return false;
    room.closed = true;
    return true;
  }

  async appendSignal(input: Parameters<RoomStore['appendSignal']>[0]) {
    const members = this.participants.get(input.roomId);
    if (!members?.has(input.senderId) || !members.has(input.recipientId)) return false;
    this.signals.push({
      id: this.nextSignalId++,
      roomId: input.roomId,
      senderId: input.senderId,
      recipientId: input.recipientId,
      kind: input.kind,
      payload: structuredClone(input.payload),
      createdAt: input.now,
    });
    return true;
  }

  async readSignals(roomId: string, participantId: string, after: number, now: number) {
    this.pruneSignals(now);
    return this.signals
      .filter((signal) => signal.roomId === roomId && signal.recipientId === participantId && signal.id > after)
      .slice(0, 100)
      .map(({ roomId: _, createdAt: __, ...signal }) => structuredClone(signal));
  }

  private pruneParticipants(roomId: string, now: number) {
    const members = this.participants.get(roomId);
    if (!members) return;
    for (const [id, member] of members) {
      if (!member.isHost && member.lastSeenAt < now - PARTICIPANT_STALE_MS) members.delete(id);
    }
  }

  private pruneSignals(now: number) {
    while (this.signals[0] && this.signals[0].createdAt < now - SIGNAL_TTL_MS) this.signals.shift();
  }
}
