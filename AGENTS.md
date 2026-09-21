## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: tailwindcss, sveltekit-adapter, drizzle, prettier, eslint

---

# AGENTS.md — Sistema de Apreciación Estudiantil Propedéutico UNSIS

> **Proyecto:** Encuesta de apreciación estudiantil para alumnos de propedéutico UNSIS
> **Dominio prod:** `unsis1.irisvisual.com` (Caddy reverse_proxy -> `localhost:3017`)
> **Local:** `http://localhost:3017` vía Docker
> **Admin:** `admin / admin123` (Irving Ulises Hernández Miguel)
> **Stack innegociable:** SvelteKit 2 + Svelte 5 + Tailwind 4 + SQLite (better-sqlite3) + Drizzle ORM + adapter-node + Docker

Este archivo es la fuente de verdad para cualquier agente IA o humano que modifique el repo. No romper las convenciones aquí descritas.

---

## 1. Contexto y Objetivo

Permitir a 19 docentes evaluar a 30 aspirantes de propedéutico (listas abajo) en 8 variables generales + observaciones. El sistema debe permitir agregar más alumnos vía CSV sencillo (identificador = `matrícula` TEXT, soporta `Sin ficha`), y exponer un panel de visualización compartible para dirección.

Primero funciona en local (Docker), luego se publica en `unsis1.irisvisual.com` con Caddy.

## 2. Stack y Convenciones

- **SvelteKit + Vite 6 + adapter-node** (SSR, build a `build/`). No Next, no PHP.
- **Tailwind CSS 4** con variables guinda. No usar CSS modules sueltos.
- **SQLite** archivo `data/app.db` montado como volumen Docker ` ./data:/app/data`. Backup = copiar archivo.
- **Drizzle ORM** + `better-sqlite3`.
- **Auth simple:** cookie `session` httpOnly + bcrypt. Roles `admin` | `docente`. Sin OAuth.
- **Puerto:** interno 3000 -> host **3017** (verificar con `ss -tulpn | grep 3017` antes de `up`). Evita 3000/5173.
- **Idioma:** español (es-MX). Commits y UI en español.
- **Paleta institucional:**
  ```css
  --vino: #7D2323; --vino-hover: #631C1C; --vino-light: #FBE9E9;
  --verde: #1C5E35; --negro: #231F20; --bg: #FFFFFF; --bg-muted: #F8F9FA; --borde: #E5E7EB;
  ```
  Usar `bg-[#7D2323]` como primario. Fondo texturizado `#F5F3F0` original solo para PDFs, no para web (usar `#FFFFFF`).

## 3. Variables a Medir — Modelo 8+1 (General)

Escala Likert **1-5** para todas (1 Deficiente/Nunca → 5 Excelente/Siempre). Ver tooltips en `src/lib/components/SliderEval.svelte`.

**Dimensión A — Compromiso Académico (40%)**
1. `asistencia_puntualidad` — Asistencia y puntualidad
2. `participacion_compromiso` — Participación en clase y compromiso
3. `responsabilidad_cumplimiento` — Responsabilidad / cumplimiento de tareas

**Dimensión B — Convivencia y Conducta (40%)**
4. `disciplina_normas` — Disciplina y respeto a normas
5. `respeto_convivencia` — Respeto y convivencia (docentes y pares)
6. `trabajo_colaborativo` — Trabajo colaborativo y actitud en equipo

**Dimensión C — Habilidades Transversales (20%)**
7. `comunicacion_expresion` — Comunicación y expresión
8. `actitud_motivacion` — Actitud, motivación y adaptación al entorno universitario

9. `observaciones` — TEXT 500 chars opcional (no promedia)
10. `promedio` — calculado `suma(8)/8`, `alerta` si promedio <3 o alguna var =1

> Si se requiere modo exhaustivo 12 vars, añadir por ENV `EVAL_VARS=12` (columnas opcionales ya previstas).

## 4. Modelo de Datos (Drizzle)

