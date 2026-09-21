import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL || 'data/app.db';
const client = new Database(databaseUrl);
const db = drizzle(client, { schema });

async function main() {
	console.log('🌱 Seeding DB:', databaseUrl);

	// Crear tablas si no existen (fallback si no se usó drizzle-kit push)
	client.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'docente',
			nombre_completo TEXT NOT NULL,
			activo INTEGER NOT NULL DEFAULT 1,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS alumnos (
			matricula TEXT PRIMARY KEY,
			nombre TEXT NOT NULL,
			apellidos TEXT NOT NULL DEFAULT '',
			grupo TEXT NOT NULL DEFAULT 'propedéutico-2026',
			activo INTEGER NOT NULL DEFAULT 1,
			matricula_original TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS evaluaciones (
			id TEXT PRIMARY KEY,
			docente_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			alumno_matricula TEXT NOT NULL REFERENCES alumnos(matricula) ON DELETE CASCADE,
			asistencia_puntualidad INTEGER NOT NULL,
			participacion_compromiso INTEGER NOT NULL,
			responsabilidad_cumplimiento INTEGER NOT NULL,
			disciplina_normas INTEGER NOT NULL,
			respeto_convivencia INTEGER NOT NULL,
			trabajo_colaborativo INTEGER NOT NULL,
			comunicacion_expresion INTEGER NOT NULL,
			actitud_motivacion INTEGER NOT NULL,
			observaciones TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(docente_id, alumno_matricula)
		);
		CREATE TABLE IF NOT EXISTS sesiones (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token TEXT NOT NULL UNIQUE,
			expires_at TEXT NOT NULL
		);
	`);

	const docentes = [
		{ username: 'admin', password: 'admin123', nombre: 'M.T.I.E. Irving Ulises Hernández Miguel', role: 'admin' as const },
		{ username: 'lirio.ruiz', password: 'Lirio2026*', nombre: 'M.C.C. Lirio Ruíz Guerra', role: 'docente' as const },
		{ username: 'monica.perez', password: 'Monica2026*', nombre: 'M.C. Mónica Pérez Meza', role: 'docente' as const },
		{ username: 'alberto.cruz', password: 'Alberto2026*', nombre: 'M.C.A.C. José Alberto Cruz Tolentino', role: 'docente' as const },
		{ username: 'aidee.cruz', password: 'Aidee2026*', nombre: 'Dra. Aidee Cruz Barragán', role: 'docente' as const },
		{ username: 'arisai.barragan', password: 'Arisai2026*', nombre: 'Dr. Arisaí Darío Barragán López', role: 'docente' as const },
		{ username: 'enrique.garcia', password: 'Enrique2026*', nombre: 'M.C. Enrique García Reyes', role: 'docente' as const },
		{ username: 'oswaldo.avila', password: 'Oswaldo2026*', nombre: 'M.I.T.I. Oswaldo Rey Ávila Barrón', role: 'docente' as const },
		{ username: 'alejandro.jarillo', password: 'Alejandro2026*', nombre: 'Dr. Alejandro Jarillo Silva', role: 'docente' as const },
		{ username: 'jesus.pacheco', password: 'Jesus2026*', nombre: 'M.C.M. Jesús Pacheco Mendoza', role: 'docente' as const },
		{ username: 'amando.ruiz', password: 'Amando2026*', nombre: 'Dr. Amando Alejandro Ruiz Figueroa', role: 'docente' as const },
		{ username: 'everardo.pacheco', password: 'Everardo2026*', nombre: 'M.T.E. Everardo de Jesús Pacheco Antonio', role: 'docente' as const },
		{ username: 'jesus.ahuactzi', password: 'Ahuactzi2026*', nombre: 'Dr. Jesús Cruz Ahuactzi', role: 'docente' as const },
		{ username: 'rolando.pedro', password: 'Rolando2026*', nombre: 'M.T.C.A. Rolando Pedro Gabriel', role: 'docente' as const },
		{ username: 'eliezer.alcazar', password: 'Eliezer2026*', nombre: 'M.C.C Eliezer Álcazar Silva', role: 'docente' as const },
		{ username: 'arturo.benitez', password: 'Arturo2026*', nombre: 'Dr. Arturo Benítez Hernández', role: 'docente' as const },
		{ username: 'javier.hernandez', password: 'Javier2026*', nombre: 'Dr. José Javier Hernández Barriga', role: 'docente' as const },
		{ username: 'teresita.mijangos', password: 'Teresita2026*', nombre: 'M.C. Teresita de Jesús Mijangos Martínez', role: 'docente' as const },
		{ username: 'silviana.juarez', password: 'Silviana2026*', nombre: 'M.C.C. Silviana Juárez Chalini', role: 'docente' as const }
	];

	for (const d of docentes) {
		const hash = await bcrypt.hash(d.password, 10);
		client
			.prepare(
				`INSERT OR REPLACE INTO users (id, username, password_hash, role, nombre_completo, activo) VALUES (?, ?, ?, ?, ?, 1)`
			)
			.run(crypto.randomUUID(), d.username, hash, d.role, d.nombre);
		console.log(`  + usuario ${d.username} (${d.role})`);
	}

	// Alumnos 30
	const alumnosList: Array<[string, string]> = [
		['0673', 'ANTONIO PEREZ DULCE AMALI'],
		['3358', 'CONTRERAS ALCANTARA DAMITZA CAROLINA'],
		['1009', 'CRUZ BARCELOS ANDREA'],
		['1302', 'CRUZ MEJIA KAREN JANET'],
		['1525', 'GARCIA LUJAN NEYVER HERISEL'],
		['SF-001', 'GARCIA PACHECO ANGEL FRANCISCO'],
		['3048', 'GONZALEZ PACHECO ANGEL DAVID'],
		['2476', 'MARQUEZ GENARO FRANCISCO JAVIER'],
		['0616', 'OJEDA JESSICA LORENA'],
		['1826', 'OSORIO GASPAR KENYA JOSELIN'],
		['2227', 'RAMIREZ RAMIREZ RODRIGO GABINO'],
		['2025030110', 'REYES PACHECO VALERIA GUADALUPE'],
		['2670', 'RODRIGUEZ REYES NAOMI PAMELA'],
		['0775', 'VASQUEZ GARCIA MARCOS GAEL'],
		['1021', 'VASQUEZ LOPEZ CRISTIAN URIEL'],
		['2380', 'VASQUEZ SANCHEZ SET ELOHIM'],
		['2024030564', 'VASQUEZ FABIAN ALEXANDER INOCENTES'],
		['2668', 'BUSTAMANTE BAUTISTA XITLALI'],
		['0419', 'CRUZ NOLASCO NAYELI'],
		['1820', 'GARCIA GOMEZ GAEL'],
		['1819', 'HERNANDEZ ZUÑIGA ANGELA'],
		['0772', 'LOPEZ HERNANDEZ MELISA IRASEMA'],
		['1193', 'LOPEZ VASQUEZ VERONICA'],
		['2229', 'MARTINEZ MATIAS MARISELA'],
		['1949', 'MENDOZA MONJARAZ ROSA'],
		['3217', 'PACHECO REYES BELINDA ITZEL'],
		['1301', 'REYES RAMIREZ ALIMARI MONSERRATH'],
		['0613', 'SANTIAGO MARTNEZ BRYAN JOSUE'],
		['2856', 'SANTIAGO SANTIAGO VALERIA'],
		['2228', 'SIBAJA MARCIAL NIKOLAI']
	];

	for (const [mat, nombre] of alumnosList) {
		const partes = nombre.trim().split(/\s+/);
		// Heurística: últimas 2 palabras apellidos, resto nombres -> simplificamos: nombre = completo, apellidos vacío
		const matOriginal = mat === 'SF-001' ? 'Sin ficha' : null;
		client
			.prepare(
				`INSERT OR REPLACE INTO alumnos (matricula, nombre, apellidos, grupo, activo, matricula_original) VALUES (?, ?, ?, 'propedéutico-2026', 1, ?)`
			)
			.run(mat, nombre, '', matOriginal);
	}
	console.log(`  + ${alumnosList.length} alumnos`);

	console.log('✅ Seed completo');
	client.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
