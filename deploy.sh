#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — aspirantes-unsis → unsis1.irisvisual.com
# Uso: ./deploy.sh [--seed] [--backup] [--logs] [--health] [--down]

APP_NAME="aspirantes-unsis-app-1"
PORT_HOST="3017"
PORT_CONTAINER="3000"
COMPOSE="docker compose"
CADDYFILE_SRC="./Caddyfile"
CADDYFILE_DST="/etc/caddy/Caddyfile"
BACKUP_DIR="./backups"

DO_SEED=0
DO_BACKUP=0
DO_LOGS=0
DO_HEALTH=0
DO_DOWN=0

for arg in "$@"; do
  case "$arg" in
    --seed) DO_SEED=1 ;;
    --backup) DO_BACKUP=1 ;;
    --logs) DO_LOGS=1 ;;
    --health) DO_HEALTH=1 ;;
    --down) DO_DOWN=1 ;;
    -h|--help)
      echo "Uso: $0 [--seed] [--backup] [--logs] [--health] [--down]"
      echo "  --seed   : migra y seed 19+30 (primera vez)"
      echo "  --backup : solo backup DB"
      echo "  --health : verifica puerto/container/login"
      exit 0
      ;;
  esac
done

info(){ echo -e "\033[0;34m[deploy]\033[0m $*"; }
ok(){ echo -e "\033[0;32m[ok]\033[0m $*"; }
warn(){ echo -e "\033[0;33m[warn]\033[0m $*"; }
die(){ echo -e "\033[0;31m[error]\033[0m $*" >&2; exit 1; }

# 0. Pre-checks — autocrea .env si falta (fix error: env file not found)
if [[ ! -f ".env" ]]; then
  warn "Falta .env — autocreando desde .env.example"
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
  else
    cat > .env <<'ENVEOF'
DATABASE_URL=data/app.db
SESSION_SECRET=cambia-esto-en-prod
ORIGIN=http://localhost:3017
ENVEOF
  fi
  # genera SESSION_SECRET si está placeholder
  if grep -q "genera-con-openssl\|cambia-esto" .env; then
    SECRET=$(openssl rand -hex 32 2>/dev/null || echo "unsis-proped-$(date +%s)-$(openssl rand -hex 8 2>/dev/null || echo fallback)")
    # reemplaza solo la línea SESSION_SECRET
    if grep -q "^SESSION_SECRET=" .env; then
      sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$SECRET/" .env
    else
      echo "SESSION_SECRET=$SECRET" >> .env
    fi
    info "SESSION_SECRET generado automáticamente"
  fi
  # Si estamos en VPS con hostname unsis1 o carpeta aspirantesprope-unsis, usar ORIGIN prod
  if [[ "$(hostname)" == *"unsis"* ]] || pwd | grep -q "aspirantesprope" || [[ "${ORIGIN:-}" == *"unsis1"* ]]; then
    if grep -q "^ORIGIN=http://localhost" .env; then
      sed -i "s|^ORIGIN=.*|ORIGIN=https://unsis1.irisvisual.com|" .env
      info "ORIGIN ajustado a https://unsis1.irisvisual.com para prod"
    fi
  fi
  ok ".env creado — revisa con: cat .env"
fi
[[ -f "docker-compose.yml" ]] || die "No se encontró docker-compose.yml"
command -v docker >/dev/null || die "docker no instalado"

# --down
if [[ $DO_DOWN -eq 1 ]]; then
  info "Bajando stack..."
  $COMPOSE down
  ok "Down listo"
  exit 0
fi

# --backup solo
if [[ $DO_BACKUP -eq 1 && $DO_SEED -eq 0 && $DO_LOGS -eq 0 && $DO_HEALTH -eq 0 ]]; then
  mkdir -p "$BACKUP_DIR"
  if docker ps --format '{{.Names}}' | grep -q "$APP_NAME"; then
    ts=$(date +%F_%H%M%S)
    docker cp "$APP_NAME:/app/data/app.db" "$BACKUP_DIR/app.db.$ts.bak" && ok "Backup $BACKUP_DIR/app.db.$ts.bak ($(du -h "$BACKUP_DIR/app.db.$ts.bak" | cut -f1))"
  else
    [[ -f "data/app.db" ]] && cp "data/app.db" "$BACKUP_DIR/app.db.$(date +%F_%H%M%S).bak" && ok "Backup local"
  fi
  exit 0
fi

# 1. Verificar puerto
info "Verificando puerto $PORT_HOST..."
if ss -tulpn 2>/dev/null | grep -q ":$PORT_HOST\b"; then
  warn "Puerto $PORT_HOST ocupado:"
  ss -tulpn 2>/dev/null | grep ":$PORT_HOST" || true
  docker ps --format '{{.Names}} ({{.Ports}})' | grep "$PORT_HOST" || true
  # Si es nuestro propio container, es OK
  if docker ps --format '{{.Names}}' | grep -q "$APP_NAME"; then
    ok "Es $APP_NAME — continuando (recreate)"
  else
    die "Puerto $PORT_HOST ocupado por otro servicio. Libera o cambia ports en docker-compose.yml"
  fi
