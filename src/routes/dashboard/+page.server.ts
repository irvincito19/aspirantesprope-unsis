import { client } from '$lib/server/db/index.js';
import type { PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	const share = url.searchParams.get('share');

	// Solo admin puede ver dashboard; share token permite acceso sin login para dirección
	if (!share) {
		if (!locals.user) throw redirect(303, '/login');
		if (locals.user.role !== 'admin') throw redirect(303, '/evaluar');
	}

	// Query filtros
	const docente = url.searchParams.get('docente') || '';
	const alumno = url.searchParams.get('alumno') || '';

	let evaluaciones: any[] = client
		.prepare(
			`SELECT e.*, u.username, u.nombre_completo as docente_nombre, a.nombre as alumno_nombre, a.matricula
			 FROM evaluaciones e
			 JOIN users u ON u.id = e.docente_id
			 JOIN alumnos a ON a.matricula = e.alumno_matricula
			 ORDER BY e.updated_at DESC`
		)
		.all() as any[];

	if (docente) evaluaciones = evaluaciones.filter((e) => e.username === docente || e.docente_nombre.includes(docente));
	if (alumno) evaluaciones = evaluaciones.filter((e) => e.alumno_nombre.includes(alumno.toUpperCase()) || e.matricula.includes(alumno));

	// KPIs
	const total = evaluaciones.length;
	const avg = (field: string) => (total ? (evaluaciones.reduce((s, e) => s + e[field], 0) / total).toFixed(2) : '0');
	const kpis = {
		promedioGeneral: total ? (evaluaciones.reduce((s, e) => s + (e.asistencia_puntualidad + e.participacion_compromiso + e.responsabilidad_cumplimiento + e.disciplina_normas + e.respeto_convivencia + e.trabajo_colaborativo + e.comunicacion_expresion + e.actitud_motivacion) / 8, 0) / total).toFixed(2) : '0',
		asistencia: avg('asistencia_puntualidad'),
		participacion: avg('participacion_compromiso'),
		responsabilidad: avg('responsabilidad_cumplimiento'),
		disciplina: avg('disciplina_normas'),
		respeto: avg('respeto_convivencia'),
		colaborativo: avg('trabajo_colaborativo'),
		comunicacion: avg('comunicacion_expresion'),
		actitud: avg('actitud_motivacion'),
		dimensionA: total ? ((Number(avg('asistencia_puntualidad')) + Number(avg('participacion_compromiso')) + Number(avg('responsabilidad_cumplimiento'))) / 3).toFixed(2) : '0',
		dimensionB: total ? ((Number(avg('disciplina_normas')) + Number(avg('respeto_convivencia')) + Number(avg('trabajo_colaborativo'))) / 3).toFixed(2) : '0',
		dimensionC: total ? ((Number(avg('comunicacion_expresion')) + Number(avg('actitud_motivacion'))) / 2).toFixed(2) : '0'
	};

	// Agregar promedio y alerta por fila
	const rows = evaluaciones.map((e) => {
		const prom = (e.asistencia_puntualidad + e.participacion_compromiso + e.responsabilidad_cumplimiento + e.disciplina_normas + e.respeto_convivencia + e.trabajo_colaborativo + e.comunicacion_expresion + e.actitud_motivacion) / 8;
		const alerta = prom < 3 || [e.asistencia_puntualidad, e.participacion_compromiso, e.responsabilidad_cumplimiento, e.disciplina_normas, e.respeto_convivencia, e.trabajo_colaborativo, e.comunicacion_expresion, e.actitud_motivacion].some((v) => v === 1);
		return { ...e, promedio: prom.toFixed(1), alerta };
	});

	const docentes = client.prepare("SELECT username, nombre_completo FROM users WHERE role='docente' ORDER BY username").all() as any[];
	const alumnos = client.prepare('SELECT matricula, nombre FROM alumnos ORDER BY nombre').all() as any[];

	// alumnos en alerta
	const alertaAlumnos = rows.filter((r) => r.alerta);

	return { rows, kpis, docentes, alumnos, total, alertaCount: alertaAlumnos.length, user: locals.user, share };
};
