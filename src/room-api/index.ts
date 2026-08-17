import type { Router } from 'express';
import { PostgresRoomStore } from './internal/postgres-store.js';
import { buildRoomRouter } from './internal/router.js';
import { RoomService } from './internal/service.js';
import type { AdminDatabaseSnapshot, RoomStore } from './internal/types.js';

export type { AdminDatabaseSnapshot } from './internal/types.js';

export interface RoomApi {
  router: Router;
  adminSnapshot(): Promise<AdminDatabaseSnapshot>;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export function createRoomApi(options: { databaseUrl: string; maximumParticipants: number }): RoomApi {
  const store: RoomStore = new PostgresRoomStore(options.databaseUrl);
  const service = new RoomService(store, options.maximumParticipants);
  return {
    router: buildRoomRouter(service),
    adminSnapshot: () => store.adminSnapshot(),
    migrate: () => store.migrate(),
    close: () => store.close(),
  };
}
