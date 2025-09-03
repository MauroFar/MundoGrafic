#!/bin/bash

# Script de configuración inicial para servidor Blue-Green de MundoGrafic
# Ejecutar como root en tu servidor Debian

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_NAME="mundografic"
DOMAIN=""  # Se pedirá al usuario

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar si estamos ejecutando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Este script debe ejecutarse como root (sudo)"
        exit 1
    fi
}

# Obtener información del usuario
get_user_input() {
    echo ""
    echo "🚀 Configuración del Servidor Blue-Green para MundoGrafic"
    echo "========================================================"
    echo ""
    
    # Pedir dominio
    read -p "🌐 Ingresa tu dominio (o presiona Enter para usar IP): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        DOMAIN="_"
        warn "Usando IP del servidor como dominio"
    fi
    
    echo ""
    echo "📋 Resumen de configuración:"
    echo "   Dominio: $DOMAIN"
    echo "   Aplicación: $APP_NAME"
    echo "   Entornos: Blue y Green"
    echo ""
    
    read -p "¿Continuar con esta configuración? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log "Configuración cancelada"
        exit 0
    fi
}

# Actualizar sistema
update_system() {
    log "Actualizando sistema..."
    apt update && apt upgrade -y
}

# Instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    
    # Paquetes básicos
    apt install -y curl wget git build-essential unzip software-properties-common
    
    # Instalar Node.js 18.x
    log "Instalando Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Instalar Nginx
    log "Instalando Nginx..."
    apt install -y nginx
    
    # Instalar PostgreSQL (opcional)
    read -p "🗄️  ¿Instalar PostgreSQL para la base de datos? (y/N): " install_pg
    if [[ $install_pg =~ ^[Yy]$ ]]; then
        log "Instalando PostgreSQL..."
        apt install -y postgresql postgresql-contrib
    fi
    
    # Instalar PM2 para gestión de procesos
    log "Instalando PM2..."
    npm install -g pm2
}

# Crear usuario para la aplicación
create_app_user() {
    log "Creando usuario para la aplicación..."
    
    if ! id "app" &>/dev/null; then
        useradd -m -s /bin/bash app
        usermod -aG sudo app
        
        # Generar contraseña aleatoria
        local password=$(openssl rand -base64 32)
        echo "app:$password" | chpasswd
        
        log "Usuario 'app' creado con contraseña: $password"
        warn "⚠️  GUARDA ESTA CONTRASEÑA - no se mostrará de nuevo"
    else
        log "Usuario 'app' ya existe"
    fi
}

# Configurar directorios Blue-Green
setup_directories() {
    log "Configurando directorios Blue-Green..."
    
    # Directorios principales
    mkdir -p /opt/$APP_NAME/{frontend,backend}
    mkdir -p /var/www/$APP_NAME-{blue,green}
    mkdir -p /var/backups/$APP_NAME
    mkdir -p /var/log/$APP_NAME
    
    # Crear enlace simbólico inicial (apunta a Blue por defecto)
    ln -sf /var/www/$APP_NAME-blue /var/www/$APP_NAME
    
    # Establecer permisos
    chown -R app:app /opt/$APP_NAME
    chown -R www-data:www-data /var/www/$APP_NAME-{blue,green}
    chown -R app:app /var/backups/$APP_NAME
    chown -R app:app /var/log/$APP_NAME
    
    chmod -R 755 /var/www/$APP_NAME-{blue,green}
    chmod -R 755 /var/backups/$APP_NAME
    chmod -R 755 /var/log/$APP_NAME
}

# Configurar Nginx
configure_nginx() {
    log "Configurando Nginx..."
    
    # Crear configuración del sitio
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Logs personalizados
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;
    
    # Root directory (enlace simbólico que cambia entre Blue/Green)
    root /var/www/$APP_NAME;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Manejar React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Proxy para API del backend
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Limitar tamaño de archivos
    client_max_body_size 100M;
}
EOF
    
    # Habilitar el sitio
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Remover configuración por defecto
    rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración
    nginx -t
    
    # Habilitar e iniciar Nginx
    systemctl enable nginx
    systemctl start nginx
}

# Configurar firewall
configure_firewall() {
    log "Configurando firewall..."
    
    # Permitir SSH
    ufw allow ssh
    
    # Permitir HTTP y HTTPS
    ufw allow 'Nginx Full'
    
    # Habilitar firewall
    ufw --force enable
    
    log "Firewall configurado y habilitado"
}

