#!/usr/bin/env bash
# control-green.sh
# Script de ayuda para gestionar despliegue Blue/Green en el servidor
# Debe ejecutarse en el servidor Debian con privilegios adecuados.
# Rutas y puertos son ejemplos: adáptalos a tu entorno.

set -euo pipefail

NGINX_UPSTREAM_CONF="/etc/nginx/conf.d/mundografic_upstream.conf"
# Intentar detectar rutas comunes: /opt/mundografic/green o ~/MundoGrafic-verde
APP_BASE_DIR="/opt/mundografic"
if [ -d "$HOME/MundoGrafic-verde" ]; then
  APP_BASE_DIR="$HOME"
  BLUE_INSTANCE="MundoGrafic"
  GREEN_INSTANCE="MundoGrafic-verde"
else
  BLUE_INSTANCE="blue"
  GREEN_INSTANCE="green"
fi
SERVICE_TEMPLATE="mundografic@.service"

function show_menu() {
  cat <<EOF
MundoGrafic control - Blue/Green
1) Start green instance
2) Stop green instance
3) Deploy to green (git pull -> install -> build -> restart)
4) Switch nginx to green (promote)
5) Switch nginx to blue (rollback)
6) Create staging DB from production (dump -> restore)
7) Show status
0) Exit
EOF
}

function start_instance() {
  local instance=$1
  echo "Starting instance: $instance"
  sudo systemctl daemon-reload
  sudo systemctl start "mundografic@${instance}"
  sudo systemctl enable "mundografic@${instance}"
}

function stop_instance() {
  local instance=$1
  echo "Stopping instance: $instance"
  sudo systemctl stop "mundografic@${instance}"
}

function deploy_to_instance() {
  local instance=$1
  local dir="$APP_BASE_DIR/$instance"
  echo "Deploying to $instance at $dir"
  if [ ! -d "$dir" ]; then
    echo "ERROR: directory $dir not found"
    return 1
  fi
  cd "$dir"
  # Si existe un update.sh en la carpeta de la instancia, usarlo (se espera que haga pull/build/restart)
  if [ -f "$dir/update.sh" ]; then
    echo "Found update.sh in $dir — executing it"
    sudo bash "$dir/update.sh"
  else
    echo "Pulling latest code..."
    git fetch --all --prune
    git reset --hard origin/main
    echo "Installing dependencies..."
    npm install --production
    echo "Building... (if applicable)"
    npm run build --if-present || true
    echo "Restarting service..."
    # Preferir unit mundografic-backend@<instance> si existe, de lo contrario mundografic@<instance>
    if systemctl list-units --full -all | grep -q "mundografic-backend@${instance}.service"; then
      sudo systemctl restart "mundografic-backend@${instance}"
    else
      sudo systemctl restart "mundografic@${instance}" || true
    fi
  fi
  # After deployment, start dev servers for this instance (backend/frontend) so you can test
  start_dev_servers "$instance" || true
}

