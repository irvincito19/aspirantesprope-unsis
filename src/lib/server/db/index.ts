import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import fs from 'node:fs';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL || 'data/app.db';

// Crear directorio si no existe — evita fallo en build (postbuild analyse importa db)
try {
	const dir = path.dirname(databaseUrl);
	if (dir && dir !== '.' && !fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
} catch {}

const client = new Database(databaseUrl);

export const db = drizzle(client, { schema });
export { client };
