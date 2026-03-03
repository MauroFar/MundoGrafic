#!/usr/bin/env bash
# setup-green-server.sh
# ─────────────────────────────────────────────────────────────────────
# Script de configuración INICIAL del entorno Green (staging) en el
# servidor Debian. Ejecutar UNA SOLA VEZ como root o con sudo.
#
# Uso:
#   sudo bash backend/deploy/setup-green-server.sh
#
# Qué hace este script:
#   1. Detecta la URL del repositorio git
#   2. Clona el código en /opt/mundografic/green
#   3. Crea el .env de green (PORT=4001, DB=sistema_mg_staging)
#   4. Instala el servicio systemd mundografic@.service
#   5. Copia la BD de producción a sistema_mg_staging
#   6. Instala dependencias y compila el backend green
#   7. Inicia el servicio green
#   8. Abre el puerto 4001 en el firewall (ufw si está disponible)
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN_C='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN_C}[✓]${NC} $*"; }
step()  { echo -e "${CYAN}[→]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*" >&2; }

# ── Configuración ─────────────────────────────────────────────────────
GREEN_PORT=4001
BLUE_PORT=3002
PROD_DB="sistema_mg"
STAGING_DB="sistema_mg_staging"
SYSTEMD_TEMPLATE="/etc/systemd/system/mundografic@.service"
NGINX_UPSTREAM="/etc/nginx/conf.d/mundografic_upstream.conf"

# Auto-detectar el directorio de producción (blue)
# Se busca en las rutas más comunes del servidor
detect_blue_dir() {
  # Obtener el usuario real que llamó sudo (no root)
  local real_user="${SUDO_USER:-$USER}"
  local real_home
  real_home=$(getent passwd "$real_user" | cut -d: -f6)

  local candidates=(
    "$real_home/MundoGrafic"
    "$real_home/mundografic"
    "/opt/mundografic"
    "/var/www/mundografic"
    "/srv/mundografic"
  )
  for candidate in "${candidates[@]}"; do
    if [ -f "$candidate/package.json" ] && [ -d "$candidate/backend" ]; then
      echo "$candidate"
      return 0
    fi
  done
  echo ""
}

BLUE_DIR=$(detect_blue_dir)

if [ -z "$BLUE_DIR" ]; then
  warn "No se encontró el directorio de producción automáticamente."
  read -rp "Introduce la ruta completa del directorio de producción (ej: /home/mauro_far/MundoGrafic): " BLUE_DIR
fi

# El directorio green vive junto al blue (mismo nivel, sufijo -verde o subcarpeta green)
REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)
GREEN_DIR="$REAL_HOME/MundoGrafic-verde"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   MundoGrafic — Setup inicial del entorno Green          ║"
echo "╠══════════════════════════════════════════════════════════╣"
printf "║   Producción (blue):  %-36s║\n" "$BLUE_DIR  →  :$BLUE_PORT"
printf "║   Staging    (green): %-36s║\n" "$GREEN_DIR  →  :$GREEN_PORT"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verificar root
if [ "$EUID" -ne 0 ]; then
  error "Ejecuta este script con sudo: sudo bash backend/deploy/setup-green-server.sh"
  exit 1
fi

# ── PASO 1: Obtener URL del repositorio ───────────────────────────────
step "PASO 1/8 — Detectando URL del repositorio…"
REPO_URL=""
if [ -d "$BLUE_DIR/.git" ]; then
  REPO_URL=$(git -C "$BLUE_DIR" remote get-url origin 2>/dev/null || true)
  info "URL detectada desde producción: $REPO_URL"
fi
if [ -z "$REPO_URL" ]; then
  read -rp "Introduce la URL del repositorio git (ej: https://github.com/usuario/MundoGrafic.git): " REPO_URL
fi

# ── PASO 2: Clonar repositorio en /opt/mundografic/green ─────────────
step "PASO 2/8 — Preparando directorio green…"
if [ -d "$GREEN_DIR" ]; then
  warn "El directorio $GREEN_DIR ya existe."
  read -rp "¿Continuar igualmente? (s/N): " cont
  [[ "$cont" =~ ^[sS]$ ]] || { info "Usa 'sudo bash scripts/control-green.sh' → opción 3 para actualizar."; exit 0; }
else
  info "Clonando en $GREEN_DIR…"
  git clone "$REPO_URL" "$GREEN_DIR"
fi

# Determinar usuario propietario (el mismo que ejecutó sudo, no root)
OWNER="$REAL_USER"
chown -R "$OWNER":"$OWNER" "$GREEN_DIR"

# ── PASO 3: Crear .env de green ───────────────────────────────────────
step "PASO 3/8 — Creando .env de green…"
GREEN_ENV="$GREEN_DIR/backend/.env"
BLUE_ENV="$BLUE_DIR/backend/.env"

if [ -f "$GREEN_ENV" ]; then
  warn ".env de green ya existe: $GREEN_ENV (no se sobreescribirá)"
