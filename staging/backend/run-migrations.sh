#!/bin/bash

# Script para ejecutar migraciones de base de datos
# Uso: ./run-migrations.sh [ambiente]
# ambiente puede ser: local, desarrollo, produccion

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_message() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL no está instalado o no está en el PATH. Asegúrate de que esté disponible."
fi

# Ambiente por defecto
ENVIRONMENT=${1:-local}

print_message "🚀 Iniciando migraciones para ambiente: $ENVIRONMENT"

# Cargar variables de entorno según el ambiente
if [ "$ENVIRONMENT" = "local" ]; then
    print_message "📁 Cargando configuración local..."
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_NAME=mundografic
    export DB_USER=postgres
    export DB_PASSWORD=tu_password
elif [ "$ENVIRONMENT" = "desarrollo" ]; then
    print_message "📁 Cargando configuración de desarrollo..."
    # Cargar desde archivo .env si existe
    if [ -f ".env.development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
    fi
elif [ "$ENVIRONMENT" = "produccion" ]; then
    print_message "📁 Cargando configuración de producción..."
    # Cargar desde archivo .env si existe
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
else
    print_error "Ambiente '$ENVIRONMENT' no válido. Usa: local, desarrollo, o produccion"
    exit 1
fi

# Verificar variables de entorno críticas
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    print_error "Variables de entorno de base de datos no configuradas correctamente"
    print_message "Variables requeridas: DB_HOST, DB_NAME, DB_USER"
    exit 1
fi

print_message "🔧 Configuración de base de datos:"
print_message "   Host: $DB_HOST"
print_message "   Puerto: ${DB_PORT:-5432}"
print_message "   Base de datos: $DB_NAME"
print_message "   Usuario: $DB_USER"

# Verificar conexión a la base de datos
print_message "🔍 Verificando conexión a la base de datos..."
if command -v psql &> /dev/null; then
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Conexión a la base de datos exitosa"
    else
        print_error "No se puede conectar a la base de datos"
        print_message "Verifica las credenciales y que PostgreSQL esté ejecutándose"
        exit 1
    fi
else
    print_warning "No se puede verificar la conexión (psql no disponible)"
fi

# Navegar al directorio del backend
cd "$(dirname "$0")"

# Verificar que existe el archivo de migraciones
if [ ! -f "src/db/migrate.js" ]; then
    print_error "Archivo de migraciones no encontrado: src/db/migrate.js"
    exit 1
fi

# Ejecutar migraciones
print_message "🔄 Ejecutando migraciones..."
if node src/db/migrate.js; then
    print_success "Migraciones ejecutadas exitosamente"
else
    print_error "Error ejecutando migraciones"
    exit 1
fi

print_message "🎉 Proceso completado"
