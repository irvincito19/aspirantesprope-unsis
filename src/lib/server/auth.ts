import bcrypt from 'bcryptjs';
import { client } from './db/index.js';

export type User = {
	id: string;
	username: string;
	role: 'admin' | 'docente';
	nombreCompleto: string;
};

export async function verifyUser(username: string, password: string): Promise<User | null> {
	const normalized = username.trim().toLowerCase();
	const row = client
		.prepare('SELECT id, username, password_hash, role, nombre_completo FROM users WHERE lower(username) = ? AND activo = 1')
		.get(normalized) as any;
	if (!row) return null;
	const ok = await bcrypt.compare(password, row.password_hash);
	if (!ok) return null;
	return { id: row.id, username: row.username, role: row.role, nombreCompleto: row.nombre_completo };
}

export function createSession(userId: string): string {
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
	client.prepare('INSERT INTO sesiones (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), userId, token, expiresAt);
	return token;
}

export function validateSession(token: string): User | null {
	const row = client
		.prepare(
			`SELECT u.id, u.username, u.role, u.nombre_completo, s.expires_at
			 FROM sesiones s JOIN users u ON u.id = s.user_id
			 WHERE s.token = ?`
		)
		.get(token) as any;
	if (!row) return null;
	if (new Date(row.expires_at) < new Date()) {
		client.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
		return null;
	}
	return { id: row.id, username: row.username, role: row.role, nombreCompleto: row.nombre_completo };
}

export function deleteSession(token: string) {
	client.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
}

export function getUserById(id: string) {
	return client.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}
