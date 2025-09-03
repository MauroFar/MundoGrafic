#!/bin/bash

# Script de configuración completa para staging blue-green
# Sistema: MundoGrafic
# Fecha: $(date)

set -e

echo "🚀 Configurando sistema de staging completo para MundoGrafic..."

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

# Verificar si estamos como root
if [[ $EUID -eq 0 ]]; then
   error "Este script no debe ejecutarse como root"
fi

# Crear directorios de staging
log "Creando estructura de directorios..."
mkdir -p staging/{frontend,backend,database,nginx,logs}
mkdir -p staging/backend/{storage,uploads,firmas,pdfs}
mkdir -p staging/frontend/dist
mkdir -p staging/database/backups

# Configurar base de datos de staging
log "Configurando base de datos de staging..."
sudo -u postgres psql << EOF
CREATE DATABASE mundografic_staging;
CREATE USER mundografic_user WITH PASSWORD 'mundografic_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE mundografic_staging TO mundografic_user;
ALTER USER mundografic_user CREATEDB;
\q
EOF

# Crear archivo de configuración de nginx para staging
log "Configurando nginx para staging..."
cat > staging/nginx/staging.conf << 'EOF'
server {
    listen 8080;
    server_name staging.mundografic.com localhost;
    
    # Frontend
    location / {
        root /home/mundografic/staging/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
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
    }
    
    # Logs
    access_log /var/log/nginx/staging_access.log;
    error_log /var/log/nginx/staging_error.log;
}
EOF

# Crear archivo de configuración de knex para staging
log "Configurando Knex para staging..."
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
log "Creando scripts de inicio..."
cat > staging/start-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Iniciando sistema de staging..."

# Iniciar backend
echo "📡 Iniciando backend..."
cd backend
npm run build
npm start &
BACKEND_PID=$!

# Iniciar frontend
echo "🌐 Iniciando frontend..."
cd ../frontend
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

# Crear script de backup de staging
cat > staging/backup-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "💾 Creando backup de staging..."

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="database/backups/staging_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Backup de base de datos
echo "📊 Backup de base de datos..."
pg_dump -h localhost -U mundografic_user -d mundografic_staging > "$BACKUP_DIR/database.sql"

# Backup de archivos
echo "📁 Backup de archivos..."
tar -czf "$BACKUP_DIR/files.tar.gz" backend/storage frontend/dist

echo "✅ Backup completado: $BACKUP_DIR"
EOF

chmod +x staging/backup-staging.sh

# Crear script de restauración
cat > staging/restore-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "❌ Uso: $0 <directorio_backup>"
    echo "Ejemplo: $0 database/backups/staging_20241201_143022"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Directorio de backup no encontrado: $BACKUP_DIR"
    exit 1
fi

echo "🔄 Restaurando desde backup: $BACKUP_DIR"

# Restaurar base de datos
if [ -f "$BACKUP_DIR/database.sql" ]; then
    echo "📊 Restaurando base de datos..."
    psql -h localhost -U mundografic_user -d mundografic_staging < "$BACKUP_DIR/database.sql"
fi

# Restaurar archivos
if [ -f "$BACKUP_DIR/files.tar.gz" ]; then
    echo "📁 Restaurando archivos..."
    tar -xzf "$BACKUP_DIR/files.tar.gz"
fi

echo "✅ Restauración completada"
EOF

chmod +x staging/restore-staging.sh

# Crear archivo de configuración de PM2 para staging
log "Configurando PM2 para staging..."
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

# Crear script de despliegue completo
cat > staging/deploy-staging.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Desplegando sistema de staging completo..."

# Detener servicios si están corriendo
./stop-staging.sh

# Actualizar código desde git
echo "📥 Actualizando código desde git..."
git pull origin main

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

# Crear archivo de configuración de variables de entorno para staging
log "Creando archivo de variables de entorno..."
cat > staging/staging.env << 'EOF'
# Configuración de Staging
NODE_ENV=staging
PORT=3001
FRONTEND_PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mundografic_staging
DB_USER=mundografic_user
DB_PASSWORD=mundografic_pass_2024

# JWT
JWT_SECRET=mundografic_staging_secret_key_2024
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080,http://staging.mundografic.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=staging@mundografic.com
EMAIL_PASS=staging_email_pass

# Storage
STORAGE_PATH=./storage
UPLOAD_PATH=./storage/uploads
FIRMAS_PATH=./storage/firmas
PDFS_PATH=./storage/pdfs

# Logs
LOG_LEVEL=debug
LOG_FILE=./logs/staging.log
EOF

# Crear archivo README para staging
log "Creando documentación..."
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

### Crear backup
```bash
./backup-staging.sh
```

### Restaurar backup
```bash
./restore-staging.sh <directorio_backup>
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

log "✅ Configuración de staging completada!"
echo ""
echo "🎯 Próximos pasos:"
echo "1. Copiar este directorio 'staging' a tu servidor"
echo "2. Ejecutar: chmod +x staging/*.sh"
echo "3. Configurar nginx con el archivo staging/nginx/staging.conf"
echo "4. Ejecutar: ./staging/deploy-staging.sh"
echo ""
echo "📁 Archivos creados:"
echo "   - staging/staging.env (variables de entorno)"
echo "   - staging/start-staging.sh (inicio de servicios)"
echo "   - staging/stop-staging.sh (parada de servicios)"
echo "   - staging/deploy-staging.sh (despliegue completo)"
echo "   - staging/backup-staging.sh (backup del sistema)"
echo "   - staging/restore-staging.sh (restauración)"
echo "   - staging/ecosystem-staging.config.js (configuración PM2)"
echo "   - staging/nginx/staging.conf (configuración nginx)"
echo "   - staging/README-STAGING.md (documentación)"
