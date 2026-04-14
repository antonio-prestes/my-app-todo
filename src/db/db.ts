import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern to prevent connection exhaustion during hot reloads in development
// This is the standard way to handle Drizzle/Prisma in Next.js
const globalForDb = global as unknown as {
  client: postgres.Sql | undefined;
};

const client =
  globalForDb.client ??
  postgres(connectionString, { 
    prepare: false,
    max: 1, // Limit to 1 connection per instance to save Supabase slots
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle(client, { schema });
