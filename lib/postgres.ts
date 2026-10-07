import 'server-only';
import { Pool } from 'pg';

const globalForPostgres = globalThis as typeof globalThis & {
  inpticPostgresPool?: Pool;
};

export function getPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be configured to use the LWS PostgreSQL database.');
  }

  globalForPostgres.inpticPostgresPool ??= new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return globalForPostgres.inpticPostgresPool;
}
