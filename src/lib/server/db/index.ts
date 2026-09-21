import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'data/app.db';

const client = new Database(databaseUrl);

export const db = drizzle(client, { schema });
export { client };
