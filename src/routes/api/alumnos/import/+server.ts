import { json } from '@sveltejs/kit';
import { client } from '$lib/server/db/index.js';
import type { RequestHandler } from './$types';

function parseCSV(text: string): Array<{ matricula: string; nombre: string }> {
	const lines = text.split(/\r?\n/).filter((l) => l.trim());
	if (lines.length === 0) return [];
	let start = 0;
	if (lines[0].toLowerCase().includes('matricula')) start = 1;
	const out = [];
	for (let i = start; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		// split por primera coma
		const idx = line.indexOf(',');
		if (idx === -1) continue;
		const mat = line.slice(0, idx).trim().replace(/^"|"$/g, '');
		const nombre = line.slice(idx + 1).trim().replace(/^"|"$/g, '').toUpperCase();
		if (mat && nombre) out.push({ matricula: mat, nombre });
	}
	return out;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'No autenticado' }, { status: 401 });
	if (locals.user.role !== 'admin') return json({ error: 'Solo admin' }, { status: 403 });

	let alumnos: Array<{ matricula: string; nombre: string }> = [];
	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('application/json')) {
		const body = await request.json();
		alumnos = body.alumnos || [];
	} else {
		const form = await request.formData();
		const file = form.get('file') as File | null;
		if (!file) return json({ error: 'Falta archivo' }, { status: 400 });
		const text = await file.text();
		alumnos = parseCSV(text);
	}

	if (alumnos.length === 0) return json({ error: 'CSV vacío o sin alumnos' }, { status: 400 });

	let sfCounter = (client.prepare("SELECT COUNT(*) as c FROM alumnos WHERE matricula LIKE 'SF-%'").get() as any).c as number;
	const inserted: string[] = [];
	const errors: string[] = [];

	for (const a of alumnos) {
		let mat = a.matricula.trim();
		const nombre = a.nombre.trim().toUpperCase();
		if (!mat || !nombre) {
			errors.push(`Fila incompleta: ${mat},${nombre}`);
			continue;
		}
		let matOriginal: string | null = null;
		if (mat.toLowerCase() === 'sin ficha' || mat === '' ) {
			sfCounter += 1;
			matOriginal = 'Sin ficha';
			mat = `SF-${String(sfCounter).padStart(3, '0')}`;
		}
		try {
			client
				.prepare(
					`INSERT OR REPLACE INTO alumnos (matricula, nombre, apellidos, grupo, activo, matricula_original) VALUES (?, ?, '', 'propedéutico-2026', 1, ?)`
				)
				.run(mat, nombre, matOriginal);
			inserted.push(mat);
		} catch (e: any) {
			errors.push(`${mat}: ${e.message}`);
		}
	}

	return json({ ok: true, inserted: inserted.length, matriculas: inserted, errors });
};
