import path from 'node:path';
import { and, eq, exists, gt, gte, isNull, lt, or, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import type { SignalEnvelope, SignalKind } from '../../signaling/index.js';
import { roomParticipants, rooms, roomSignals } from './schema.js';
import type { JoinStoreResult, RoomStore, StoredParticipant, StoredRoom } from './types.js';

const PARTICIPANT_STALE_MS = 60_000;
const SIGNAL_TTL_MS = 2 * 60_000;
const RETENTION_MS = 60 * 60_000;

type RoomDatabase = NodePgDatabase<{
  rooms: typeof rooms;
  roomParticipants: typeof roomParticipants;
  roomSignals: typeof roomSignals;
}>;

export class PostgresRoomStore implements RoomStore {
  private readonly pool: Pool;
  private readonly database: RoomDatabase;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString: secureConnectionString(connectionString), max: 5, idleTimeoutMillis: 10_000 });
    this.database = drizzle(this.pool, { schema: { rooms, roomParticipants, roomSignals } });
  }

  async migrate() {
    await migrate(this.database, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
  }

  async createRoom(room: StoredRoom, host: StoredParticipant) {
    const now = Date.now();
    await this.database.transaction(async (transaction) => {
      await transaction.delete(roomSignals).where(lt(roomSignals.expiresAt, new Date(now)));
      await transaction.delete(rooms).where(or(
        lt(rooms.expiresAt, new Date(now - RETENTION_MS)),
        lt(rooms.closedAt, new Date(now - RETENTION_MS)),
      ));
      await transaction.insert(rooms).values({
        id: room.id,
        hostId: room.hostId,
        passwordHash: room.passwordHash,
        maxParticipants: room.maxParticipants,
        expiresAt: new Date(room.expiresAt),
      });
      await insertParticipant(transaction, host);
    });
  }

  async getRoom(roomId: string) {
    const [room] = await this.database.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    return room ? mapRoom(room) : undefined;
  }

  async joinRoom(roomId: string, participant: StoredParticipant, now: number): Promise<JoinStoreResult> {
    return this.database.transaction(async (transaction) => {
      const [room] = await transaction
        .select({ maxParticipants: rooms.maxParticipants })
        .from(rooms)
        .where(and(eq(rooms.id, roomId), isNull(rooms.closedAt), gt(rooms.expiresAt, new Date(now))))
        .for('update');
      if (!room) return { status: 'unavailable' };

      await transaction.delete(roomParticipants).where(and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.isHost, false),
        lt(roomParticipants.lastSeenAt, new Date(now - PARTICIPANT_STALE_MS)),
      ));
      const members = await transaction
        .select()
        .from(roomParticipants)
        .where(eq(roomParticipants.roomId, roomId))
        .orderBy(roomParticipants.joinedAt);
      if (members.length >= room.maxParticipants) return { status: 'full' };

      const guestNumber = members.filter((member) => !member.isHost).length + 1;
      await insertParticipant(transaction, { ...participant, name: `Guest ${guestNumber}` });
      return { status: 'joined', participants: members.map(mapParticipant) };
    });
  }

  async authenticate(roomId: string, participantId: string, expectedTokenHash: string, now: number) {
    const [participant] = await this.database
      .select({ participant: roomParticipants })
      .from(roomParticipants)
      .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
      .where(and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.id, participantId),
        eq(roomParticipants.tokenHash, expectedTokenHash),
        gte(roomParticipants.lastSeenAt, new Date(now - PARTICIPANT_STALE_MS)),
        isNull(rooms.closedAt),
        gt(rooms.expiresAt, new Date(now)),
      ))
      .limit(1);
    return participant ? mapParticipant(participant.participant) : undefined;
  }

  async heartbeat(roomId: string, participantId: string, expectedTokenHash: string, now: number, roomExpiresAt: number) {
    return this.database.transaction(async (transaction) => {
      const activeRoom = transaction
        .select({ id: rooms.id })
        .from(rooms)
        .where(and(
          eq(rooms.id, roomParticipants.roomId),
          isNull(rooms.closedAt),
          gt(rooms.expiresAt, new Date(now)),
        ));
      const [participant] = await transaction
        .update(roomParticipants)
        .set({ lastSeenAt: new Date(now) })
        .where(and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.id, participantId),
          eq(roomParticipants.tokenHash, expectedTokenHash),
          gte(roomParticipants.lastSeenAt, new Date(now - PARTICIPANT_STALE_MS)),
          exists(activeRoom),
        ))
        .returning({ isHost: roomParticipants.isHost });
      if (!participant) return false;
      if (participant.isHost) {
        await transaction.update(rooms)
          .set({ expiresAt: new Date(roomExpiresAt) })
          .where(and(eq(rooms.id, roomId), isNull(rooms.closedAt)));
      }
      return true;
    });
  }

  async leaveRoom(roomId: string, participantId: string, expectedTokenHash: string) {
    const deleted = await this.database.delete(roomParticipants).where(and(
      eq(roomParticipants.roomId, roomId),
      eq(roomParticipants.id, participantId),
      eq(roomParticipants.tokenHash, expectedTokenHash),
      eq(roomParticipants.isHost, false),
    )).returning({ id: roomParticipants.id });
    return deleted.length === 1;
  }

  async closeRoom(roomId: string, participantId: string, expectedTokenHash: string) {
    const hostExists = this.database.select({ id: roomParticipants.id }).from(roomParticipants).where(and(
      eq(roomParticipants.roomId, rooms.id),
      eq(roomParticipants.id, participantId),
      eq(roomParticipants.tokenHash, expectedTokenHash),
      eq(roomParticipants.isHost, true),
      eq(rooms.hostId, roomParticipants.id),
    ));
    const closed = await this.database.update(rooms)
      .set({ closedAt: new Date() })
      .where(and(eq(rooms.id, roomId), isNull(rooms.closedAt), exists(hostExists)))
      .returning({ id: rooms.id });
    return closed.length === 1;
  }

  async appendSignal(input: {
    roomId: string;
    senderId: string;
    recipientId: string;
    kind: SignalKind;
    payload: unknown;
    now: number;
  }) {
    const result = await this.database.execute(sql`
      insert into ${roomSignals} (
        room_id, sender_id, recipient_id, kind, payload, expires_at
      )
      select ${input.roomId}, ${input.senderId}, ${input.recipientId}, ${input.kind},
        ${JSON.stringify(input.payload)}::jsonb, ${new Date(input.now + SIGNAL_TTL_MS)}
      where exists (
        select 1 from ${roomParticipants}
        where ${roomParticipants.roomId} = ${input.roomId} and ${roomParticipants.id} = ${input.senderId}
      ) and exists (
        select 1 from ${roomParticipants}
        where ${roomParticipants.roomId} = ${input.roomId} and ${roomParticipants.id} = ${input.recipientId}
      )
    `);
    return result.rowCount === 1;
  }

  async readSignals(roomId: string, participantId: string, after: number, now: number) {
    const signals = await this.database.select().from(roomSignals).where(and(
      eq(roomSignals.roomId, roomId),
      eq(roomSignals.recipientId, participantId),
      gt(roomSignals.id, after),
      gt(roomSignals.expiresAt, new Date(now)),
    )).orderBy(roomSignals.id).limit(100);
    return signals.map((signal): SignalEnvelope => ({
      id: signal.id,
      senderId: signal.senderId,
      recipientId: signal.recipientId,
      kind: signal.kind,
      payload: signal.payload,
    }));
  }

  async close() {
    await this.pool.end();
  }
}

type RoomTransaction = Parameters<Parameters<RoomDatabase['transaction']>[0]>[0];

async function insertParticipant(transaction: RoomTransaction, participant: StoredParticipant) {
  await transaction.insert(roomParticipants).values({
    id: participant.id,
    roomId: participant.roomId,
    name: participant.name,
    tokenHash: participant.tokenHash,
    isHost: participant.isHost,
    lastSeenAt: new Date(participant.lastSeenAt),
  });
}

function mapRoom(room: typeof rooms.$inferSelect): StoredRoom {
  return {
    id: room.id,
    hostId: room.hostId,
    passwordHash: room.passwordHash,
    maxParticipants: room.maxParticipants,
    expiresAt: room.expiresAt.getTime(),
    closed: room.closedAt !== null,
  };
}

function mapParticipant(participant: typeof roomParticipants.$inferSelect): StoredParticipant {
  return {
    id: participant.id,
    roomId: participant.roomId,
    name: participant.name,
    tokenHash: participant.tokenHash,
    isHost: participant.isHost,
    lastSeenAt: participant.lastSeenAt.getTime(),
  };
}

function secureConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  if (url.searchParams.get('sslmode') === 'require') url.searchParams.set('sslmode', 'verify-full');
  return url.toString();
}
