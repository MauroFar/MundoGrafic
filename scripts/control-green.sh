#!/usr/bin/env bash
# control-green.sh
# Script de control Blue/Green para MundoGrafic en servidor Debian.
# Blue  = producción  → servicio: mundografic-backend  | puerto: 3002
# Green = staging     → servicio: mundografic@green     | puerto: 4001
#
# Uso: sudo ./scripts/control-green.sh

set -euo pipefail

# ─── Configuración ────────────────────────────────────────────────
BLUE_SERVICE="mundografic-backend"      # servicio actual de producción
GREEN_SERVICE="mundografic@green"       # instancia green (usa mundografic@.service)

PORT_BLUE=3002
PORT_GREEN=4001

PROD_DB="sistema_mg"
STAGING_DB="sistema_mg_staging"

# Auto-detectar el usuario real (puede ejecutarse con sudo)
REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6 2>/dev/null || eval echo "~$REAL_USER")

# Auto-detectar directorio de producción (blue)
_detect_blue() {
  local candidates=(
    "$REAL_HOME/MundoGrafic"
    "$REAL_HOME/mundografic"
    "/opt/mundografic"
    "/var/www/mundografic"
    "/srv/mundografic"
  )
  for c in "${candidates[@]}"; do
    [ -f "$c/package.json" ] && [ -d "$c/backend" ] && { echo "$c"; return; }
  done
  echo "/opt/mundografic"
}

BLUE_DIR=$(_detect_blue)
GREEN_DIR="$REAL_HOME/MundoGrafic-verde"

# Override manual: si existe /opt/mundografic/green úsalo como fallback
if [ ! -d "$GREEN_DIR" ] && [ -d "/opt/mundografic/green" ]; then
  GREEN_DIR="/opt/mundografic/green"
fi

GREEN_ENV_SYSTEM="/etc/mundografic/green.env"
GREEN_ENV_LOCAL="$GREEN_DIR/backend/.env"

NGINX_UPSTREAM_CONF="/etc/nginx/conf.d/mundografic_upstream.conf"
# ──────────────────────────────────────────────────────────────────

# Colores para output
RED='\033[0;31m'; GREEN_C='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN_C}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

function show_menu() {
  echo ""
  echo "======================================================"
  echo "  MundoGrafic — Control Blue/Green"
  echo "  Blue  (PROD) → $BLUE_SERVICE  | :$PORT_BLUE"
  echo "  Green (TEST) → $GREEN_SERVICE | :$PORT_GREEN"
  echo "======================================================"
  echo "  1) Iniciar instancia green"
  echo "  2) Detener instancia green"
  echo "  3) Deploy a green  (git pull → build → restart)"
  echo "  4) Promover green → producción  (nginx apunta a :$PORT_GREEN)"
  echo "  5) Rollback a blue → producción (nginx apunta a :$PORT_BLUE)"
  echo "  6) Refrescar BD staging desde producción"
  echo "  7) Ver estado del sistema"
  echo "  8) Setup inicial green (primera vez)"
  echo "  0) Salir"
  echo "======================================================"
}

# ─── Iniciar / detener ──────────────────────────────────────────
function start_green() {
  info "Iniciando instancia green ($GREEN_SERVICE)…"
  sudo systemctl daemon-reload
  sudo systemctl start "$GREEN_SERVICE"
  sudo systemctl enable "$GREEN_SERVICE"
  info "Green iniciado. Accede en: http://$(hostname -I | awk '{print $1}'):$PORT_GREEN"
}

function stop_green() {
  info "Deteniendo instancia green ($GREEN_SERVICE)…"
  sudo systemctl stop "$GREEN_SERVICE" || warn "El servicio no estaba activo."
}

