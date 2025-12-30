#!/bin/bash
# ============================================================================
# Script para ejecutar migraciones en PRODUCCIÓN de forma segura
# Este script DEBE ejecutarse en el servidor de producción
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

clear
print_color $RED "╔════════════════════════════════════════════════════════════════╗"
print_color $RED "║                                                                ║"
print_color $RED "║         MIGRACIONES EN PRODUCCIÓN - MUNDOGRAFIC                ║"
print_color $RED "║                                                                ║"
print_color $RED "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que estemos en el servidor
print_color $YELLOW "⚠️  ADVERTENCIA: Este script ejecutará migraciones en PRODUCCIÓN"
print_color $YELLOW "   Solo debe ejecutarse en el servidor de producción"
echo ""
print_color $YELLOW "📍 Ubicación actual: $(pwd)"
print_color $YELLOW "🖥️  Servidor: $(hostname)"
echo ""

# Confirmación 1
read -p "¿Estás en el servidor de PRODUCCIÓN? (SI/no): " confirm1
if [ "$confirm1" != "SI" ]; then
    print_color $RED "❌ Operación cancelada"
    exit 0
fi

# Verificar que existe el archivo de producción
if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
    print_color $RED "❌ Error: No se encuentra archivo de configuración (.env o .env.production)"
    exit 1
fi

# Cargar variables
if [ -f ".env.production" ]; then
    source .env.production
    ENV_FILE=".env.production"
else
    source .env
    ENV_FILE=".env"
fi

echo ""
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_color $BLUE "  INFORMACIÓN DE LA BASE DE DATOS"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📄 Config:   $ENV_FILE"
echo "  🗄️  Base:     ${DB_NAME}"
echo "  📡 Host:     ${DB_HOST}"
echo "  👤 Usuario:  ${DB_USER}"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar conexión
print_color $YELLOW "🔍 Verificando conexión a la base de datos..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\q" 2>/dev/null; then
    print_color $RED "❌ Error: No se puede conectar a la base de datos"
    exit 1
fi
print_color $GREEN "✅ Conexión exitosa"
echo ""

# Ver estado actual
print_color $YELLOW "📊 Estado actual de migraciones:"
npx knex migrate:status --env production 2>&1 | head -20
echo ""

# Listar migraciones pendientes
print_color $YELLOW "📋 Migraciones que se ejecutarán:"
echo ""
npx knex migrate:list --env production 2>&1 || true
echo ""

# Confirmación 2
print_color $RED "⚠️  ÚLTIMA CONFIRMACIÓN"
print_color $YELLOW "   Se creará un backup automático antes de ejecutar"
print_color $YELLOW "   Las migraciones modificarán la base de datos de producción"
echo ""
read -p "¿Proceder con las migraciones? (escribe 'EJECUTAR' para confirmar): " confirm2
if [ "$confirm2" != "EJECUTAR" ]; then
    print_color $RED "❌ Operación cancelada por seguridad"
    exit 0
fi

echo ""
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_color $BLUE "  INICIANDO PROCESO DE MIGRACIÓN"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Crear directorio de backups
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Crear backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_pre_migration_$TIMESTAMP.sql"

print_color $YELLOW "💾 Creando backup de seguridad..."
print_color $YELLOW "   Archivo: $BACKUP_FILE"

if PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F p -f "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_color $GREEN "✅ Backup creado exitosamente"
    print_color $GREEN "   Tamaño: $BACKUP_SIZE"
    print_color $GREEN "   Ubicación: $BACKUP_FILE"
else
    print_color $RED "❌ Error al crear backup. ABORTANDO migraciones por seguridad."
    exit 1
fi

# Comprimir backup
print_color $YELLOW "🗜️  Comprimiendo backup..."
if gzip "$BACKUP_FILE"; then
    BACKUP_FILE="${BACKUP_FILE}.gz"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_color $GREEN "✅ Backup comprimido: $BACKUP_SIZE"
fi

echo ""
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_color $BLUE "  EJECUTANDO MIGRACIONES"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ejecutar migraciones
if NODE_ENV=production npx knex migrate:latest --env production; then
    echo ""
    print_color $GREEN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_color $GREEN "  ✅ MIGRACIONES COMPLETADAS EXITOSAMENTE"
    print_color $GREEN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Mostrar estado final
    print_color $YELLOW "📊 Estado final de migraciones:"
    npx knex migrate:status --env production
    
    echo ""
    print_color $GREEN "💾 Backup guardado en: $BACKUP_FILE"
    print_color $YELLOW "   Puedes eliminarlo después de verificar que todo funciona correctamente"
    
    echo ""
    print_color $BLUE "╔════════════════════════════════════════════════════════════════╗"
    print_color $BLUE "║                 ✅ PROCESO COMPLETADO                           ║"
    print_color $BLUE "╚════════════════════════════════════════════════════════════════╝"
    
else
    echo ""
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_color $RED "  ❌ ERROR EN LAS MIGRACIONES"
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_color $YELLOW "🔄 Para restaurar el backup, ejecuta:"
    echo ""
    if [[ $BACKUP_FILE == *.gz ]]; then
        print_color $YELLOW "   gunzip $BACKUP_FILE"
        print_color $YELLOW "   PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME < ${BACKUP_FILE%.gz}"
    else
        print_color $YELLOW "   PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME < $BACKUP_FILE"
    fi
    
    echo ""
    print_color $RED "💾 Backup disponible en: $BACKUP_FILE"
    exit 1
fi
