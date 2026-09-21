import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Solo admin' }, { status: 403 });
	}
	const body = await request.json();
	const username = String(body.username || '').trim().toLowerCase();
	const newPassword = String(body.newPassword || '');

	if (!username || !newPassword) return json({ error: 'Faltan datos' }, { status: 400 });
	if (newPassword.length < 6) return json({ error: 'Contraseña mínimo 6 caracteres' }, { status: 400 });

	// No se devuelve ni se lee el hash viejo — solo se sobrescribe
	const hash = await bcrypt.hash(newPassword, 10);
	const res = client.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
	if (res.changes === 0) return json({ error: 'Usuario no encontrado' }, { status: 404 });

	return json({ ok: true, username });
};
