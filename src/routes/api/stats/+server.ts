import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user && !url.searchParams.has('share')) return json({ error: 'No autenticado' }, { status: 401 });
	if (locals.user && locals.user.role !== 'admin' && !url.searchParams.has('share')) return json({ error: 'Solo admin puede ver reportes' }, { status: 403 });
	const totalAlumnos = (client.prepare('SELECT COUNT(*) as c FROM alumnos').get() as any).c;
	const totalEvals = (client.prepare('SELECT COUNT(*) as c FROM evaluaciones').get() as any).c;
	const misEvals = (client.prepare('SELECT COUNT(*) as c FROM evaluaciones WHERE docente_id = ?').get(locals.user.id) as any).c;
	return json({ totalAlumnos, totalEvals, misEvals });
};
