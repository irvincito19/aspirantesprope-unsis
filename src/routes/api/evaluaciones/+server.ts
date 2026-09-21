import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });
	const matricula = url.searchParams.get('matricula');
	if (matricula) {
		const row = client.prepare('SELECT * FROM evaluaciones WHERE docente_id = ? AND alumno_matricula = ?').get(locals.user.id, matricula) as any;
		return json({ evaluacion: row || null });
	}
	const rows = client.prepare('SELECT * FROM evaluaciones WHERE docente_id = ?').all(locals.user.id) as any[];
	return json({ evaluaciones: rows });
};
