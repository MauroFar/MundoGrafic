#!/bin/bash

# Script de despliegue para el frontend de MundoGrafic
# Uso: ./deploy-frontend.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="mundografic"
FRONTEND_DIR="/opt/myapp/frontend"
WEB_DIR="/var/www/myapp"
NGINX_CONF="/etc/nginx/sites-available/myapp"

echo "🚀 Iniciando despliegue del frontend para $ENVIRONMENT..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio del frontend."
    exit 1
fi

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Advertencia: No se encontró archivo .env"
    echo "📝 Copiando env.example a .env..."
    cp env.example .env
    echo "✅ Archivo .env creado. Por favor, edítalo con tus configuraciones de producción."
    exit 1
fi

echo "📦 Instalando dependencias..."
npm ci --only=production

echo "🔨 Compilando para producción..."
npm run build

echo "✅ Build completado exitosamente!"

# Si estamos en modo desarrollo local, solo compilar
if [ "$ENVIRONMENT" = "local" ]; then
    echo "🏠 Modo local: Build completado. Ejecuta 'npm run preview' para probar."
    exit 0
fi

echo "📁 Copiando archivos a $WEB_DIR..."

# Crear directorio si no existe
sudo mkdir -p $WEB_DIR

# Copiar archivos compilados
sudo rsync -a --delete dist/ $WEB_DIR/

# Establecer permisos correctos
sudo chown -R www-data:www-data $WEB_DIR
sudo chmod -R 755 $WEB_DIR

echo "✅ Archivos copiados exitosamente!"

# Configurar Nginx si no está configurado
if [ ! -f "$NGINX_CONF" ]; then
    echo "🔧 Configurando Nginx..."
    
    sudo tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name _;  # Cambia esto por tu dominio

    root $WEB_DIR;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    # Habilitar el sitio
    sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    
    echo "✅ Configuración de Nginx creada!"
fi

# Verificar configuración de Nginx
echo "🔍 Verificando configuración de Nginx..."
if sudo nginx -t; then
    echo "✅ Configuración de Nginx válida!"
    
    # Recargar Nginx
    echo "🔄 Recargando Nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx recargado exitosamente!"
else
    echo "❌ Error en la configuración de Nginx!"
    exit 1
fi

echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
echo "🌐 Tu aplicación está disponible en: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tu dominio en /etc/nginx/sites-available/myapp"
echo "2. Configura SSL con Let's Encrypt si es necesario"
echo "3. Verifica que el backend esté corriendo en el puerto 3002"
echo ""
echo "🔧 Comandos útiles:"
echo "- Ver logs de Nginx: sudo tail -f /var/log/nginx/error.log"
echo "- Reiniciar Nginx: sudo systemctl restart nginx"
echo "- Verificar estado: sudo systemctl status nginx"
