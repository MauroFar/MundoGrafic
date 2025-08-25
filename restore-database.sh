#!/bin/bash

# Script para restaurar la base de datos desde un backup
# Uso: sudo bash restore-database.sh [nombre_backup]

set -e

# Configuración
DB_NAME="mundografic"
DB_USER="postgres"
BACKUP_DIR="backups"

if [ $# -eq 0 ]; then
    echo "❌ Error: Debes especificar el nombre del backup"
    echo "💡 Uso: sudo bash restore-database.sh [nombre_backup]"
    echo ""
    echo "📋 Backups disponibles:"
    ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | while read file; do
        filename=$(basename "$file" .sql.gz)
        echo "   - $filename"
    done
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"
METADATA_FILE="${BACKUP_DIR}/${BACKUP_NAME}.json"

echo "🔄 Iniciando restauración de la base de datos..."
echo "📅 Fecha: $(date)"
echo "🗄️  Base de datos: $DB_NAME"
echo "📁 Backup: $BACKUP_NAME"

# Verificar que el archivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de backup: $BACKUP_FILE"
    echo "📋 Backups disponibles:"
    ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | while read file; do
        filename=$(basename "$file" .sql.gz)
        echo "   - $filename"
    done
    exit 1
fi

# Verificar que PostgreSQL esté corriendo
if ! pg_isready -U $DB_USER > /dev/null 2>&1; then
    echo "❌ Error: PostgreSQL no está corriendo"
    exit 1
fi

# Mostrar información del backup
if [ -f "$METADATA_FILE" ]; then
    echo "📋 Información del backup:"
    cat "$METADATA_FILE" | jq -r '. | "   Fecha: \(.created_at)\n   Descripción: \(.description)\n   Tamaño: \(.file_size)"' 2>/dev/null || echo "   Metadata no disponible"
fi

# Confirmación del usuario
echo ""
echo "⚠️  ADVERTENCIA: Esta operación sobrescribirá completamente la base de datos actual"
echo "📊 Tamaño del backup: $(du -h $BACKUP_FILE | cut -f1)"
echo ""
echo "¿Estás seguro de que quieres continuar? (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Restauración cancelada"
    exit 0
fi

# Crear backup de la base de datos actual antes de restaurar
echo "🔄 Creando backup de seguridad de la base de datos actual..."
CURRENT_BACKUP="backup_antes_restauracion_$(date +"%Y-%m-%d_%H-%M-%S")"
sudo bash backup-database.sh "$CURRENT_BACKUP" > /dev/null 2>&1
echo "✅ Backup de seguridad creado: $CURRENT_BACKUP"

# Detener aplicaciones que usen la base de datos
echo "🛑 Deteniendo aplicaciones..."
sudo systemctl stop myapp || true
sudo systemctl stop nginx || true

# Restaurar la base de datos
echo "📦 Restaurando base de datos..."
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d postgres

# Verificar que la restauración fue exitosa
echo "✅ Verificando restauración..."
if sudo -u postgres psql -d $DB_NAME -c "SELECT COUNT(*) FROM usuarios;" > /dev/null 2>&1; then
    echo "✅ Restauración completada exitosamente!"
    echo "📊 Usuarios en la base de datos: $(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM usuarios;" | xargs)"
else
    echo "❌ Error: La restauración falló"
    echo "🔄 Restaurando desde el backup de seguridad..."
    gunzip -c "${BACKUP_DIR}/${CURRENT_BACKUP}.sql.gz" | sudo -u postgres psql -d postgres
    echo "✅ Base de datos restaurada desde el backup de seguridad"
    exit 1
fi

# Reiniciar aplicaciones
echo "🔄 Reiniciando aplicaciones..."
sudo systemctl start myapp || true
sudo systemctl start nginx || true

echo ""
echo "🎉 Restauración completada exitosamente!"
echo "📁 Backup restaurado: $BACKUP_NAME"
echo "📁 Backup de seguridad: $CURRENT_BACKUP"
echo "💡 Para verificar: sudo -u postgres psql -d $DB_NAME -c 'SELECT COUNT(*) FROM usuarios;'"
