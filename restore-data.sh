#!/bin/bash

# Script para restaurar datos desde backup
# Uso: sudo bash restore-data.sh

set -e

echo "🔄 Iniciando restauración de datos..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde /opt/myapp"
    exit 1
fi

# Buscar archivos de backup
BACKUP_DIR="backups"
if [ -d "$BACKUP_DIR" ]; then
    echo "📁 Buscando archivos de backup en $BACKUP_DIR..."
    BACKUP_FILES=$(ls -t "$BACKUP_DIR"/*.json 2>/dev/null || echo "")
    
    if [ -n "$BACKUP_FILES" ]; then
        LATEST_BACKUP=$(echo "$BACKUP_FILES" | head -n 1)
        echo "📦 Archivo de backup encontrado: $LATEST_BACKUP"
        
        echo "⚠️  ¿Deseas restaurar desde $LATEST_BACKUP? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo "🔄 Restaurando datos desde $LATEST_BACKUP..."
            cd backend
            node restore-backup.js "$LATEST_BACKUP"
            echo "✅ Restauración completada"
        else
            echo "❌ Restauración cancelada"
        fi
    else
        echo "❌ No se encontraron archivos de backup en $BACKUP_DIR"
    fi
else
    echo "❌ Directorio de backup no encontrado: $BACKUP_DIR"
fi

echo ""
echo "💡 Si no tienes backup, puedes:"
echo "1. Recrear los datos manualmente desde la aplicación"
echo "2. Ejecutar el seed seguro: cd backend && npx knex seed:run --specific=02_datos_seguros.js"
echo "3. Restaurar desde una copia de seguridad de la base de datos"