else
  ok "Puerto $PORT_HOST libre"
fi

# 2. Git pull si es repo
if [[ -d ".git" ]]; then
  info "Git pull..."
  git pull --ff-only || warn "git pull falló — continuando con código local"
fi

# 3. Backup previo si container existe
if docker ps -a --format '{{.Names}}' | grep -q "$APP_NAME"; then
  info "Backup DB previo..."
  mkdir -p "$BACKUP_DIR"
  if docker ps --format '{{.Names}}' | grep -q "$APP_NAME"; then
    docker cp "$APP_NAME:/app/data/app.db" "$BACKUP_DIR/app.db.$(date +%F_%H%M%S).pre-deploy.bak" 2>/dev/null && ok "Backup pre-deploy OK" || warn "Sin DB previa"
  fi
fi

# 4. Validar compose
info "Validando compose..."
$COMPOSE -f docker-compose.yml -f docker-compose.prod.yml config >/dev/null 2>&1 || $COMPOSE config >/dev/null
ok "Compose válido"

# 5. Build & Up (skip si solo --health sin --seed)
if [[ $DO_HEALTH -eq 1 && $DO_SEED -eq 0 && $DO_LOGS -eq 0 ]]; then
  info "Modo --health: saltando build, solo verificando container existente..."
else
  info "Build & Up (node:22, puede tardar 2-4 min primera vez)..."
  if [[ -f "docker-compose.prod.yml" ]]; then
    $COMPOSE -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  else
    $COMPOSE up -d --build
  fi
  ok "Container iniciado"
  $COMPOSE ps
  docker logs "$APP_NAME" --tail 20 || true
fi

# 6. Seed si se pide
if [[ $DO_SEED -eq 1 ]]; then
  info "Migración + seed (19 docentes + 30 alumnos)..."
  $COMPOSE exec -T app npx drizzle-kit push --force || warn "drizzle-kit push falló"
  $COMPOSE exec -T app npm run db:seed || warn "db:seed falló"
  ok "Seed listo — admin/admin123"
fi

# 7. Caddy reload si existe
if command -v caddy >/dev/null 2>&1; then
  info "Recargando Caddy..."
  if [[ -f "$CADDYFILE_SRC" && -f "$CADDYFILE_DST" ]]; then
    # Si Caddyfile destino es directorio .d, copiar
    if [[ -d "$CADDYFILE_DST" ]]; then
      cp "$CADDYFILE_SRC" "$CADDYFILE_DST/unsis1.caddy" || true
    elif ! grep -q "unsis1.irisvisual.com" "$CADDYFILE_DST" 2>/dev/null; then
      cat "$CADDYFILE_SRC" >> "$CADDYFILE_DST" && info "Añadido bloque a $CADDYFILE_DST"
    fi
  fi
  caddy fmt --overwrite "$CADDYFILE_DST" 2>/dev/null || true
  caddy reload --config "$CADDYFILE_DST" --adapter caddyfile 2>/dev/null && ok "Caddy reload OK" || warn "Caddy reload manual: sudo systemctl reload caddy"
else
  warn "Caddy no instalado — configura reverse_proxy localhost:$PORT_HOST manual (ver Caddyfile.example)"
fi

# 8. Healthcheck
info "Healthcheck..."
sleep 2
if curl -sk "http://localhost:$PORT_HOST/login" | grep -q "Acceso UNSIS"; then
  ok "http://localhost:$PORT_HOST/login → 200"
else
  warn http://localhost:$PORT_HOST/login no responde — ver docker logs
  docker logs "$APP_NAME" --tail 30 || true
fi

if [[ $DO_HEALTH -eq 1 ]]; then
  info "Health admin..."
  # login admin y stats
  JAR=$(mktemp)
  curl -sk -X POST -H "Content-Type: application/json" -H "Origin: http://localhost:$PORT_HOST" \
    --data '{"username":"admin","password":"admin123"}' -c "$JAR" "http://localhost:$PORT_HOST/api/auth/login" | grep -q '"ok":true' && ok "Login admin OK" || warn "Login admin falló"
  curl -sk -b "$JAR" "http://localhost:$PORT_HOST/api/stats" | grep -q "totalAlumnos" && ok "API /api/stats OK" || warn "API /api/stats falló"
  rm -f "$JAR"
fi

if [[ $DO_LOGS -eq 1 ]]; then
  $COMPOSE logs -f
fi

ok "Deploy listo → https://unsis1.irisvisual.com (si Caddy) o http://localhost:$PORT_HOST"
echo "  Comandos útiles:"
echo "    ./deploy.sh --logs      # ver logs"
echo "    ./deploy.sh --backup    # backup DB"
echo "    ./deploy.sh --health    # healtcheck"
echo "    docker cp $APP_NAME:/app/data/app.db ./backup-\$(date +%F).db"
