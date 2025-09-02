#!/bin/bash

# Script para configurar el servicio systemd del backend
# Uso: sudo bash setup-service.sh

set -e

echo "🔧 Configurando servicio systemd para MundoGrafic..."

# Obtener la ruta actual del proyecto
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"

echo "📁 Directorio del proyecto: $PROJECT_DIR"
echo "📁 Directorio del backend: $BACKEND_DIR"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ Error: No se encontró el directorio backend"
    exit 1
fi

# Crear el archivo de servicio systemd
echo "📝 Creando archivo de servicio systemd..."

sudo tee /etc/systemd/system/mundografic-backend.service > /dev/null << EOF
[Unit]
Description=MundoGrafic Backend (Node/Express)
After=network.target

[Service]
Type=simple
User=mauro_far
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/node $BACKEND_DIR/dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Recargar la configuración de systemd
echo "🔄 Recargando configuración de systemd..."
sudo systemctl daemon-reload

# Habilitar el servicio para que se inicie automáticamente
echo "✅ Habilitando servicio..."
sudo systemctl enable mundografic-backend

# Detener el servicio viejo si existe
echo "🛑 Deteniendo servicio anterior..."
sudo systemctl stop myapp-backend 2>/dev/null || true

# Iniciar el nuevo servicio
echo "🚀 Iniciando nuevo servicio..."
sudo systemctl start mundografic-backend

# Verificar el estado
echo "🔍 Verificando estado del servicio..."
sudo systemctl status mundografic-backend --no-pager -l

echo ""
echo "🎉 ¡Servicio configurado exitosamente!"
echo "📋 Comandos útiles:"
echo "- Ver estado: sudo systemctl status mundografic-backend"
echo "- Ver logs: sudo journalctl -u mundografic-backend -f"
echo "- Reiniciar: sudo systemctl restart mundografic-backend"
echo "- Detener: sudo systemctl stop mundografic-backend"
echo "- Iniciar: sudo systemctl start mundografic-backend"
