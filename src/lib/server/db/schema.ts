import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users: admin + docentes
export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'docente'] }).notNull().default('docente'),
	nombreCompleto: text('nombre_completo').notNull(),
	activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Alumnos: matrícula es PK TEXT
export const alumnos = sqliteTable('alumnos', {
	matricula: text('matricula').primaryKey(),
	nombre: text('nombre').notNull(),
	apellidos: text('apellidos').notNull().default(''),
	grupo: text('grupo').notNull().default('propedéutico-2026'),
	activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
	matriculaOriginal: text('matricula_original'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Evaluaciones: 8 variables 1-5 + observaciones
export const evaluaciones = sqliteTable('evaluaciones', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	docenteId: text('docente_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	alumnoMatricula: text('alumno_matricula')
		.notNull()
		.references(() => alumnos.matricula, { onDelete: 'cascade' }),
	asistenciaPuntualidad: integer('asistencia_puntualidad').notNull(),
	participacionCompromiso: integer('participacion_compromiso').notNull(),
	responsabilidadCumplimiento: integer('responsabilidad_cumplimiento').notNull(),
	disciplinaNormas: integer('disciplina_normas').notNull(),
	respetoConvivencia: integer('respeto_convivencia').notNull(),
	trabajoColaborativo: integer('trabajo_colaborativo').notNull(),
	comunicacionExpresion: integer('comunicacion_expresion').notNull(),
	actitudMotivacion: integer('actitud_motivacion').notNull(),
	observaciones: text('observaciones'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Sesiones
export const sesiones = sqliteTable('sesiones', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: text('expires_at').notNull()
});