# Crear scripts de gestión
create_management_scripts() {
    log "Creando scripts de gestión..."
    
    # Script de despliegue Blue-Green
    cat > /opt/$APP_NAME/blue-green-deploy.sh << 'EOF'
#!/bin/bash
# Script de despliegue Blue-Green
# Este archivo se copiará desde tu máquina local
echo "Script de despliegue Blue-Green"
echo "Copiado desde tu máquina local"
EOF
    
    # Script de backup automático
    cat > /opt/$APP_NAME/auto-backup.sh << 'EOF'
#!/bin/bash
# Script de backup automático
cd /opt/mundografic
sudo -u app bash blue-green-deploy.sh status > /var/log/mundografic/status_$(date +%Y%m%d_%H%M%S).log
EOF
    
    # Script de monitoreo
    cat > /opt/$APP_NAME/monitor.sh << 'EOF'
#!/bin/bash
# Script de monitoreo básico
echo "=== Estado del Sistema MundoGrafic ==="
echo "Fecha: $(date)"
echo ""

# Estado de Nginx
echo "Nginx:"
systemctl is-active --quiet nginx && echo "  ✅ Ejecutándose" || echo "  ❌ Detenido"

# Estado del backend
echo "Backend:"
netstat -tlnp 2>/dev/null | grep -q ":3000" && echo "  ✅ Puerto 3000 activo" || echo "  ❌ Puerto 3000 inactivo"

# Uso de disco
echo "Uso de disco:"
df -h /var/www /opt/mundografic

# Estado de directorios Blue-Green
echo "Directorios Blue-Green:"
echo "  Blue: $(ls -1 /var/www/mundografic-blue 2>/dev/null | wc -l) archivos"
echo "  Green: $(ls -1 /var/www/mundografic-green 2>/dev/null | wc -l) archivos"
EOF
    
    # Dar permisos de ejecución
    chmod +x /opt/$APP_NAME/*.sh
    
    # Crear tarea cron para backup automático
    echo "0 2 * * * /opt/$APP_NAME/auto-backup.sh" | crontab -u app -
}

# Configurar PM2 para el backend
setup_pm2() {
    log "Configurando PM2 para el backend..."
    
    # Crear archivo de configuración PM2
    cat > /opt/$APP_NAME/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mundografic-backend',
    script: 'src/server.ts',
    cwd: '/opt/mundografic/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/mundografic/err.log',
    out_file: '/var/log/mundografic/out.log',
    log_file: '/var/log/mundografic/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10
  }]
};
EOF
    
    # Configurar PM2 para inicio automático
    sudo -u app pm2 startup
}

# Mostrar resumen final
show_final_summary() {
    echo ""
    echo "🎉 ¡Configuración del servidor Blue-Green completada!"
    echo "=================================================="
    echo ""
    echo "📁 Estructura de directorios creada:"
    echo "   /opt/$APP_NAME/           - Código fuente"
    echo "   /var/www/$APP_NAME-blue/  - Entorno Blue"
    echo "   /var/www/$APP_NAME-green/ - Entorno Green"
    echo "   /var/backups/$APP_NAME/   - Backups automáticos"
    echo "   /var/log/$APP_NAME/       - Logs de la aplicación"
    echo ""
    echo "🔧 Servicios configurados:"
    echo "   ✅ Nginx (puerto 80)"
    echo "   ✅ PM2 para backend"
    echo "   ✅ Usuario 'app' creado"
    echo "   ✅ Firewall configurado"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Copia tu código frontend a /opt/$APP_NAME/frontend/"
    echo "2. Copia tu código backend a /opt/$APP_NAME/backend/"
    echo "3. Copia el script blue-green-deploy.sh a /opt/$APP_NAME/"
    echo "4. Configura las variables de entorno"
    echo "5. Ejecuta el primer despliegue: sudo bash /opt/$APP_NAME/blue-green-deploy.sh blue"
    echo ""
    echo "🌐 Tu aplicación estará disponible en: http://$DOMAIN"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   - Ver estado: sudo bash /opt/$APP_NAME/blue-green-deploy.sh status"
    echo "   - Desplegar en Blue: sudo bash /opt/$APP_NAME/blue-green-deploy.sh blue"
    echo "   - Desplegar en Green: sudo bash /opt/$APP_NAME/blue-green-deploy.sh green"
    echo "   - Cambiar entorno: sudo bash /opt/$APP_NAME/blue-green-deploy.sh switch"
    echo "   - Monitorear: sudo bash /opt/$APP_NAME/monitor.sh"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - La contraseña del usuario 'app' se mostró arriba"
    echo "   - El backend debe ejecutarse en el puerto 3000"
    echo "   - Los backups se crean automáticamente cada día a las 2:00 AM"
}

# Función principal
main() {
    check_root
    get_user_input
    
    log "Iniciando configuración del servidor Blue-Green..."
    
    update_system
    install_dependencies
    create_app_user
    setup_directories
    configure_nginx
    configure_firewall
    create_management_scripts
    setup_pm2
    
    show_final_summary
}

# Ejecutar función principal
main "$@"
