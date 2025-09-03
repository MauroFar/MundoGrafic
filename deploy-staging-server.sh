#!/bin/bash

# Script de despliegue completo para staging en servidor
# Sistema: MundoGrafic
# Uso: ./deploy-staging-server.sh

set -e

echo "🚀 Desplegando sistema de staging completo en servidor..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Debes ejecutar este script desde el directorio raíz del proyecto"
fi

# Crear directorio de staging si no existe
log "📁 Preparando directorio de staging..."
mkdir -p staging

# Copiar archivos del backend
log "📦 Copiando backend..."
cp -r backend/* staging/backend/ 2>/dev/null || mkdir -p staging/backend && cp -r backend/* staging/backend/

# Copiar archivos del frontend
log "🌐 Copiando frontend..."
cp -r src/* staging/frontend/ 2>/dev/null || mkdir -p staging/frontend && cp -r src/* staging/frontend/
cp package.json staging/frontend/
cp vite.config.js staging/frontend/
cp tsconfig.json staging/frontend/

# Crear estructura de directorios
log "🏗️ Creando estructura de directorios..."
mkdir -p staging/{database,nginx,logs}
mkdir -p staging/backend/{storage,uploads,firmas,pdfs}
mkdir -p staging/frontend/dist
mkdir -p staging/database/backups

# Copiar archivos de configuración
log "⚙️ Copiando archivos de configuración..."
cp staging.env staging/
cp -r backend/src/db/migrations staging/backend/src/db/ 2>/dev/null || true
cp -r backend/src/db/seeds staging/backend/src/db/ 2>/dev/null || true

# Crear archivo de configuración de knex para staging
log "🗄️ Configurando Knex para staging..."
cat > staging/backend/knexfile.js << 'EOF'
require('dotenv').config({ path: '../staging.env' });

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  }
};
EOF

# Crear script de inicio para staging
log "▶️ Creando scripts de inicio..."
cat > staging/start-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Iniciando sistema de staging..."

# Iniciar backend
echo "📡 Iniciando backend..."
cd backend
npm install
npm run build
npm start &
BACKEND_PID=$!

# Iniciar frontend
echo "🌐 Iniciando frontend..."
cd ../frontend
npm install
npm run build
npx serve -s dist -l 3000 &
FRONTEND_PID=$!

# Guardar PIDs
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo "✅ Sistema de staging iniciado:"
echo "   Backend: http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "   Nginx: http://localhost:8080"

# Función de limpieza
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f ../backend.pid ../frontend.pid
    exit 0
}

trap cleanup SIGINT SIGTERM

# Mantener script corriendo
wait
EOF

chmod +x staging/start-staging.sh

# Crear script de parada
cat > staging/stop-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🛑 Deteniendo sistema de staging..."

# Detener backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm -f backend.pid
    echo "✅ Backend detenido"
fi

# Detener frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f frontend.pid
    echo "✅ Frontend detenido"
fi

echo "✅ Sistema de staging detenido"
EOF

chmod +x staging/stop-staging.sh

# Crear script de despliegue
cat > staging/deploy-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Desplegando sistema de staging..."

# Detener servicios si están corriendo
./stop-staging.sh

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
npm run build
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
npm run build
cd ..

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
cd backend
npm run migrate
cd ..

# Iniciar servicios
echo "▶️ Iniciando servicios..."
./start-staging.sh

echo "✅ Despliegue de staging completado!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:3001"
echo "🌍 Nginx: http://localhost:8080"
EOF

chmod +x staging/deploy-staging.sh

# Crear archivo de configuración de PM2
log "⚙️ Configurando PM2..."
cat > staging/ecosystem-staging.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'mundografic-backend-staging',
      script: './backend/dist/server.js',
      cwd: './',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'mundografic-frontend-staging',
      script: 'npx',
      args: 'serve -s frontend/dist -l 3000',
      cwd: './',
      env: {
        NODE_ENV: 'staging'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF

# Crear archivo de configuración de nginx
log "🌐 Configurando nginx..."
cat > staging/nginx/staging.conf << 'EOF'
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

# Crear archivo README
log "📚 Creando documentación..."
cat > staging/README-STAGING.md << 'EOF'
# Sistema de Staging - MundoGrafic

## Descripción
Este es el entorno de staging completo para probar el sistema MundoGrafic sin afectar la producción.

## Estructura
```
staging/
├── frontend/          # Frontend de React
├── backend/           # Backend de Node.js
├── database/          # Base de datos y backups
├── nginx/             # Configuración de nginx
├── logs/              # Logs del sistema
├── start-staging.sh   # Script de inicio
├── stop-staging.sh    # Script de parada
├── deploy-staging.sh  # Script de despliegue
└── staging.env        # Variables de entorno
```

## Comandos principales

### Iniciar staging
```bash
./start-staging.sh
```

### Detener staging
```bash
./stop-staging.sh
```

### Desplegar actualizaciones
```bash
./deploy-staging.sh
```

## Puertos
- Frontend: 3000
- Backend: 3001
- Nginx: 8080
- Base de datos: 5432

## Acceso
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Nginx: http://localhost:8080

## Base de datos
- Nombre: mundografic_staging
- Usuario: mundografic_user
- Contraseña: mundografic_pass_2024

## Notas importantes
- Este entorno es completamente independiente de producción
- Los datos se almacenan en directorios separados
- Se puede hacer backup/restore sin afectar producción
- Usar PM2 para gestión de procesos en producción
EOF

# Crear script de instalación de dependencias
log "📦 Creando script de instalación..."
cat > staging/install-dependencies.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "📦 Instalando dependencias del sistema..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "📥 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📥 Instalando PM2..."
    sudo npm install -g pm2
fi

# Verificar si serve está instalado
if ! command -v serve &> /dev/null; then
    echo "📥 Instalando serve..."
    sudo npm install -g serve
fi

echo "✅ Dependencias instaladas"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
EOF

chmod +x staging/install-dependencies.sh

log "✅ Sistema de staging preparado completamente!"
echo ""
echo "🎯 Próximos pasos en el servidor:"
echo "1. Copiar el directorio 'staging' al servidor"
echo "2. Ejecutar: chmod +x staging/*.sh"
echo "3. Ejecutar: ./staging/install-dependencies.sh"
echo "4. Configurar nginx con: ./staging/nginx/staging.conf"
echo "5. Ejecutar: ./staging/deploy-staging.sh"
echo ""
echo "📁 Archivos creados en staging/:"
echo "   - start-staging.sh (inicio de servicios)"
echo "   - stop-staging.sh (parada de servicios)"
echo "   - deploy-staging.sh (despliegue completo)"
echo "   - install-dependencies.sh (instalación de dependencias)"
echo "   - ecosystem-staging.config.js (configuración PM2)"
echo "   - nginx/staging.conf (configuración nginx)"
echo "   - README-STAGING.md (documentación)"
echo ""
echo "🌐 El sistema estará disponible en:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo "   - Nginx: http://localhost:8080"
