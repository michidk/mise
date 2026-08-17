import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/room-api/internal/schema.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
});