# Stop any dev servers started for this instance (by this script)
function stop_dev_servers() {
  local dir=$1
  local piddir="$dir/.pids"
  if [ -d "$piddir" ]; then
    for f in "$piddir"/*; do
      [ -f "$f" ] || continue
      pid=$(cat "$f" 2>/dev/null || true)
      if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "Stopping process $pid from $f"
        kill "$pid" || true
      fi
      rm -f "$f" || true
    done
  fi
}

# Start frontend and backend in dev mode (nohup) under the instance owner
function start_dev_servers() {
  local instance=$1
  local dir="$APP_BASE_DIR/$instance"
  if [ ! -d "$dir" ]; then
    echo "Directory $dir not found, cannot start dev servers"
    return 1
  fi
  local owner
  owner=$(stat -c '%U' "$dir" 2>/dev/null || echo "$USER")
  local envfile1="$dir/.env"
  local envfile2="/etc/mundografic/${instance}.env"
  local envfile="$envfile1"
  if [ ! -f "$envfile1" ] && [ -f "$envfile2" ]; then
    envfile="$envfile2"
  fi

  local piddir="$dir/.pids"
  local logsdir="$dir/logs"
  mkdir -p "$piddir" "$logsdir"
  chown -R "$owner":"$owner" "$piddir" "$logsdir" || true

  stop_dev_servers "$dir"

  # Backend
  if [ -d "$dir/backend" ]; then
    echo "Starting backend dev for $instance"
    sudo -u "$owner" bash -lc "cd '$dir/backend' && nohup bash -lc 'set -a; [ -f \"$envfile\" ] && source \"$envfile\"; set +a; npm run dev' > '$logsdir/backend.log' 2>&1 & echo \$! > '$piddir/backend.pid'"
  fi

  # Frontend (root)
  echo "Starting frontend dev for $instance"
  sudo -u "$owner" bash -lc "cd '$dir' && nohup bash -lc 'set -a; [ -f \"$envfile\" ] && source \"$envfile\"; set +a; npm run dev' > '$logsdir/frontend.log' 2>&1 & echo \$! > '$piddir/frontend.pid'"
}

function read_port_from_envfile() {
  local envfile=$1
  if [ ! -f "$envfile" ]; then echo ""; return; fi
  # Expect line like PORT=4000
  grep -E '^PORT=' "$envfile" | head -n1 | cut -d'=' -f2
}

function write_nginx_upstream() {
  local instance=$1
  local envfile1="$APP_BASE_DIR/$instance/.env"
  local envfile2="/etc/mundografic/${instance}.env"
  local port=$(read_port_from_envfile "$envfile1")
  if [ -z "$port" ]; then
    port=$(read_port_from_envfile "$envfile2")
  fi
  if [ -z "$port" ]; then
    echo "No PORT found in $envfile1 or $envfile2. Edit one of them or pass a port." >&2
    return 1
  fi
  echo "Writing nginx upstream to point to 127.0.0.1:$port"
  sudo tee "$NGINX_UPSTREAM_CONF" > /dev/null <<EOF
upstream mundografic_backends {
  server 127.0.0.1:${port} max_fails=3 fail_timeout=5s;
}
EOF
  sudo nginx -t && sudo systemctl reload nginx
}

function promote_to_green() {
  echo "Promoting GREEN -> live"
  write_nginx_upstream "$GREEN_INSTANCE"
  echo "Promoted. NGINX reloaded."
}

function rollback_to_blue() {
  echo "Rolling back to BLUE -> live"
  write_nginx_upstream "$BLUE_INSTANCE"
  echo "Rolled back. NGINX reloaded."
}

function create_staging_db_from_production() {
  # WARNING: this will copy data from production to staging DB. Customize DB names and credentials.
  local prod_db="sistema_mg_production"
  local staging_db="sistema_mg_staging"
  local db_user="postgres"
  echo "Dumping production DB ($prod_db) and restoring into $staging_db"
  sudo -u postgres pg_dump -Fc "$prod_db" -f /tmp/prod_dump.dump
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS \"$staging_db\";"
  sudo -u postgres psql -c "CREATE DATABASE \"$staging_db\";"
  sudo -u postgres pg_restore -d "$staging_db" /tmp/prod_dump.dump
  echo "Staging DB restored ($staging_db)"
}

function status() {
  echo "--- systemctl status (mundografic@blue|green) ---"
  sudo systemctl status "mundografic@${BLUE_INSTANCE}" --no-pager || true
  sudo systemctl status "mundografic@${GREEN_INSTANCE}" --no-pager || true
  echo
  echo "--- nginx upstream file ---"
  sudo cat "$NGINX_UPSTREAM_CONF" || true
}

# Menu loop
while true; do
  show_menu
  read -rp "Option: " opt
  case "$opt" in
    1) start_instance "$GREEN_INSTANCE" ;;
    2) stop_instance "$GREEN_INSTANCE" ;;
    3) deploy_to_instance "$GREEN_INSTANCE" ;;
    4) promote_to_green ;;
    5) rollback_to_blue ;;
    6) create_staging_db_from_production ;;
    7) status ;;
    0) exit 0 ;;
    *) echo "Invalid option" ;;
  esac
done
