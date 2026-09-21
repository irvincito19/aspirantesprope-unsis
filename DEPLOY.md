# DEPLOY — aspirantes-unsis → unsis1.irisvisual.com

> **Objetivo:** Llevar el sistema de `localhost:3017` a `https://unsis1.irisvisual.com` con Caddy + Docker

## 1. Arquitectura

```
Internet --443--> Caddy (host) --reverse_proxy--> localhost:3017 --> container aspirantes-unsis-app-1:3000 (SvelteKit + SQLite /app/data/app.db)
```

- **Puerto host:** `3017` (no 3000/5173/3000 ocupado por gitea/rubmed). Verificar siempre con `ss -tulpn | grep 3017`.
- **DB:** SQLite volumen `./data:/app/data` → backup = `docker cp ...:/app/data/app.db ./backup.db`
- **TLS:** Caddy automático (Let's Encrypt) para `unsis1.irisvisual.com`

## 2. Pre-requisitos en VPS (unsis1.irisvisual.com)

```bash
# En el VPS
docker --version   # >=24
docker compose version
caddy version      # >=2.8
git --version
ss -tulpn | grep 3017  # debe estar libre

# Clonar
git clone https://github.com/tu-org/aspirantes-unsis.git /opt/aspirantes-unsis
cd /opt/aspirantes-unsis
```

## 3. Variables de entorno PROD

Crear `/opt/aspirantes-unsis/.env` (nunca commitear):

```env
DATABASE_URL=/app/data/app.db
SESSION_SECRET=<openssl rand -hex 32>
ORIGIN=https://unsis1.irisvisual.com
# Opcional: hash bcrypt de admin123 para re-seed seguro
# ADMIN_PASS_HASH=$2b$10$...
SHARE_TOKEN_SECRET=<openssl rand -hex 32>
```

Generar secretos:

```bash
openssl rand -hex 32
# SESSION_SECRET
openssl rand -hex 32
# SHARE_TOKEN_SECRET
```

`.env.example` ya incluye plantilla (`cat .env.example`).

## 4. Deploy con script (recomendado)

```bash
chmod +x ./deploy.sh
./deploy.sh          # build + up
./deploy.sh --seed   # + migra y seed 19+30 (solo primera vez o reset)
./deploy.sh --backup # solo backup
./deploy.sh --logs   # logs -f
```

Qué hace `deploy.sh`:
1. `ss -tulpn | grep 3017` verifica puerto
2. `git pull` (si es repo git)
3. `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` valida
4. `docker compose up -d --build` (builder node:22-bookworm-slim)
5. `docker compose exec app npm run db:push -- --force` si `--seed`
6. `docker compose exec app npm run db:seed` si `--seed`
7. `caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile` si existe Caddy
8. Backup previo: `docker cp aspirantes-unsis-app-1:/app/data/app.db ./backups/app.db.<fecha>`


## 5. Deploy manual (sin script)

```bash
cd /opt/aspirantes-unsis

# 1. Actualizar código
git pull

# 2. Verificar puerto
ss -tulpn | grep 3017 || echo "3017 libre ✓"

# 3. Backup DB actual (si existe)
mkdir -p ./backups
docker cp aspirantes-unsis-app-1:/app/data/app.db ./backups/app.db.$(date +%F_%H%M).bak 2>/dev/null || echo "sin backup previo"

# 4. Build & run
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
docker compose logs -f --tail=50

# 5. Migrar DB (solo primera vez o si cambia schema.ts)
docker compose exec app npx drizzle-kit push --force
docker compose exec app npm run db:seed

# 6. Caddy
sudo cp Caddyfile /etc/caddy/Caddyfile.d/unsis1.caddy  # o append a /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy  # alternativo

# 7. Verificar
curl -sk https://unsis1.irisvisual.com/login | grep -q "Acceso UNSIS" && echo "PROD OK"
curl -sk https://unsis1.irisvisual.com/api/stats -H "Cookie: ..." # con login admin
```

## 6. Caddy

`Caddyfile` (ver `Caddyfile.example`):

```caddy
unsis1.irisvisual.com {
  reverse_proxy localhost:3017
  encode gzip
  header {
    # Seguridad básica
    X-Frame-Options "SAMEORIGIN"
    X-Content-Type-Options "nosniff"
  }
  log {
    output file /var/log/caddy/unsis1.log
  }
}
```

En VPS con Caddy global, añadir bloque y `caddy reload`:

```bash
sudo tee -a /etc/caddy/Caddyfile < Caddyfile
sudo caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Probar TLS:

```bash
curl -I https://unsis1.irisvisual.com/login
# HTTP/2 200
```

## 7. Operaciones día a día

```bash
# Ver logs
docker compose logs -f
docker logs aspirantes-unsis-app-1 --tail 100

# Backup manual
./deploy.sh --backup
# o
docker cp aspirantes-unsis-app-1:/app/data/app.db ./backups/manual-$(date +%F).db

# Restaurar backup
docker compose down
cp ./backups/app.db.2026-09-21.db ./data/app.db
docker compose up -d

# Cambiar password admin en prod
docker compose exec app node -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('NuevoPass2026*',10))"
# luego UPDATE users SET password_hash='...' WHERE username='admin'