```ts
users: id PK, username UNIQUE TEXT, password_hash TEXT, role TEXT('admin','docente'), nombre_completo TEXT, activo BOOLEAN
alumnos: matricula PK TEXT, nombre TEXT, apellidos TEXT, grupo TEXT DEFAULT 'propedéutico-2026', activo BOOLEAN, matricula_original TEXT
evaluaciones: id PK, docente_id FK users.id, alumno_matricula FK alumnos.matricula, asistencia_puntualidad INT 1-5, participacion_compromiso INT 1-5, responsabilidad_cumplimiento INT 1-5, disciplina_normas INT 1-5, respeto_convivencia INT 1-5, trabajo_colaborativo INT 1-5, comunicacion_expresion INT 1-5, actitud_motivacion INT 1-5, observaciones TEXT, created_at, updated_at, UNIQUE(docente_id, alumno_matricula)
sesiones: id PK, user_id FK, token TEXT, expires_at DATETIME
```

Matrícula `Sin ficha` -> normalizar a `SF-001`, `SF-002`... y guardar original en `matricula_original`.

## 5. Listas Canónicas

### Docentes (19) — seed `drizzle/seed.ts`
| Usuario | Password inicial | Nombre completo |
|---|---|---|
| admin | admin123 | M.T.I.E. Irving Ulises Hernández Miguel (ADMIN) |
| lirio.ruiz | Lirio2026* | M.C.C. Lirio Ruíz Guerra |
| monica.perez | Monica2026* | M.C. Mónica Pérez Meza |
| alberto.cruz | Alberto2026* | M.C.A.C. José Alberto Cruz Tolentino |
| aidee.cruz | Aidee2026* | Dra. Aidee Cruz Barragán |
| arisai.barragan | Arisai2026* | Dr. Arisaí Darío Barragán López |
| enrique.garcia | Enrique2026* | M.C. Enrique García Reyes |
| oswaldo.avila | Oswaldo2026* | M.I.T.I. Oswaldo Rey Ávila Barrón |
| alejandro.jarillo | Alejandro2026* | Dr. Alejandro Jarillo Silva |
| jesus.pacheco | Jesus2026* | M.C.M. Jesús Pacheco Mendoza |
| amando.ruiz | Amando2026* | Dr. Amando Alejandro Ruiz Figueroa |
| everardo.pacheco | Everardo2026* | M.T.E. Everardo de Jesús Pacheco Antonio |
| jesus.ahuactzi | Ahuactzi2026* | Dr. Jesús Cruz Ahuactzi |
| rolando.pedro | Rolando2026* | M.T.C.A. Rolando Pedro Gabriel |
| eliezer.alcazar | Eliezer2026* | M.C.C Eliezer Álcazar Silva |
| arturo.benitez | Arturo2026* | Dr. Arturo Benítez Hernández |
| javier.hernandez | Javier2026* | Dr. José Javier Hernández Barriga |
| teresita.mijangos | Teresita2026* | M.C. Teresita de Jesús Mijangos Martínez |
| silviana.juarez | Silviana2026* | M.C.C. Silviana Juárez Chalini |

> Alternativa simple: `prof01`..`prof19` / `Unsis2026` si dirección lo pide. Mantener ambos mapeos.

