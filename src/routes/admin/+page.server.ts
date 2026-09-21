import { redirect } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role !== 'admin') throw redirect(303, '/evaluar');

	const alumnos = client.prepare('SELECT * FROM alumnos ORDER BY matricula').all() as any[];
	const users = client.prepare('SELECT id, username, nombre_completo, role FROM users ORDER BY role, username').all() as any[];
	const evaluaciones = client
		.prepare(
			`SELECT e.*, u.username, u.nombre_completo as docente_nombre, a.nombre as alumno_nombre
			 FROM evaluaciones e
			 JOIN users u ON u.id = e.docente_id
			 JOIN alumnos a ON a.matricula = e.alumno_matricula
			 ORDER BY e.updated_at DESC LIMIT 200`
		)
		.all() as any[];

	const totalAlumnos = alumnos.length;
	const totalDocentes = users.filter((u) => u.role === 'docente').length;
	const totalEvals = client.prepare('SELECT COUNT(*) as c FROM evaluaciones').get() as any;

	return { alumnos, users, evaluaciones, stats: { totalAlumnos, totalDocentes, totalEvals: totalEvals.c } };
};
