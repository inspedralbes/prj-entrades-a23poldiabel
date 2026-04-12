import pg from 'pg';

const { Pool } = pg;

let pool = null;

function createPool() {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'entrades',
    user: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export async function connectDatabase() {
  if (!pool) {
    pool = createPool();
  }

  await pool.query('SELECT 1');
  console.log('[sockets] PostgreSQL connectat correctament');
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}