### Alumnos (30) — seed inicial
```
0673 ANTONIO PEREZ DULCE AMALI
3358 CONTRERAS ALCANTARA DAMITZA CAROLINA
1009 CRUZ BARCELOS ANDREA
1302 CRUZ MEJIA KAREN JANET
1525 GARCIA LUJAN NEYVER HERISEL
Sin ficha GARCIA PACHECO ANGEL FRANCISCO -> SF-001
3048 GONZALEZ PACHECO ANGEL DAVID
2476 MARQUEZ GENARO FRANCISCO JAVIER
0616 OJEDA JESSICA LORENA
1826 OSORIO GASPAR KENYA JOSELIN
2227 RAMIREZ RAMIREZ RODRIGO GABINO
2025030110 REYES PACHECO VALERIA GUADALUPE
2670 RODRIGUEZ REYES NAOMI PAMELA
0775 VASQUEZ GARCIA MARCOS GAEL
1021 VASQUEZ LOPEZ CRISTIAN URIEL
2380 VASQUEZ SANCHEZ SET ELOHIM
2024030564 VASQUEZ FABIAN ALEXANDER INOCENTES
2668 BUSTAMANTE BAUTISTA XITLALI
0419 CRUZ NOLASCO NAYELI
1820 GARCIA GOMEZ GAEL
1819 HERNANDEZ ZUÑIGA ANGELA
0772 LOPEZ HERNANDEZ MELISA IRASEMA
1193 LOPEZ VASQUEZ VERONICA
2229 MARTINEZ MATIAS MARISELA
1949 MENDOZA MONJARAZ ROSA
3217 PACHECO REYES BELINDA ITZEL
1301 REYES RAMIREZ ALIMARI MONSERRATH
0613 SANTIAGO MARTNEZ BRYAN JOSUE
2856 SANTIAGO SANTIAGO VALERIA
2228 SIBAJA MARCIAL NIKOLAI
```
CSV import: `matricula,nombre` header, trim, mayúsculas, deduplicar.

## 6. Rutas y Roles

- `/` -> redirect `/login`
- `/login` (POST /api/auth/login) -> set cookie
- `/logout`
- `/admin` (guard admin) tabs: alumnos | docentes | evaluaciones | importar CSV
- `/evaluar` (docente|admin) lista alumnos + buscador + progreso X/30
- `/evaluar/[matricula]` formulario 8 sliders 1-5 + textarea observaciones (upsert)
- `/dashboard` panel visualización (admin + token compartido `?share=TOKEN`)
- `/api/*` auth, alumnos, evaluaciones, stats, import, export

Guards en `src/hooks.server.ts` leyendo cookie `session`.

## 7. Panel de Visualización

- Tabla sortable: Alumno | Docente | 8 vars | Promedio | Observaciones | Alerta
- Filtros: docente, alumno, grupo, rango promedio
- KPIs: promedio general, por dimensión A/B/C, top5, alumnos alerta (<3 o var=1)
- Gráficos: barras por variable, heatmap docente x alumno (Chart.js)
- Export: CSV + PDF con logo y paleta vino
- Vista compartida token 7 días firmada

## 8. Comandos

```bash
npm install
npm run dev -- --host --port 5173
npm run db:push   # drizzle-kit push
npm run db:seed   # tsx src/lib/server/db/seed.ts
npm run build && npm run preview

# Docker
ss -tulpn | grep 3017; docker compose config
docker compose up -d --build
docker compose logs -f
docker cp aspirantes-unsis-app-1:/app/data/app.db ./backup.db
```

## 9. Docker y Deploy

`docker-compose.yml` mapea `3017:3000`, volumen `./data:/app/data`, `env_file: .env`.

Prod Caddy:
```caddy
unsis1.irisvisual.com {
  reverse_proxy localhost:3017
  encode gzip
}
```
Luego `caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile`.

## 10. No Romper

- No cambiar puerto sin verificar `ss -tulpn`.
- No exponer SQLite fuera de volumen.
- No hardcodear `admin123` en prod, usar ENV `ADMIN_PASS_HASH`.
- No usar textura `#F5F3F0` como fondo web.

## 11. Estructura

```
src/routes/{login,admin,evaluar,dashboard,api}
src/lib/server/db/{schema.ts,seed.ts,client.ts}
src/lib/components/{SliderEval.svelte,TablaDashboard.svelte}
static/logo-unsis.svg
data/ (gitignored)
```

## 12. Tareas Pendientes para Agentes

- [ ] Scaffold SvelteKit + Tailwind 4 + adapter-node
- [ ] Drizzle schema + seed 19+30
- [ ] Auth + guards
- [ ] CRUD alumnos + CSV
- [ ] Form evaluación 8 vars
- [ ] Dashboard + export
- [ ] Dockerfile + compose + Caddyfile.example
