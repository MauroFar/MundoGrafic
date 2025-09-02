#!/bin/bash

# Script para configurar Nginx en el servidor Debian para servir el frontend de MundoGrafic
# Uso: sudo bash setup-nginx-frontend.sh

set -e

echo "🚀 Configurando Nginx para el frontend de MundoGrafic..."

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Este script debe ejecutarse como root (sudo)"
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

if [ $? -eq 0 ]; then
    echo "✅ Configuración de Nginx es válida"
    
    # Recargar Nginx
    echo "🔄 Recargando Nginx..."
    systemctl reload nginx
    
    # Habilitar Nginx para que inicie con el sistema
    echo "🚀 Habilitando Nginx para inicio automático..."
    systemctl enable nginx
    
    echo ""
    echo "🎉 ¡Configuración de Nginx completada!"
    echo "🌐 Tu frontend estará disponible en: http://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "📋 Comandos útiles:"
    echo "- Ver estado de Nginx: sudo systemctl status nginx"
    echo "- Ver logs de Nginx: sudo tail -f /var/log/nginx/mundografic_error.log"
    echo "- Recargar configuración: sudo systemctl reload nginx"
    echo "- Reiniciar Nginx: sudo systemctl restart nginx"
    echo ""
    echo "⚠️  IMPORTANTE: Ahora ejecuta tu script update.sh para desplegar el frontend"
else
    echo "❌ Error en la configuración de Nginx. Revisa el archivo de configuración."
    exit 1
fi
