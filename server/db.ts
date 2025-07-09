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
let connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

// Fix SSL issues for Railway by appending SSL parameters
if (process.env.NODE_ENV === 'production' && connectionString.includes('railway')) {
  // Add SSL parameters to bypass certificate validation
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString = `${connectionString}${separator}sslmode=require&sslcert=&sslkey=&sslrootcert=`;
}

console.log("Database connection string configured for:", process.env.NODE_ENV);

export const pool = new Pool({ 
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    require: true
  } : false
});
export const db = drizzle({ client: pool, schema });
