#!/bin/bash

# Script para hacer backup completo de la base de datos
# Uso: sudo bash backup-database.sh [nombre_opcional]

set -e

# Configuración
DB_NAME="mundografic"
DB_USER="postgres"
BACKUP_DIR="backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="${1:-backup_${DATE}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
METADATA_FILE="${BACKUP_DIR}/${BACKUP_NAME}.json"

echo "🔄 Iniciando backup de la base de datos..."
echo "📅 Fecha: $(date)"
echo "🗄️  Base de datos: $DB_NAME"
echo "📁 Archivo: $BACKUP_FILE"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Verificar que PostgreSQL esté corriendo
if ! pg_isready -U $DB_USER > /dev/null 2>&1; then
    echo "❌ Error: PostgreSQL no está corriendo"
    exit 1
fi

# Crear backup completo
echo "📦 Creando backup completo..."
sudo -u postgres pg_dump -d $DB_NAME --verbose --clean --if-exists --create > "$BACKUP_FILE"

# Comprimir el backup
echo "🗜️  Comprimiendo backup..."
gzip "$BACKUP_FILE"

# Crear archivo de metadata
echo "📋 Creando metadata..."
cat > "$METADATA_FILE" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "database": "$DB_NAME",
  "created_at": "$(date -Iseconds)",
  "file_size": "$(du -h ${COMPRESSED_FILE} | cut -f1)",
  "compressed_size": "$(du -h ${COMPRESSED_FILE} | cut -f1)",
  "original_size": "$(du -h ${BACKUP_FILE}.gz | cut -f1)",
  "description": "Backup completo de la base de datos $DB_NAME",
  "version": "1.0",
  "includes": [
    "Estructura completa de la base de datos",
    "Todos los datos existentes",
    "Índices y constraints",
    "Funciones y triggers"
  ]
}
EOF

# Verificar que el backup se creó correctamente
if [ -f "$COMPRESSED_FILE" ]; then
    echo "✅ Backup creado exitosamente!"
    echo "📁 Archivo: $COMPRESSED_FILE"
    echo "📊 Tamaño: $(du -h $COMPRESSED_FILE | cut -f1)"
    echo "📋 Metadata: $METADATA_FILE"
    
    # Mostrar información del backup
    echo ""
    echo "📋 Información del backup:"
    echo "   Nombre: $BACKUP_NAME"
    echo "   Fecha: $(date)"
    echo "   Tamaño: $(du -h $COMPRESSED_FILE | cut -f1)"
    echo "   Ubicación: $COMPRESSED_FILE"
    
    # Limpiar archivo sin comprimir
    rm -f "$BACKUP_FILE"
    
else
    echo "❌ Error: No se pudo crear el backup"
    exit 1
fi

echo ""
echo "🎉 Backup completado exitosamente!"
echo "💡 Para restaurar: sudo bash restore-database.sh $BACKUP_NAME"