# ─── Deploy a green ─────────────────────────────────────────────
function deploy_to_green() {
  if [ ! -d "$GREEN_DIR" ]; then
    error "Directorio $GREEN_DIR no existe. Ejecuta primero la opción 8 (Setup inicial)."
    return 1
  fi

  info "Actualizando código en $GREEN_DIR…"
  sudo -u "$REAL_USER" git -C "$GREEN_DIR" fetch --all --prune

  # Detectar si package.json cambió antes de hacer el reset
  FRONTEND_PKG_CHANGED=$(sudo -u "$REAL_USER" git -C "$GREEN_DIR" diff HEAD origin/main --name-only 2>/dev/null | grep -c "^package.json$" || true)
  BACKEND_PKG_CHANGED=$(sudo -u "$REAL_USER" git -C "$GREEN_DIR" diff HEAD origin/main --name-only 2>/dev/null | grep -c "^backend/package.json$" || true)

  sudo -u "$REAL_USER" git -C "$GREEN_DIR" reset --hard origin/main

  # Frontend: instalar deps solo si cambió package.json o no existe node_modules
  if [ "$FRONTEND_PKG_CHANGED" -gt 0 ] || [ ! -d "$GREEN_DIR/node_modules" ]; then
    info "Instalando dependencias del frontend (package.json modificado)…"
    sudo -u "$REAL_USER" bash -c "cd '$GREEN_DIR' && npm ci --legacy-peer-deps"
  else
    info "Sin cambios en dependencias del frontend, omitiendo npm ci."
  fi

  info "Compilando frontend (apunta a backend green :$PORT_GREEN)…"
  echo "VITE_API_URL=http://$(hostname -I | awk '{print $1}'):$PORT_GREEN" > "$GREEN_DIR/.env"
  chown "$REAL_USER":"$REAL_USER" "$GREEN_DIR/.env"
  sudo -u "$REAL_USER" bash -c "cd '$GREEN_DIR' && npm run build"

  # Backend: instalar deps solo si cambió package.json o no existe node_modules
  if [ "$BACKEND_PKG_CHANGED" -gt 0 ] || [ ! -d "$GREEN_DIR/backend/node_modules" ]; then
    info "Instalando dependencias del backend (package.json modificado)…"
    sudo -u "$REAL_USER" bash -c "cd '$GREEN_DIR/backend' && npm ci --legacy-peer-deps"
  else
    info "Sin cambios en dependencias del backend, omitiendo npm ci."
  fi

  info "Compilando backend (TypeScript)…"
  sudo -u "$REAL_USER" bash -c "cd '$GREEN_DIR/backend' && npm run build"

  info "Ejecutando migraciones de BD staging ($STAGING_DB)…"
  run_migrations_green || warn "No se pudieron ejecutar migraciones (revisa manualmente)."

  info "Reiniciando servicio green…"
  sudo systemctl daemon-reload
  sudo systemctl restart "$GREEN_SERVICE"
  sleep 2
  if systemctl is-active --quiet "$GREEN_SERVICE"; then
    info "Servicio green activo ✓"
  else
    warn "El servicio no arrancó. Revisa: sudo journalctl -u $GREEN_SERVICE -n 30"
  fi
  info "Deploy a green completado."
  info "Prueba la app completa en: http://$(hostname -I | awk '{print $1}'):8080"
  info "Solo API en:               http://$(hostname -I | awk '{print $1}'):$PORT_GREEN/api/"
}

