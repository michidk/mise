import type { SignalEnvelope, SignalKind } from '../../signaling/index.js';

export interface StoredRoom {
  id: string;
  hostId: string;
  passwordHash: string | null;
  maxParticipants: number;
  expiresAt: number;
  closed: boolean;
}

export interface StoredParticipant {
  id: string;
  roomId: string;
  name: string;
  tokenHash: string;
  isHost: boolean;
  lastSeenAt: number;
}

export type JoinStoreResult =
  | { status: 'joined'; participant: StoredParticipant; participants: StoredParticipant[] }
  | { status: 'full' }
  | { status: 'unavailable' };

export interface AdminRoomRecord {
  id: string;
  hostId: string;
  protected: boolean;
  maxParticipants: number;
  createdAt: number;
  expiresAt: number;
  closedAt: number | null;
}

export interface AdminParticipantRecord {
  id: string;
  roomId: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

export interface AdminSignalRecord {
  id: number;
  roomId: string;
  senderId: string;
  recipientId: string;
  kind: SignalKind;
  payloadBytes: number;
  createdAt: number;
  expiresAt: number;
}

export interface AdminDatabaseSnapshot {
  generatedAt: number;
  rooms: AdminRoomRecord[];
  participants: AdminParticipantRecord[];
  signals: AdminSignalRecord[];
}

export interface RoomStore {
  createRoom(room: StoredRoom, host: StoredParticipant): Promise<void>;
  getRoom(roomId: string): Promise<StoredRoom | undefined>;
  joinRoom(roomId: string, participant: StoredParticipant, now: number): Promise<JoinStoreResult>;
  authenticate(roomId: string, participantId: string, tokenHash: string, now: number): Promise<StoredParticipant | undefined>;
  heartbeat(roomId: string, participantId: string, tokenHash: string, now: number, roomExpiresAt: number): Promise<boolean>;
  leaveRoom(roomId: string, participantId: string, tokenHash: string): Promise<boolean>;
  closeRoom(roomId: string, participantId: string, tokenHash: string): Promise<boolean>;
  appendSignal(input: {
    roomId: string;
    senderId: string;
    recipientId: string;
    kind: SignalKind;
    payload: unknown;
    now: number;
  }): Promise<boolean>;
  readSignals(roomId: string, participantId: string, after: number, now: number): Promise<SignalEnvelope[]>;
  adminSnapshot(): Promise<AdminDatabaseSnapshot>;
  migrate(): Promise<void>;
  close(): Promise<void>;
}
