#!/bin/bash
# ============================================================================
# Script unificado para ejecutar migraciones con Knex
# Uso: ./migrate.sh [entorno]
# Ejemplos:
#   ./migrate.sh           # Desarrollo (local)
#   ./migrate.sh production  # Producción (servidor)
# ============================================================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Determinar el entorno
ENVIRONMENT=${1:-development}

print_color $BLUE "╔════════════════════════════════════════════════╗"
print_color $BLUE "║   SISTEMA DE MIGRACIONES - MUNDOGRAFIC         ║"
print_color $BLUE "╚════════════════════════════════════════════════╝"
echo ""
print_color $YELLOW "🌍 Entorno: $ENVIRONMENT"
echo ""

# Cargar variables de entorno
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f .env.production ]; then
        print_color $RED "❌ Error: No existe archivo .env.production"
        exit 1
    fi
    export $(cat .env.production | grep -v '^#' | xargs)
    print_color $YELLOW "📄 Variables cargadas desde: .env.production"
elif [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_color $YELLOW "📄 Variables cargadas desde: .env"
fi

echo ""
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Conexión a Base de Datos:"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📡 Host:     $DB_HOST"
echo "  🗄️  Base:     $DB_NAME"
echo "  👤 Usuario:  $DB_USER"
echo "  🔌 Puerto:   ${DB_PORT:-5432}"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar conexión a la base de datos
print_color $YELLOW "🔍 Verificando conexión a la base de datos..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p ${DB_PORT:-5432} -c "\q" 2>/dev/null; then
    print_color $RED "❌ Error: No se puede conectar a la base de datos"
    print_color $YELLOW "   Verifica que PostgreSQL esté corriendo y las credenciales sean correctas"
    exit 1
fi
print_color $GREEN "✅ Conexión exitosa a la base de datos"
echo ""

# Si es producción, preguntar confirmación
if [ "$ENVIRONMENT" = "production" ]; then
    print_color $RED "⚠️  ADVERTENCIA: Estás a punto de ejecutar migraciones en PRODUCCIÓN"
    print_color $YELLOW "   Esto puede modificar la estructura de la base de datos"
    echo ""
    read -p "   ¿Deseas continuar? (escribe 'SI' para confirmar): " confirm
    if [ "$confirm" != "SI" ]; then
        print_color $YELLOW "❌ Operación cancelada por el usuario"
        exit 0
    fi
    echo ""
    
    # Crear backup antes de migrar en producción
    print_color $YELLOW "💾 Creando backup de seguridad..."
    BACKUP_FILE="backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql"
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    if PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -p ${DB_PORT:-5432} -F p -f "$BACKUP_DIR/$BACKUP_FILE"; then
        print_color $GREEN "✅ Backup creado: $BACKUP_DIR/$BACKUP_FILE"
        print_color $GREEN "   Tamaño: $(du -h $BACKUP_DIR/$BACKUP_FILE | cut -f1)"
    else
        print_color $RED "❌ Error al crear backup. Abortando migraciones."
        exit 1
    fi
    echo ""
fi

# Verificar estado de migraciones
print_color $YELLOW "📋 Verificando estado de migraciones..."
npx knex migrate:status --env $ENVIRONMENT
echo ""

# Listar migraciones pendientes
print_color $YELLOW "🔍 Migraciones pendientes:"
npx knex migrate:list --env $ENVIRONMENT 2>/dev/null || echo "  (Ninguna pendiente)"
echo ""

# Ejecutar migraciones
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_color $BLUE "  🚀 EJECUTANDO MIGRACIONES"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if npx knex migrate:latest --env $ENVIRONMENT; then
    echo ""
    print_color $GREEN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_color $GREEN "  ✅ MIGRACIONES COMPLETADAS EXITOSAMENTE"
    print_color $GREEN "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Mostrar estado final
    print_color $YELLOW "📊 Estado final de migraciones:"
    npx knex migrate:status --env $ENVIRONMENT
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo ""
        print_color $GREEN "💾 Backup disponible en: $BACKUP_DIR/$BACKUP_FILE"
        print_color $YELLOW "   (Puedes eliminarlo manualmente si todo funciona correctamente)"
    fi
else
    echo ""
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_color $RED "  ❌ ERROR EN LAS MIGRACIONES"
    print_color $RED "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo ""
        print_color $YELLOW "🔄 Puedes restaurar el backup con:"
        print_color $YELLOW "   PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME < $BACKUP_DIR/$BACKUP_FILE"
    fi
    
    exit 1
fi

echo ""
print_color $BLUE "╔════════════════════════════════════════════════╗"
print_color $BLUE "║              PROCESO FINALIZADO                ║"
print_color $BLUE "╚════════════════════════════════════════════════╝"
