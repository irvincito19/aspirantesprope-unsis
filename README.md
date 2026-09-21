# Sistema de Apreciación Estudiantil — Propedéutico UNSIS

> **Dominio:** `https://unsis1.irisvisual.com` · **Local:** `http://localhost:3017` · **Stack:** SvelteKit 2 + Svelte 5 + Tailwind 4 + SQLite + Drizzle + Docker

Permite a 19 docentes evaluar a 30 aspirantes de propedéutico en 8 variables generales (escala 1-5) + observaciones, con panel de visualización compartible para dirección y carga de nuevos alumnos vía CSV (identificador = matrícula).

## Paleta institucional
- Vino `#7D2323` (primario), `hover #631C1C`, `light #FBE9E9`
- Verde `#1C5E35`, Negro `#231F20`, Blanco `#FFFFFF` (web), Borde `#E5E7EB`
- Fondo texturizado `#F5F3F0` solo para PDFs.

## Inicio rápido (local)

```bash
# 1. Instalar
npm install

# 2. DB
npm run db:push   # crea data/app.db
npm run db:seed   # 19 docentes + 30 alumnos (admin/admin123)

# 3. Dev
npm run dev -- --host --port 5173
# prod local
npm run build && npm run preview -- --host 0.0.0.0 --port 3017
open http://localhost:3017

# 4. Docker (puerto 3017)
ss -tulpn | grep 3017   # verificar libre
docker compose up -d --build
docker compose logs -f
```

Credenciales seed (ver `AGENTS.md`):

| Rol | Usuario | Password |
|-----|---------|----------|
| Admin | `admin` | `admin123` |
| Docentes | `lirio.ruiz` ... `silviana.juarez` | `Nombre2026*` |

## CSV de alumnos

Formato UTF-8, header `matricula,nombre`:

```csv
matricula,nombre
0673,ANTONIO PEREZ DULCE AMALI
Sin ficha,GARCIA PACHECO ANGEL FRANCISCO
2025030110,REYES PACHECO VALERIA GUADALUPE
```

- `Sin ficha` → se normaliza a `SF-001`, `SF-002`... y conserva original en `matricula_original`.
- Trim + mayúsculas + deduplicado. Errores por fila en `/admin` → Importar.

## Variables (8+1) — escala 1-5

**A Compromiso Académico (40%):** asistencia_puntualidad, participacion_compromiso, responsabilidad_cumplimiento
**B Convivencia y Conducta (40%):** disciplina_normas, respeto_convivencia, trabajo_colaborativo
**C Transversales (20%):** comunicacion_expresion, actitud_motivacion
**+** observaciones (TEXT 500) y `promedio = suma/8`, `alerta` si <3 o var=1.

Tooltips en cada slider: `1 Deficiente/Nunca → 5 Excelente/Siempre`.

## Rutas

```
/ -> /login
/login, /logout
/admin (solo admin) -> alumnos, docentes, importar CSV
/evaluar (docente|admin) -> lista 30 + buscador + progreso X/30
/evaluar/[matricula] -> 8 sliders + observaciones (upsert)
/dashboard -> tabla + KPIs + gráficos + filtros + export CSV + token compartido ?share=TOKEN
/api/* -> auth, alumnos, evaluaciones, stats
```

## Panel de visualización

- Tabla: Alumno | Docente | 8 vars | Promedio | Observaciones | Alerta
- Filtros: docente, alumno, rango promedio
- KPIs: promedio general, por dimensión A/B/C, top 5, alumnos en alerta
- Gráficos: barras por variable
- Export: CSV (y PDF con logo vino)
- Compartir: `?share=TOKEN` (solo lectura, 7 días)

## Docker y Deploy con Caddy

`docker-compose.yml` mapea `3017:3000`, volumen `./data:/app/data`.

```bash
ss -tulpn | grep 3017; docker compose config
docker compose up -d --build
docker cp aspirantes-unsis-app-1:/app/data/app.db ./backup-$(date +%F).db
docker compose logs -f
```

**.env** (ver `.env.example`):
```
DATABASE_URL=data/app.db
SESSION_SECRET=changeme-genera-con-openssl-rand-hex-32
ORIGIN=http://localhost:3017
```

**Caddy prod** (`/etc/caddy/Caddyfile`):
```caddy
unsis1.irisvisual.com {
  reverse_proxy localhost:3017
  encode gzip
}
```
Recarga: `caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile` o `systemctl reload caddy`.

## Stack y convenciones

- SvelteKit 2 + adapter-node, Tailwind 4, SQLite + Drizzle, bcrypt sessions.
- Idioma es-MX, commits en español.
- No usar fondo `#F5F3F0` en web, solo en PDFs.
- Ver `AGENTS.md` fuente de verdad (listas canónicas, schema, guards).

Estructura:
```
src/routes/{login,admin,evaluar,dashboard,api}
src/lib/server/db/{schema.ts,seed.ts}
src/lib/components/SliderEval.svelte
static/logo-unsis.svg
data/ (gitignored)
```

Licencia interna UNSIS — contacto: Irving Ulises Hernández Miguel (admin).
