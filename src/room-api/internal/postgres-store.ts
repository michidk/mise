import { Pool, type PoolClient } from 'pg';
import type { SignalEnvelope, SignalKind } from '../../signaling/index.js';
import type { JoinStoreResult, RoomStore, StoredParticipant, StoredRoom } from './types.js';

const PARTICIPANT_STALE_MS = 60_000;

export class PostgresRoomStore implements RoomStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
  }

  async migrate() {
    await this.pool.query(SCHEMA_SQL);
  }

  async createRoom(room: StoredRoom, host: StoredParticipant) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM room_signals WHERE expires_at < now()`);
      await client.query(
        `DELETE FROM rooms
         WHERE expires_at < now() - interval '1 hour'
            OR closed_at < now() - interval '1 hour'`,
      );
      await client.query(
        `INSERT INTO rooms (id, host_id, password_hash, max_participants, expires_at)
         VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))`,
        [room.id, room.hostId, room.passwordHash, room.maxParticipants, room.expiresAt],
      );
      await insertParticipant(client, host);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRoom(roomId: string) {
    const result = await this.pool.query(
      `SELECT id, host_id, password_hash, max_participants,
              extract(epoch from expires_at) * 1000 AS expires_at,
              closed_at IS NOT NULL AS closed
       FROM rooms WHERE id = $1`,
      [roomId],
    );
    return result.rows[0] ? mapRoom(result.rows[0]) : undefined;
  }

  async joinRoom(roomId: string, participant: StoredParticipant, now: number): Promise<JoinStoreResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const roomResult = await client.query(
        `SELECT max_participants FROM rooms
         WHERE id = $1 AND closed_at IS NULL AND expires_at > to_timestamp($2 / 1000.0)
         FOR UPDATE`,
        [roomId, now],
      );
      if (!roomResult.rows[0]) {
        await client.query('ROLLBACK');
        return { status: 'unavailable' };
      }
      await client.query(
        `DELETE FROM room_participants
         WHERE room_id = $1 AND is_host = false AND last_seen_at < to_timestamp($2 / 1000.0)`,
        [roomId, now - PARTICIPANT_STALE_MS],
      );
      const participantResult = await client.query(
        `SELECT id, room_id, name, token_hash, is_host,
                extract(epoch from last_seen_at) * 1000 AS last_seen_at
         FROM room_participants WHERE room_id = $1 ORDER BY joined_at`,
        [roomId],
      );
      if (participantResult.rowCount! >= Number(roomResult.rows[0].max_participants)) {
        await client.query('ROLLBACK');
        return { status: 'full' };
      }
      await insertParticipant(client, participant);
      await client.query('COMMIT');
      return { status: 'joined', participants: participantResult.rows.map(mapParticipant) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async authenticate(roomId: string, participantId: string, expectedTokenHash: string, now: number) {
    const result = await this.pool.query(
      `SELECT p.id, p.room_id, p.name, p.token_hash, p.is_host,
              extract(epoch from p.last_seen_at) * 1000 AS last_seen_at
       FROM room_participants p
       JOIN rooms r ON r.id = p.room_id
       WHERE p.room_id = $1 AND p.id = $2 AND p.token_hash = $3
         AND p.last_seen_at >= to_timestamp($4 / 1000.0)
         AND r.closed_at IS NULL AND r.expires_at > to_timestamp($5 / 1000.0)`,
      [roomId, participantId, expectedTokenHash, now - PARTICIPANT_STALE_MS, now],
    );
    return result.rows[0] ? mapParticipant(result.rows[0]) : undefined;
  }

  async heartbeat(roomId: string, participantId: string, expectedTokenHash: string, now: number, roomExpiresAt: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE room_participants p SET last_seen_at = to_timestamp($4 / 1000.0)
         FROM rooms r
         WHERE p.room_id = $1 AND p.id = $2 AND p.token_hash = $3
           AND r.id = p.room_id AND r.closed_at IS NULL
           AND r.expires_at > to_timestamp($4 / 1000.0)
           AND p.last_seen_at >= to_timestamp($5 / 1000.0)
         RETURNING p.is_host`,
        [roomId, participantId, expectedTokenHash, now, now - PARTICIPANT_STALE_MS],
      );
      if (!result.rows[0]) {
        await client.query('ROLLBACK');
        return false;
      }
      if (result.rows[0].is_host) {
        await client.query(
          `UPDATE rooms SET expires_at = to_timestamp($2 / 1000.0)
           WHERE id = $1 AND closed_at IS NULL`,
          [roomId, roomExpiresAt],
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async leaveRoom(roomId: string, participantId: string, expectedTokenHash: string) {
    const result = await this.pool.query(
      `DELETE FROM room_participants
       WHERE room_id = $1 AND id = $2 AND token_hash = $3 AND is_host = false`,
      [roomId, participantId, expectedTokenHash],
    );
    return result.rowCount === 1;
  }

  async closeRoom(roomId: string, participantId: string, expectedTokenHash: string) {
    const result = await this.pool.query(
      `UPDATE rooms r SET closed_at = now()
       FROM room_participants p
       WHERE r.id = $1 AND p.room_id = r.id AND p.id = $2 AND p.token_hash = $3
         AND p.is_host = true AND r.host_id = p.id AND r.closed_at IS NULL`,
      [roomId, participantId, expectedTokenHash],
    );
    return result.rowCount === 1;
  }

  async appendSignal(input: {
    roomId: string;
    senderId: string;
    recipientId: string;
    kind: SignalKind;
    payload: unknown;
    now: number;
  }) {
    const result = await this.pool.query(
      `INSERT INTO room_signals (room_id, sender_id, recipient_id, kind, payload, expires_at)
       SELECT $1, $2, $3, $4, $5::jsonb, to_timestamp($6 / 1000.0) + interval '2 minutes'
       WHERE EXISTS (SELECT 1 FROM room_participants WHERE room_id = $1 AND id = $2)
         AND EXISTS (SELECT 1 FROM room_participants WHERE room_id = $1 AND id = $3)`,
      [input.roomId, input.senderId, input.recipientId, input.kind, JSON.stringify(input.payload), input.now],
    );
    return result.rowCount === 1;
  }

  async readSignals(roomId: string, participantId: string, after: number, now: number) {
    const result = await this.pool.query(
      `SELECT id, sender_id, recipient_id, kind, payload
       FROM room_signals
       WHERE room_id = $1 AND recipient_id = $2 AND id > $3
         AND expires_at > to_timestamp($4 / 1000.0)
       ORDER BY id LIMIT 100`,
      [roomId, participantId, after, now],
    );
    return result.rows.map((row): SignalEnvelope => ({
      id: Number(row.id),
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      kind: row.kind,
      payload: row.payload,
    }));
  }

  async close() {
    await this.pool.end();
  }
}

async function insertParticipant(client: PoolClient, participant: StoredParticipant) {
  await client.query(
    `INSERT INTO room_participants (id, room_id, name, token_hash, is_host, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))`,
    [participant.id, participant.roomId, participant.name, participant.tokenHash, participant.isHost, participant.lastSeenAt],
  );
}

function mapRoom(row: Record<string, unknown>): StoredRoom {
  return {
    id: String(row.id),
    hostId: String(row.host_id),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    maxParticipants: Number(row.max_participants),
    expiresAt: Number(row.expires_at),
    closed: Boolean(row.closed),
  };
}

function mapParticipant(row: Record<string, unknown>): StoredParticipant {
  return {
    id: String(row.id),
    roomId: String(row.room_id),
    name: String(row.name),
    tokenHash: String(row.token_hash),
    isHost: Boolean(row.is_host),
    lastSeenAt: Number(row.last_seen_at),
  };
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  host_id text NOT NULL,
  password_hash text,
  max_participants smallint NOT NULL CHECK (max_participants BETWEEN 2 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  closed_at timestamptz
);
CREATE TABLE IF NOT EXISTS room_participants (
  id text NOT NULL,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL,
  PRIMARY KEY (room_id, id)
);
CREATE INDEX IF NOT EXISTS room_participants_presence_idx
  ON room_participants (room_id, last_seen_at);
CREATE TABLE IF NOT EXISTS room_signals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  recipient_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('description', 'candidate')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS room_signals_recipient_idx
  ON room_signals (room_id, recipient_id, id);
`;