# Agregar alumnos masivo
# como admin en https://unsis1.irisvisual.com/admin -> Importar CSV

# Actualizar código sin downtime
git pull && docker compose up -d --build

# Rollback
git log --oneline -10
git checkout <hash-anterior>
docker compose up -d --build
```

## 8. Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `address already in use 3017` | Otro servicio en 3017 | `ss -tulpn \| grep 3017` + `docker ps` + cambiar `ports: ["3018:3000"]` y Caddy |
| `better-sqlite3 EBADENGINE node >=22` | Imagen node:20 | Usar `node:22-bookworm-slim` (ya en `Dockerfile:1`) |
| `gyp ERR! find Python` | Falta python en alpine | `apt-get install python3 make g++` (ya en Dockerfile) |
| `Cross-site POST forbidden` | `ORIGIN` distinto | Asegurar `.env ORIGIN=https://unsis1.irisvisual.com` coincide con Caddy |
| `Sesión expira` | `SESSION_SECRET` cambió | No cambiar secret tras deploy sin migrar sesiones, o borrar `sesiones` tabla |
| Dashboard 303 a /evaluar | Usuario no admin | Solo `admin` ve dashboard; docentes usan `/evaluar`; `?share=TOKEN` para dirección |
| DB vacía en prod | Volumen no montado | Ver `docker inspect aspirantes-unsis-app-1` → Mounts `./data:/app/data` y `ls -lh data/app.db` |

Healthcheck rápido:

```bash
./deploy.sh --health
# verifica: puerto, container Up, /login 200, /api/stats con admin
```

## 9. Archivos de deploy incluidos

- `deploy.sh` — script idempotente (local y VPS)
- `docker-compose.yml` — base (dev/prod, puerto 3017)
- `docker-compose.prod.yml` — override prod (`ORIGIN`, `restart`, `logging`)
- `Caddyfile` / `Caddyfile.example` — reverse_proxy
- `.env.example` — plantilla
- `DEPLOY.md` — este archivo

## 10. Checklist go-live

- [ ] `.env` con `ORIGIN=https://unsis1.irisvisual.com` y secrets reales
- [ ] `docker compose up -d --build` → `docker ps` Up + `curl localhost:3017/login` 200
- [ ] `Caddyfile` en `/etc/caddy/Caddyfile` + `caddy reload` → `curl https://unsis1.irisvisual.com/login` 200
- [ ] `npm run db:seed` → 19 docentes + 30 alumnos
- [ ] Login `admin/admin123` → cambiar pass en prod
- [ ] Probar docente `lirio.ruiz/Lirio2026*` → solo `/evaluar`, sin dashboard
- [ ] Backup inicial ` ./backups/app.db.<fecha>`
- [ ] Compartir link dirección: `https://unsis1.irisvisual.com/dashboard?share=TOKEN`
