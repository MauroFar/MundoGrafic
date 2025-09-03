#!/bin/bash

# Script para configurar base de datos de staging
# Sistema: MundoGrafic
# Compatible con configuración existente

set -e

echo "🗄️ Configurando base de datos de staging..."

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Verificar si el servicio está corriendo
if ! sudo systemctl is-active --quiet postgresql; then
    echo "🔄 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Verificar si la base de datos ya existe
echo "🔍 Verificando base de datos existente..."
if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw sistema_mg_staging; then
    echo "✅ Base de datos 'sistema_mg_staging' ya existe"
else
    echo "📊 Creando base de datos 'sistema_mg_staging'..."
    sudo -u postgres psql << 'EOF'
CREATE DATABASE sistema_mg_staging;
\q
EOF
fi

# Verificar permisos del usuario postgres
echo "👤 Verificando permisos del usuario postgres..."
sudo -u postgres psql << 'EOF'
-- Verificar si el usuario postgres tiene permisos en la base de datos
GRANT ALL PRIVILEGES ON DATABASE sistema_mg_staging TO postgres;
ALTER USER postgres CREATEDB;

-- Conectar a la base de datos de staging
\c sistema_mg_staging

-- Otorgar privilegios en la base de datos
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Configurar permisos por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
EOF

echo "✅ Base de datos de staging configurada"
echo "📊 Base de datos: sistema_mg_staging"
echo "👤 Usuario: postgres"
echo "🔑 Contraseña: 2024Asdaspro@"
echo "🌐 Host: localhost"
echo "🔌 Puerto: 5432"

# Crear archivo de configuración de conexión
echo "📝 Creando archivo de configuración de conexión..."
cat > staging-db-config.txt << EOF
# Configuración de conexión a base de datos de staging
# Compatible con .env.green existente

Host: localhost
Port: 5432
Database: sistema_mg_staging
Username: postgres
Password: 2024Asdaspro@

# Comando de conexión:
psql -h localhost -U postgres -d sistema_mg_staging

# Variables de entorno (compatibles con .env.green):
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=sistema_mg_staging
export DB_USER=postgres
export DB_PASSWORD=2024Asdaspro@

# Nota: Esta configuración es compatible con tu .env.green existente
EOF

echo "📁 Archivo de configuración creado: staging-db-config.txt"
echo ""
echo "✅ Configuración completada y compatible con tu .env.green existente"
