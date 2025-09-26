import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema'; // keep this if you have your Drizzle schema

// Setup WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Make sure DATABASE_URL exists
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set. Check your .env file.');
  process.exit(1); // exit instead of throwing, safer in dev
}

// Create pool and Drizzle client
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

console.log('Connected to database:', databaseUrl.split('@')[1]); // hide credentials
