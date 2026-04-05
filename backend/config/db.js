import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

// Forzar conexión IPv4
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  port: 5432,   // puerto de Postgres
  family: 4     // 👈 fuerza IPv4
});