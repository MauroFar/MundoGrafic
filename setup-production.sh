#!/bin/bash

# Script de configuración inicial para el servidor de producción
# Ejecutar como root o con sudo

set -e

echo "🚀 Configurando servidor de producción para MundoGrafic..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias necesarias
echo "🔧 Instalando dependencias..."
apt install -y nginx curl wget git build-essential

# Instalar Node.js 18.x
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalación
echo "✅ Verificando instalación..."
node --version
npm --version
nginx -v

# Crear usuario para la aplicación
echo "👤 Creando usuario para la aplicación..."
if ! id "app" &>/dev/null; then
    useradd -m -s /bin/bash app
    usermod -aG sudo app
    echo "app:$(openssl rand -base64 32)" | chpasswd
    echo "✅ Usuario 'app' creado con contraseña aleatoria"
else
    echo "ℹ️  Usuario 'app' ya existe"
fi

# Crear directorios de la aplicación
echo "📁 Creando directorios..."
mkdir -p /opt/myapp/{frontend,backend}
mkdir -p /var/www/myapp
mkdir -p /var/log/nginx

# Establecer permisos
chown -R app:app /opt/myapp
chown -R www-data:www-data /var/www/myapp
chmod -R 755 /var/www/myapp

# Configurar firewall básico
echo "🔥 Configurando firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Configurar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/myapp << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/myapp;
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
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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
ln -sf /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
nginx -t

# Iniciar servicios
systemctl enable nginx
systemctl start nginx

# Crear script de despliegue
cat > /opt/myapp/deploy.sh << 'EOF'
#!/bin/bash
cd /opt/myapp/frontend
sudo -u app npm ci --only=production
sudo -u app npm run build
sudo rsync -a --delete dist/ /var/www/myapp/
sudo chown -R www-data:www-data /var/www/myapp
sudo systemctl reload nginx
echo "✅ Despliegue completado!"
EOF

chmod +x /opt/myapp/deploy.sh

echo ""
echo "🎉 ¡Configuración inicial completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copia tu código frontend a /opt/myapp/frontend"
echo "2. Copia tu código backend a /opt/myapp/backend"
echo "3. Configura las variables de entorno"
echo "4. Ejecuta el despliegue"
echo ""
echo "🔧 Comandos útiles:"
echo "- Desplegar: /opt/myapp/deploy.sh"
echo "- Ver logs: sudo tail -f /var/log/nginx/error.log"
echo "- Reiniciar Nginx: sudo systemctl restart nginx"
echo ""
echo "🌐 Tu aplicación estará disponible en: http://$(hostname -I | awk '{print $1}')"
