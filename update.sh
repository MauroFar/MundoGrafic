#!/bin/bash

# Script de actualización automática para MundoGrafic
# Uso: sudo bash update.sh

set -e

echo "🚀 Iniciando actualización de MundoGrafic..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

# Obtener cambios de Git
echo "📥 Obteniendo cambios de Git..."
git pull origin main

# Verificar si hay cambios en package.json
if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    echo "📦 Instalando nuevas dependencias..."
    npm install
else
    echo "ℹ️  No hay cambios en dependencias"
fi

# Recompilar frontend
echo "🔨 Recompilando frontend..."
npm run build

# Desplegar archivos compilados
echo "📁 Desplegando archivos..."
sudo mkdir -p /var/www/mundografic
sudo rsync -a --delete dist/ /var/www/mundografic/

# Actualizar configuración de Nginx para evitar cache viejo en clientes
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

# Establecer permisos correctos
echo "🔐 Estableciendo permisos..."
sudo chown -R www-data:www-data /var/www/mundografic
sudo chmod -R 755 /var/www/mundografic

# Siempre recompilar el backend (por si acaso)
echo "🛑 Deteniendo backend..."
sudo systemctl stop mundografic-backend
echo "🔨 Recompilando backend..."
cd backend && rm -rf dist && npm run build
echo "🔄 Reiniciando backend..."
sudo systemctl start mundografic-backend
echo "✅ Backend recompilado y reiniciado"

# Ejecutar migraciones de Knex para mantener BD sincronizada
echo "🗄️  Ejecutando migraciones de base de datos..."
cd backend && npx knex migrate:latest || echo "⚠️  Migraciones no ejecutadas"
echo "✅ Migraciones ejecutadas"

# Verificar estado de migraciones
echo "🔍 Verificando estado de migraciones..."
cd backend && npx knex migrate:status || echo "⚠️  Estado de migraciones no verificado"

# Ejecutar seeds para insertar datos (COMENTADO PARA EVITAR BORRAR DATOS)
# echo "🌱 Ejecutando seeds..."
# cd backend && npx knex seed:run
# echo "✅ Seeds ejecutados"
echo "⚠️  Seeds deshabilitados para proteger datos existentes"

# Verificar estado de los servicios
echo "🔍 Verificando estado de servicios..."
echo "Backend:"
sudo systemctl status mundografic-backend --no-pager -l

echo ""
echo "Nginx:"
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager -l

echo ""
echo "🎉 ¡Actualización completada exitosamente!"
echo "🌐 Tu aplicación está disponible en: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📋 Comandos útiles:"
echo "- Ver logs del backend: sudo journalctl -u mundografic-backend -f"
echo "- Ver logs de Nginx: sudo tail -f /var/log/nginx/error.log"
echo "- Reiniciar servicios: sudo systemctl restart mundografic-backend nginx"
