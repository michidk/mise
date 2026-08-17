import type { Router } from 'express';
import { MemoryRoomStore } from './internal/memory-store.js';
import { PostgresRoomStore } from './internal/postgres-store.js';
import { buildRoomRouter } from './internal/router.js';
import { RoomService } from './internal/service.js';
import type { RoomStore } from './internal/types.js';

export interface RoomApi {
  router: Router;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export function createRoomApi(options: { databaseUrl?: string; maximumParticipants: number }): RoomApi {
  const store: RoomStore = options.databaseUrl
    ? new PostgresRoomStore(options.databaseUrl)
    : new MemoryRoomStore();
  const service = new RoomService(store, options.maximumParticipants);
  return {
    router: buildRoomRouter(service),
    migrate: async () => store.migrate?.(),
    close: async () => store.close?.(),
  };
}
