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
    # Copiar .env de producción limpio
    cp "$BLUE_ENV" "$GREEN_ENV"

    # Eliminar PORT y DB_NAME existentes (si los hay) y agregar los correctos al final
    sed -i '/^PORT=/d' "$GREEN_ENV"
    sed -i '/^DB_NAME=/d' "$GREEN_ENV"
    sed -i '/^NODE_ENV=/d' "$GREEN_ENV"
    echo "PORT=$GREEN_PORT"           >> "$GREEN_ENV"
    echo "DB_NAME=$STAGING_DB"        >> "$GREEN_ENV"
    echo "NODE_ENV=staging"           >> "$GREEN_ENV"

    info ".env de green creado:"
    info "  PORT=$GREEN_PORT  (blue usa $BLUE_PORT)"
    info "  DB_NAME=$STAGING_DB  (blue usa $PROD_DB)"
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
# El .env es cargado por dotenv desde WorkingDirectory
[Unit]
Description=MundoGrafic backend — instancia green (staging)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$OWNER
WorkingDirectory=$GREEN_DIR/backend
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
step "PASO 6/8 — Compilando backend y frontend green…"

# Frontend: apuntar al backend green
echo "VITE_API_URL=http://$(hostname -I | awk '{print $1}'):$GREEN_PORT" > "$GREEN_DIR/.env"
sudo -u "$OWNER" bash -c "cd '$GREEN_DIR' && npm ci --legacy-peer-deps"
sudo -u "$OWNER" bash -c "cd '$GREEN_DIR' && npm run build"
info "Frontend green compilado en $GREEN_DIR/dist/"

# Backend
sudo -u "$OWNER" bash -c "cd '$GREEN_DIR/backend' && npm ci --legacy-peer-deps"
sudo -u "$OWNER" bash -c "cd '$GREEN_DIR/backend' && npm run build"
info "Backend green compilado en $GREEN_DIR/backend/dist/"

# ── PASO 7: Configurar nginx para el green (puerto 8080) ──────────────
step "PASO 7/8 — Configurando nginx para la instancia green en puerto 8080…"
cat > /etc/nginx/sites-available/mundografic-green <<NGINX
server {
    listen 8080;
    server_name _;

    root $GREEN_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:${GREEN_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
    }

    location /storage/ { proxy_pass http://127.0.0.1:${GREEN_PORT}; }
    location /uploads/ { proxy_pass http://127.0.0.1:${GREEN_PORT}; }

    access_log /var/log/nginx/mundografic_green_access.log;
    error_log  /var/log/nginx/mundografic_green_error.log;
}
NGINX

if [ ! -f /etc/nginx/sites-enabled/mundografic-green ]; then
  ln -s /etc/nginx/sites-available/mundografic-green /etc/nginx/sites-enabled/mundografic-green
fi
nginx -t && systemctl reload nginx
info "Nginx configurado. App green disponible en puerto 8080."

# ── PASO 7: Iniciar servicio green ────────────────────────────────────
step "PASO 8/9 — Iniciando servicio mundografic@green…"
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
step "PASO 9/9 — Configurando firewall…"
if command -v ufw &>/dev/null; then
  ufw allow "$GREEN_PORT"/tcp comment "MundoGrafic green backend (staging)" || warn "No se pudo abrir el puerto $GREEN_PORT en ufw"
  ufw allow 8080/tcp comment "MundoGrafic green frontend (staging)" || warn "No se pudo abrir el puerto 8080 en ufw"
  info "Puertos $GREEN_PORT y 8080 abiertos en ufw"
else
  warn "ufw no encontrado. Abre el puerto $GREEN_PORT manualmente si es necesario."
fi

# ── Resumen final ─────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "<IP_del_servidor>")
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✓  Setup de Green completado                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║   App completa (green):  http://%s:8080\n" "$SERVER_IP"
printf "║   Solo API (green):      http://%s:%s/api/\n" "$SERVER_IP" "$GREEN_PORT"
echo "║   BD de staging:         $STAGING_DB"
echo "║   Servicio backend:      mundografic@green                  ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║   Próximos pasos:                                           ║"
printf "║   1. Prueba la app en: http://%s:8080\n" "$SERVER_IP"
echo "║   2. Si todo OK → opción 4 del script de control           ║"
echo "║      (Promover green → producción)                         ║"
echo "║   3. Para nuevos deploys → opción 3 del script             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
info "Logs del servicio: sudo journalctl -u mundografic@green -f"
info "Script de control: sudo bash scripts/control-green.sh"
