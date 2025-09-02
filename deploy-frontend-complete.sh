#!/bin/bash

# Script completo para desplegar el frontend de MundoGrafic en el servidor Debian
# Uso: sudo bash deploy-frontend-complete.sh

set -e

echo "🚀 Despliegue completo del frontend de MundoGrafic..."

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

# Verificar que Nginx esté instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    apt update
    apt install -y nginx
else
    echo "✅ Nginx ya está instalado"
fi

# Crear el directorio para el frontend
echo "📁 Creando directorio para el frontend..."
mkdir -p /var/www/mundografic

# Copiar la configuración de Nginx
echo "⚙️  Configurando Nginx..."
cp nginx-config.conf /etc/nginx/sites-available/mundografic

# Crear enlace simbólico para habilitar el sitio
echo "🔗 Habilitando sitio..."
ln -sf /etc/nginx/sites-available/mundografic /etc/nginx/sites-enabled/

# Remover configuración por defecto si existe
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️  Removiendo configuración por defecto..."
    rm /etc/nginx/sites-enabled/default
fi

# Verificar configuración de Nginx
echo "🔍 Verificando configuración de Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Error en la configuración de Nginx. Revisa el archivo de configuración."
    exit 1
fi

echo "✅ Configuración de Nginx es válida"

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
rsync -a --delete dist/ /var/www/mundografic/

# Establecer permisos correctos
echo "🔐 Estableciendo permisos..."
chown -R www-data:www-data /var/www/mundografic
chmod -R 755 /var/www/mundografic

# Recargar Nginx
echo "🔄 Recargando Nginx..."
systemctl reload nginx

# Habilitar Nginx para que inicie con el sistema
echo "🚀 Habilitando Nginx para inicio automático..."
systemctl enable nginx

echo ""
echo "🎉 ¡Despliegue del frontend completado exitosamente!"
echo "🌐 Tu frontend está disponible en: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📋 Comandos útiles:"
echo "- Ver estado de Nginx: sudo systemctl status nginx"
echo "- Ver logs de Nginx: sudo tail -f /var/log/nginx/mundografic_error.log"
echo "- Recargar configuración: sudo systemctl reload nginx"
echo "- Reiniciar Nginx: sudo systemctl restart nginx"
echo ""
echo "⚠️  NOTA: El backend debe estar ejecutándose en el puerto 3000 para que las APIs funcionen"