else
  if [ -f "$BLUE_ENV" ]; then
    # Copiar .env de producción y adaptar valores para staging
    cp "$BLUE_ENV" "$GREEN_ENV"
    # Cambiar o agregar PORT
    if grep -q '^PORT=' "$GREEN_ENV"; then
      sed -i "s/^PORT=.*/PORT=$GREEN_PORT/" "$GREEN_ENV"
    else
      echo "PORT=$GREEN_PORT" >> "$GREEN_ENV"
    fi
    # Cambiar DB_NAME a staging
    sed -i "s/^DB_NAME=.*/DB_NAME=$STAGING_DB/" "$GREEN_ENV"
    # Agregar NODE_ENV=staging
    if ! grep -q '^NODE_ENV=' "$GREEN_ENV"; then
      echo "NODE_ENV=staging" >> "$GREEN_ENV"
    fi
    info ".env de green creado (DB=$STAGING_DB, PORT=$GREEN_PORT)"
  else
    error "No se encontró $BLUE_ENV. Crea $GREEN_ENV manualmente antes de continuar."
    exit 1
  fi
fi

# ── PASO 4: Instalar servicio systemd ─────────────────────────────────
step "PASO 4/8 — Instalando servicio systemd para mundografic@green…"
# Generamos una unit dedicada (no el template genérico) con las rutas reales
GREEN_UNIT="/etc/systemd/system/mundografic@green.service"

cat > "$GREEN_UNIT" <<UNIT
# Generado automáticamente por setup-green-server.sh
# Instancia GREEN (staging) de MundoGrafic
# Directorio: $GREEN_DIR/backend
[Unit]
Description=MundoGrafic backend — instancia green (staging)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$OWNER
WorkingDirectory=$GREEN_DIR/backend
EnvironmentFile=$GREEN_DIR/backend/.env
ExecStart=/usr/bin/node $GREEN_DIR/backend/dist/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
info "Servicio systemd creado: $GREEN_UNIT"

# ── PASO 5: Crear BD staging desde producción ─────────────────────────
step "PASO 5/8 — Creando BD staging ($STAGING_DB)…"
DUMP_FILE="/tmp/mundografic_setup_$(date +%Y%m%d_%H%M%S).dump"
info "Dumpeando $PROD_DB…"
sudo -u postgres pg_dump -Fc "$PROD_DB" -f "$DUMP_FILE"
info "Recreando $STAGING_DB…"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS \"$STAGING_DB\";" || true
sudo -u postgres psql -c "CREATE DATABASE \"$STAGING_DB\";"
info "Restaurando en $STAGING_DB…"
sudo -u postgres pg_restore -d "$STAGING_DB" "$DUMP_FILE"
rm -f "$DUMP_FILE"
info "BD staging lista: $STAGING_DB"

# ── PASO 6: Instalar dependencias y compilar ──────────────────────────
step "PASO 6/8 — Compilando backend green…"
# Ejecutar npm como el propietario del directorio, no como root
sudo -u "$OWNER" bash -c "cd '$GREEN_DIR/backend' && npm ci --legacy-peer-deps"
sudo -u "$OWNER" bash -c "cd '$GREEN_DIR/backend' && npm run build"
info "Backend green compilado en $GREEN_DIR/backend/dist/"

# ── PASO 7: Iniciar servicio green ────────────────────────────────────
step "PASO 7/8 — Iniciando servicio mundografic@green…"
systemctl daemon-reload
systemctl start "mundografic@green"
systemctl enable "mundografic@green"
sleep 2
if systemctl is-active --quiet "mundografic@green"; then
  info "Servicio mundografic@green activo ✓"
else
  warn "El servicio no arrancó. Revisa logs con: sudo journalctl -u mundografic@green -n 50"
fi

# ── PASO 8: Abrir puerto en firewall ─────────────────────────────────
step "PASO 8/8 — Configurando firewall…"
if command -v ufw &>/dev/null; then
  ufw allow "$GREEN_PORT"/tcp comment "MundoGrafic green (staging)" || warn "No se pudo abrir el puerto $GREEN_PORT en ufw"
  info "Puerto $GREEN_PORT abierto en ufw"
else
  warn "ufw no encontrado. Abre el puerto $GREEN_PORT manualmente si es necesario."
fi

# ── Resumen final ─────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "<IP_del_servidor>")
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✓  Setup de Green completado                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║   API Green (staging):  http://$SERVER_IP:$GREEN_PORT/api/  "
echo "║   BD de staging:        $STAGING_DB                         "
echo "║   Servicio:             mundografic@green                   ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║   Próximos pasos:                                           ║"
echo "║   1. Prueba la app en: http://$SERVER_IP:$GREEN_PORT        "
echo "║   2. Si todo OK, corre el script de control y elige        ║"
echo "║      opción 4 (Promover green → producción)                ║"
echo "║   3. Para deployar cambios en green: opción 3 del script   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
info "Logs del servicio: sudo journalctl -u mundografic@green -f"
info "Script de control: sudo bash scripts/control-green.sh"
