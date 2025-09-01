#!/bin/bash

# Script de actualización automática para MundoGrafic
# Uso: sudo bash update.sh

set -e

echo "🚀 Iniciando actualización de MundoGrafic..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde /opt/myapp"
    exit 1
fi

# Obtener cambios de Git
echo "📥 Obteniendo cambios de Git..."
sudo -u app -H bash -lc 'git pull origin main'

# Verificar si hay cambios en package.json
if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    echo "📦 Instalando nuevas dependencias..."
    sudo -u app -H bash -lc 'npm install'
else
    echo "ℹ️  No hay cambios en dependencias"
fi

# Recompilar frontend
echo "🔨 Recompilando frontend..."
sudo -u app -H bash -lc 'npm run build'

# Desplegar archivos compilados
echo "📁 Desplegando archivos..."
sudo rsync -a --delete dist/ /var/www/myapp/

# Establecer permisos correctos
echo "🔐 Estableciendo permisos..."
sudo chown -R www-data:www-data /var/www/myapp
sudo chmod -R 755 /var/www/myapp

# Siempre recompilar el backend (por si acaso)
echo "🛑 Deteniendo backend..."
sudo systemctl stop myapp-backend
echo "🔨 Recompilando backend..."
sudo -u app -H bash -lc 'cd backend && rm -rf dist && npm run build'
echo "🔄 Reiniciando backend..."
sudo systemctl start myapp-backend
echo "✅ Backend recompilado y reiniciado"

# Ejecutar migraciones de Knex para mantener BD sincronizada
echo "🗄️  Ejecutando migraciones de base de datos..."
sudo -u app -H bash -lc 'cd /opt/myapp/backend && npx knex migrate:latest'
echo "✅ Migraciones ejecutadas"

# Verificar estado de migraciones
echo "🔍 Verificando estado de migraciones..."
sudo -u app -H bash -lc 'cd /opt/myapp/backend && npx knex migrate:status'

# Ejecutar seeds para insertar datos (COMENTADO PARA EVITAR BORRAR DATOS)
# echo "🌱 Ejecutando seeds..."
# sudo -u app -H bash -lc 'cd /opt/myapp/backend && npx knex seed:run'
# echo "✅ Seeds ejecutados"
echo "⚠️  Seeds deshabilitados para proteger datos existentes"

# Verificar estado de los servicios
echo "🔍 Verificando estado de servicios..."
echo "Backend:"
sudo systemctl status myapp-backend --no-pager -l

echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🎉 ¡Actualización completada exitosamente!"
echo "🌐 Tu aplicación está disponible en: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📋 Comandos útiles:"
echo "- Ver logs del backend: sudo journalctl -u myapp-backend -f"
echo "- Ver logs de Nginx: sudo tail -f /var/log/nginx/error.log"
echo "- Reiniciar servicios: sudo systemctl restart myapp-backend nginx"
