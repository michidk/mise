import { createRoomApi } from '../src/room-api/index.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run database migrations.');

const roomApi = createRoomApi({ databaseUrl, maximumParticipants: 20 });
try {
  await roomApi.migrate();
  console.log('Room database schema is up to date.');
} finally {
  await roomApi.close();
}
