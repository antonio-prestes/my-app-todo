import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// We use the postgres package for DB pooling connection under serverless.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
