import type { Router } from 'express';
import { PostgresRoomStore } from './internal/postgres-store.js';
import { buildRoomRouter } from './internal/router.js';
import { RoomService } from './internal/service.js';
import type { RoomStore } from './internal/types.js';

export interface RoomApi {
  router: Router;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export function createRoomApi(options: { databaseUrl: string; maximumParticipants: number }): RoomApi {
  const store: RoomStore = new PostgresRoomStore(options.databaseUrl);
  const service = new RoomService(store, options.maximumParticipants);
  return {
    router: buildRoomRouter(service),
    migrate: () => store.migrate(),
    close: () => store.close(),
  };
}
