#!/bin/bash

# Script de actualización y control de producción para MundoGrafic
# Uso: sudo bash update.sh

set -e

BACKEND_SERVICE="mundografic-backend"
FRONTEND_ACCESS_LOG="/var/log/nginx/mundografic_access.log"
FRONTEND_ERROR_LOG="/var/log/nginx/mundografic_error.log"
FALLBACK_FRONTEND_ACCESS_LOG="/var/log/nginx/access.log"
FALLBACK_FRONTEND_ERROR_LOG="/var/log/nginx/error.log"

show_menu() {
    echo ""
    echo "=============================================="
    echo "  MundoGrafic — Producción"
    echo "=============================================="
    echo "  1) Actualizar sistema"
    echo "  2) Ver logs de backend"
    echo "  3) Ver logs de frontend"
    echo "  0) Salir"
    echo "=============================================="
}

run_update() {
    echo "🚀 Iniciando actualización de MundoGrafic..."

    if [ ! -f "package.json" ]; then
        echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio del proyecto"
        exit 1
    fi

    echo "📥 Obteniendo cambios de Git..."
    git pull origin main

    if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
        echo "📦 Instalando nuevas dependencias..."
        npm install
    else
        echo "ℹ️  No hay cambios en dependencias"
    fi

    echo "🔨 Recompilando frontend..."
    npm run build

    echo "📁 Desplegando archivos..."
    sudo mkdir -p /var/www/mundografic
    sudo rsync -a --delete dist/ /var/www/mundografic/

    echo "🌐 Actualizando configuración de Nginx..."
    sudo cp backend/deploy/nginx_mundografic_site.conf /etc/nginx/sites-available/mundografic
    sudo ln -sfn /etc/nginx/sites-available/mundografic /etc/nginx/sites-enabled/mundografic
    if [ ! -f /etc/nginx/conf.d/mundografic_upstream.conf ]; then
        echo "🧭 Creando upstream inicial de nginx apuntando a producción..."
        sudo tee /etc/nginx/conf.d/mundografic_upstream.conf > /dev/null <<EOF
upstream mundografic_backends {
    server 127.0.0.1:3002 max_fails=3 fail_timeout=5s;
}
EOF
    fi

    echo "🔐 Estableciendo permisos..."
    sudo chown -R www-data:www-data /var/www/mundografic
    sudo chmod -R 755 /var/www/mundografic

    echo "🛑 Deteniendo backend..."
    sudo systemctl stop "$BACKEND_SERVICE"
    echo "🔨 Recompilando backend..."
    (
        cd backend
        rm -rf dist
        npm run build
    )
    echo "🔄 Reiniciando backend..."
    sudo systemctl start "$BACKEND_SERVICE"
    echo "✅ Backend recompilado y reiniciado"

    echo "🗄️  Migraciones de base de datos: OMITIDAS (ejecución manual)"
    echo "ℹ️  Ejecuta manualmente los .sql de backend/migrations cuando corresponda"

    echo "⚠️  Seeds deshabilitados para proteger datos existentes"

    echo "🔍 Verificando estado de servicios..."
    echo "Backend:"
    sudo systemctl status "$BACKEND_SERVICE" --no-pager -l

    echo ""
    echo "Nginx:"
    sudo nginx -t
    sudo systemctl reload nginx
    sudo systemctl status nginx --no-pager -l

    echo ""
    echo "🎉 ¡Actualización completada exitosamente!"
    echo "🌐 Tu aplicación está disponible en: http://$(hostname -I | awk '{print $1}'):3000"
}

show_backend_logs() {
    echo "📜 Mostrando logs del backend de producción. Sal con Ctrl+C."
    sudo journalctl -u "$BACKEND_SERVICE" -n 100 -f
}

show_frontend_logs() {
    local logs=()

    if [ -f "$FRONTEND_ACCESS_LOG" ]; then
        logs+=("$FRONTEND_ACCESS_LOG")
    elif [ -f "$FALLBACK_FRONTEND_ACCESS_LOG" ]; then
        logs+=("$FALLBACK_FRONTEND_ACCESS_LOG")
    fi

    if [ -f "$FRONTEND_ERROR_LOG" ]; then
        logs+=("$FRONTEND_ERROR_LOG")
    elif [ -f "$FALLBACK_FRONTEND_ERROR_LOG" ]; then
        logs+=("$FALLBACK_FRONTEND_ERROR_LOG")
    fi

    echo "📜 Mostrando logs del frontend de producción. Sal con Ctrl+C."

    if [ ${#logs[@]} -eq 0 ]; then
        echo "⚠️  No se encontraron logs de nginx para producción"
        return 1
    fi

    sudo tail -n 100 -f "${logs[@]}"
}

while true; do
    show_menu
    read -rp "Opción: " opt

    case "$opt" in
        1) run_update ;;
        2) show_backend_logs ;;
        3) show_frontend_logs ;;
        0) echo "Saliendo."; exit 0 ;;
        *) echo "⚠️  Opción inválida: $opt" ;;
    esac
done
