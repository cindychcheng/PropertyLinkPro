// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL && process.env.USE_MEMORY_STORAGE !== 'true') {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use a dummy connection string if using memory storage
const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

// Configure SSL for Railway's PostgreSQL
const poolConfig = {
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });
