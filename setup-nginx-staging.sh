#!/bin/bash

# Script para configurar nginx para staging
# Sistema: MundoGrafic

set -e

echo "🌐 Configurando nginx para staging..."

# Verificar si nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
fi

# Crear configuración de staging
sudo tee /etc/nginx/sites-available/staging << 'EOF'
server {
    listen 8080;
    server_name staging.mundografic.com localhost;
    
    # Logs
    access_log /var/log/nginx/staging_access.log;
    error_log /var/log/nginx/staging_error.log;
    
    # Frontend
    location / {
        root /home/mundografic/staging/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/staging /etc/nginx/sites-enabled/

# Verificar configuración
echo "🔍 Verificando configuración de nginx..."
sudo nginx -t

# Recargar nginx
echo "🔄 Recargando nginx..."
sudo systemctl reload nginx

echo "✅ Nginx configurado para staging en puerto 8080"
echo "🌐 Acceso: http://localhost:8080"
echo "📁 Configuración: /etc/nginx/sites-available/staging"
