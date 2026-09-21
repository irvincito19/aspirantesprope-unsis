import { redirect } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');

	const q = url.searchParams.get('q')?.toLowerCase() || '';

	let alumnos = client.prepare('SELECT * FROM alumnos WHERE activo = 1 ORDER BY nombre').all() as any[];

	if (q) {
		alumnos = alumnos.filter(
			(a) => a.matricula.toLowerCase().includes(q) || a.nombre.toLowerCase().includes(q)
		);
	}

	// evaluaciones del docente actual
	const evals = client
		.prepare('SELECT alumno_matricula FROM evaluaciones WHERE docente_id = ?')
		.all(locals.user.id) as any[];
	const evaluados = new Set(evals.map((e) => e.alumno_matricula));

	return { alumnos, evaluados: Array.from(evaluados), user: locals.user };
};
