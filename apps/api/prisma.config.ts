import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// The workspace root .env holds the connection strings for local development.
config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations run with the read/write role; the app itself connects via driver adapters.
    url: process.env.DATABASE_URL ?? '',
  },
});