# Aplica los archivos SQL de migrations/ a la BD staging
function run_migrations_green() {
  local migrations_dir="$GREEN_DIR/backend/migrations"
  local env_file="$GREEN_ENV_LOCAL"
  [ -f "$env_file" ] || env_file="$GREEN_ENV_SYSTEM"
  [ -f "$env_file" ] || { warn "No se encontró .env de green para migraciones"; return 1; }

  # Cargar variables
  set -o allexport; source "$env_file"; set +o allexport

  if [ -d "$migrations_dir" ]; then
    for sql_file in "$migrations_dir"/*.sql; do
      [ -f "$sql_file" ] || continue
      info "Aplicando migración: $(basename "$sql_file")"
      PGPASSWORD="$DB_PASSWORD" psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-postgres}" \
        -d "$STAGING_DB" -f "$sql_file" || warn "Migración $(basename "$sql_file") falló (puede que ya esté aplicada)"
    done
  fi
}

# ─── Nginx upstream ─────────────────────────────────────────────
function write_nginx_upstream() {
  local port=$1
  local label=$2
  info "Apuntando nginx a 127.0.0.1:$port ($label)…"
  sudo tee "$NGINX_UPSTREAM_CONF" > /dev/null <<EOF
# Generado por control-green.sh — activo: $label (:$port)
upstream mundografic_backends {
  server 127.0.0.1:${port} max_fails=3 fail_timeout=5s;
}
EOF
  sudo nginx -t && sudo systemctl reload nginx
  info "Nginx recargado. Tráfico ahora → $label (:$port)"
}

function promote_to_green() {
  echo ""
  warn "Esto enviará el tráfico de producción a la instancia GREEN (:$PORT_GREEN)."
  read -rp "¿Confirmar? (s/N): " confirm
  [[ "$confirm" =~ ^[sS]$ ]] || { info "Cancelado."; return; }
  write_nginx_upstream "$PORT_GREEN" "green (staging)"
}

function rollback_to_blue() {
  echo ""
  warn "Esto devolverá el tráfico de producción a la instancia BLUE (:$PORT_BLUE)."
  read -rp "¿Confirmar? (s/N): " confirm
  [[ "$confirm" =~ ^[sS]$ ]] || { info "Cancelado."; return; }
  write_nginx_upstream "$PORT_BLUE" "blue (producción)"
}

# ─── Base de datos staging ──────────────────────────────────────
function refresh_staging_db() {
  echo ""
  warn "Esto SOBREESCRIBIRÁ $STAGING_DB con una copia de $PROD_DB."
  read -rp "¿Confirmar? (s/N): " confirm
  [[ "$confirm" =~ ^[sS]$ ]] || { info "Cancelado."; return; }

  local dump_file="/tmp/mundografic_prod_$(date +%Y%m%d_%H%M%S).dump"
  info "Dumpeando $PROD_DB → $dump_file"
  sudo -u postgres pg_dump -Fc "$PROD_DB" -f "$dump_file"

  info "Recreando $STAGING_DB…"
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS \"$STAGING_DB\";"
  sudo -u postgres psql -c "CREATE DATABASE \"$STAGING_DB\";"

  info "Restaurando en $STAGING_DB…"
  sudo -u postgres pg_restore -d "$STAGING_DB" "$dump_file"
  rm -f "$dump_file"
  info "BD staging lista: $STAGING_DB"
}

# ─── Estado ─────────────────────────────────────────────────────
function show_status() {
  echo ""
  echo "--- BLUE (producción): $BLUE_SERVICE ---"
  sudo systemctl status "$BLUE_SERVICE" --no-pager -l 2>/dev/null || warn "Servicio blue no encontrado"

  echo ""
  echo "--- GREEN (staging): $GREEN_SERVICE ---"
  sudo systemctl status "$GREEN_SERVICE" --no-pager -l 2>/dev/null || warn "Servicio green no activo"

  echo ""
  echo "--- Upstream nginx activo ---"
  if [ -f "$NGINX_UPSTREAM_CONF" ]; then
    cat "$NGINX_UPSTREAM_CONF"
  else
    warn "Archivo $NGINX_UPSTREAM_CONF no existe aún"
  fi

  echo ""
  echo "--- Puertos en uso ---"
  ss -tlnp 2>/dev/null | grep -E ":$PORT_BLUE|:$PORT_GREEN" || \
    netstat -tlnp 2>/dev/null | grep -E ":$PORT_BLUE|:$PORT_GREEN" || \
    warn "No se pudo verificar puertos (ss/netstat no disponibles)"

  echo ""
  echo "--- Últimos logs backend BLUE ($BLUE_SERVICE) ---"
  sudo journalctl -u "$BLUE_SERVICE" -n 40 --no-pager 2>/dev/null || warn "No se pudieron leer logs de $BLUE_SERVICE"

  echo ""
  echo "--- Últimos logs backend GREEN ($GREEN_SERVICE) ---"
  sudo journalctl -u "$GREEN_SERVICE" -n 40 --no-pager 2>/dev/null || warn "No se pudieron leer logs de $GREEN_SERVICE"

  echo ""
  echo "--- Últimos logs frontend (nginx error.log) ---"
  sudo tail -n 40 /var/log/nginx/error.log 2>/dev/null || warn "No se pudo leer /var/log/nginx/error.log"

  if [ -f /var/log/nginx/mundografic_green_error.log ]; then
    echo ""
    echo "--- Últimos logs frontend GREEN (nginx mundografic_green_error.log) ---"
    sudo tail -n 40 /var/log/nginx/mundografic_green_error.log 2>/dev/null || warn "No se pudo leer /var/log/nginx/mundografic_green_error.log"
  fi
}

# ─── Setup inicial green (una sola vez) ─────────────────────────
function setup_green_initial() {
  info "=== Setup inicial de instancia green ==="
  echo ""

  # 1. Crear directorio y clonar repo
  if [ ! -d "$GREEN_DIR" ]; then
    info "Clonando repositorio en $GREEN_DIR…"
    REPO_URL=""
    if [ -d "${BLUE_DIR}/.git" ]; then
      REPO_URL=$(git -C "$BLUE_DIR" remote get-url origin 2>/dev/null || true)
    fi
    if [ -z "$REPO_URL" ]; then
      read -rp "URL del repositorio git: " REPO_URL
    fi
    sudo git clone "$REPO_URL" "$GREEN_DIR"
    sudo chown -R "$USER":"$USER" "$GREEN_DIR"
  else
    info "Directorio $GREEN_DIR ya existe, omitiendo clone."
  fi

  # 2. Crear .env de green
  info "Creando .env de green en $GREEN_DIR/backend/.env…"
  BLUE_ENV_FILE="$BLUE_DIR/backend/.env"
  if [ ! -f "$GREEN_DIR/backend/.env" ]; then
    if [ -f "$BLUE_ENV_FILE" ]; then
      # Copiar .env de blue y ajustar los valores de green
      sed "s/^DB_NAME=.*/DB_NAME=$STAGING_DB/" "$BLUE_ENV_FILE" | \
        sed "s/^PORT=.*/PORT=$PORT_GREEN/" > "$GREEN_DIR/backend/.env"
      # Agregar PORT si no existía
      grep -q '^PORT=' "$GREEN_DIR/backend/.env" || echo "PORT=$PORT_GREEN" >> "$GREEN_DIR/backend/.env"
      info ".env de green creado desde .env de blue (DB apunta a $STAGING_DB, PORT=$PORT_GREEN)"
    else
      warn "No se encontró $BLUE_ENV_FILE. Crea $GREEN_DIR/backend/.env manualmente."
      warn "Asegúrate de que contenga PORT=$PORT_GREEN y DB_NAME=$STAGING_DB"
    fi
  else
    info "$GREEN_DIR/backend/.env ya existe, no se sobreescribe."
  fi

  # 3. Instalar servicio systemd
  SERVICE_FILE="/etc/systemd/system/mundografic@.service"
  TEMPLATE_FILE="$GREEN_DIR/backend/deploy/mundografic@.service"
  if [ ! -f "$SERVICE_FILE" ] && [ -f "$TEMPLATE_FILE" ]; then
    info "Instalando servicio systemd desde $TEMPLATE_FILE…"
    sudo cp "$TEMPLATE_FILE" "$SERVICE_FILE"
    sudo systemctl daemon-reload
    info "Servicio systemd instalado."
  elif [ -f "$SERVICE_FILE" ]; then
    info "Servicio systemd $SERVICE_FILE ya existe."
  else
    warn "No se encontró $TEMPLATE_FILE. Instala manualmente el servicio systemd."
  fi

  # 4. Crear BD staging
  read -rp "¿Crear/refrescar BD staging $STAGING_DB ahora? (s/N): " create_db
  if [[ "$create_db" =~ ^[sS]$ ]]; then
    refresh_staging_db
  fi

  # 5. Build inicial
  read -rp "¿Instalar dependencias y compilar el código de green ahora? (s/N): " do_build
  if [[ "$do_build" =~ ^[sS]$ ]]; then
    info "Instalando dependencias frontend…"
    cd "$GREEN_DIR" && npm ci --legacy-peer-deps
    info "Compilando frontend…"
    npm run build
    info "Instalando dependencias backend…"
    cd "$GREEN_DIR/backend" && npm ci --legacy-peer-deps
    info "Compilando backend…"
    npm run build
    info "Build inicial completado."
  fi

  echo ""
  info "=== Setup completado ==="
  info "Próximos pasos:"
  info "  1) Opción 1 → Iniciar instancia green"
  info "  2) Prueba en http://$(hostname -I | awk '{print $1}'):$PORT_GREEN"
  info "  3) Si todo OK → Opción 4 (Promover a producción)"
}

# ─── Menú principal ─────────────────────────────────────────────
while true; do
  show_menu
  read -rp "Opción: " opt
  case "$opt" in
    1) start_green ;;
    2) stop_green ;;
    3) deploy_to_green ;;
    4) promote_to_green ;;
    5) rollback_to_blue ;;
    6) refresh_staging_db ;;
    7) show_status ;;
    8) setup_green_initial ;;
    0) info "Saliendo."; exit 0 ;;
    *) warn "Opción inválida: $opt" ;;
  esac
done
