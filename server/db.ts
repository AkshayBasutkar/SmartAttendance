import 'dotenv/config';
import * as schema from "@shared/schema";
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeonServerless } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if it's a local database or Neon serverless database
const databaseUrl = process.env.DATABASE_URL;
const isLocalDatabase = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') || databaseUrl.includes('5432');

let db: ReturnType<typeof drizzleNodePostgres> | ReturnType<typeof drizzleNeonServerless>;
let pool: PgPool | NeonPool;

if (isLocalDatabase) {
  // Use standard PostgreSQL driver for local databases
  pool = new PgPool({ connectionString: databaseUrl });
  db = drizzleNodePostgres({ client: pool, schema });
} else {
  // Use Neon serverless driver for remote databases
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeonServerless({ client: pool, schema });
}

export { pool, db };
