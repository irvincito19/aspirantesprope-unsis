import { redirect, error } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');
	const alumno = client.prepare('SELECT * FROM alumnos WHERE matricula = ?').get(params.matricula) as any;
	if (!alumno) throw error(404, 'Alumno no encontrado');
	const existing = client
		.prepare('SELECT * FROM evaluaciones WHERE docente_id = ? AND alumno_matricula = ?')
		.get(locals.user.id, params.matricula) as any;
	return { alumno, existing, user: locals.user };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(303, '/login');
		const data = await request.formData();
		const toInt = (k: string) => {
			const v = Number(data.get(k));
			if (v < 1 || v > 5) throw error(400, `${k} debe ser 1-5`);
			return v;
		};
		const vars = {
			asistenciaPuntualidad: toInt('asistencia_puntualidad'),
			participacionCompromiso: toInt('participacion_compromiso'),
			responsabilidadCumplimiento: toInt('responsabilidad_cumplimiento'),
			disciplinaNormas: toInt('disciplina_normas'),
			respetoConvivencia: toInt('respeto_convivencia'),
			trabajoColaborativo: toInt('trabajo_colaborativo'),
			comunicacionExpresion: toInt('comunicacion_expresion'),
			actitudMotivacion: toInt('actitud_motivacion')
		};
		const observaciones = String(data.get('observaciones') || '').slice(0, 500);

		const existing = client
			.prepare('SELECT id FROM evaluaciones WHERE docente_id = ? AND alumno_matricula = ?')
			.get(locals.user.id, params.matricula) as any;

		if (existing) {
			client
				.prepare(
					`UPDATE evaluaciones SET asistencia_puntualidad=?, participacion_compromiso=?, responsabilidad_cumplimiento=?, disciplina_normas=?, respeto_convivencia=?, trabajo_colaborativo=?, comunicacion_expresion=?, actitud_motivacion=?, observaciones=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
				)
				.run(
					vars.asistenciaPuntualidad,
					vars.participacionCompromiso,
					vars.responsabilidadCumplimiento,
					vars.disciplinaNormas,
					vars.respetoConvivencia,
					vars.trabajoColaborativo,
					vars.comunicacionExpresion,
					vars.actitudMotivacion,
					observaciones,
					existing.id
				);
		} else {
			client
				.prepare(
					`INSERT INTO evaluaciones (id, docente_id, alumno_matricula, asistencia_puntualidad, participacion_compromiso, responsabilidad_cumplimiento, disciplina_normas, respeto_convivencia, trabajo_colaborativo, comunicacion_expresion, actitud_motivacion, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.run(
					crypto.randomUUID(),
					locals.user.id,
					params.matricula,
					vars.asistenciaPuntualidad,
					vars.participacionCompromiso,
					vars.responsabilidadCumplimiento,
					vars.disciplinaNormas,
					vars.respetoConvivencia,
					vars.trabajoColaborativo,
					vars.comunicacionExpresion,
					vars.actitudMotivacion,
					observaciones
				);
		}

		throw redirect(303, '/evaluar');
	}
};
