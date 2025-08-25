#!/bin/bash

# Script para listar y gestionar backups de la base de datos
# Uso: sudo bash list-backups.sh [opción]

set -e

BACKUP_DIR="backups"

echo "📋 Gestión de Backups de Base de Datos"
echo "======================================"
echo ""

# Verificar que el directorio existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ No se encontró el directorio de backups: $BACKUP_DIR"
    echo "💡 Ejecuta primero: sudo bash backup-database.sh"
    exit 1
fi

# Función para mostrar información detallada de un backup
show_backup_info() {
    local backup_name="$1"
    local backup_file="${BACKUP_DIR}/${backup_name}.sql.gz"
    local metadata_file="${BACKUP_DIR}/${backup_name}.json"
    
    echo "📁 Backup: $backup_name"
    echo "   📅 Fecha: $(stat -c %y "$backup_file" 2>/dev/null | cut -d' ' -f1,2 || echo 'N/A')"
    echo "   📊 Tamaño: $(du -h "$backup_file" 2>/dev/null | cut -f1 || echo 'N/A')"
    
    if [ -f "$metadata_file" ]; then
        echo "   📋 Descripción: $(jq -r '.description' "$metadata_file" 2>/dev/null || echo 'N/A')"
        echo "   🔢 Versión: $(jq -r '.version' "$metadata_file" 2>/dev/null || echo 'N/A')"
    fi
    echo ""
}

# Función para eliminar un backup
delete_backup() {
    local backup_name="$1"
    local backup_file="${BACKUP_DIR}/${backup_name}.sql.gz"
    local metadata_file="${BACKUP_DIR}/${backup_name}.json"
    
    echo "🗑️  Eliminando backup: $backup_name"
    echo "⚠️  ¿Estás seguro? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -f "$backup_file" "$metadata_file"
        echo "✅ Backup eliminado: $backup_name"
    else
        echo "❌ Eliminación cancelada"
    fi
}

# Función para hacer backup ahora
create_backup() {
    echo "🔄 Creando nuevo backup..."
    sudo bash backup-database.sh
}

# Función para restaurar un backup
restore_backup() {
    local backup_name="$1"
    echo "🔄 Restaurando backup: $backup_name"
    sudo bash restore-database.sh "$backup_name"
}

# Listar todos los backups
list_backups() {
    echo "📋 Backups disponibles:"
    echo ""
    
    local count=0
    for backup_file in "$BACKUP_DIR"/*.sql.gz; do
        if [ -f "$backup_file" ]; then
            backup_name=$(basename "$backup_file" .sql.gz)
            show_backup_info "$backup_name"
            count=$((count + 1))
        fi
    done
    
    if [ $count -eq 0 ]; then
        echo "❌ No se encontraron backups"
        echo "💡 Ejecuta: sudo bash backup-database.sh"
    else
        echo "📊 Total de backups: $count"
        echo "💾 Espacio total usado: $(du -sh "$BACKUP_DIR" | cut -f1)"
    fi
}

# Menú principal
case "${1:-list}" in
    "list"|"")
        list_backups
        ;;
    "create"|"new")
        create_backup
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar el nombre del backup"
            echo "💡 Uso: sudo bash list-backups.sh restore [nombre_backup]"
            exit 1
        fi
        restore_backup "$2"
        ;;
    "delete"|"remove")
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar el nombre del backup"
            echo "💡 Uso: sudo bash list-backups.sh delete [nombre_backup]"
            exit 1
        fi
        delete_backup "$2"
        ;;
    "info")
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar el nombre del backup"
            echo "💡 Uso: sudo bash list-backups.sh info [nombre_backup]"
            exit 1
        fi
        show_backup_info "$2"
        ;;
    "help"|"-h"|"--help")
        echo "📋 Uso: sudo bash list-backups.sh [opción] [nombre_backup]"
        echo ""
        echo "Opciones disponibles:"
        echo "  list                    - Listar todos los backups (por defecto)"
        echo "  create, new             - Crear un nuevo backup"
        echo "  restore [nombre]        - Restaurar un backup específico"
        echo "  delete [nombre]         - Eliminar un backup específico"
        echo "  info [nombre]           - Mostrar información detallada de un backup"
        echo "  help                    - Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  sudo bash list-backups.sh"
        echo "  sudo bash list-backups.sh create"
        echo "  sudo bash list-backups.sh restore backup_2024-01-15_10-30-00"
        echo "  sudo bash list-backups.sh delete backup_2024-01-15_10-30-00"
        ;;
    *)
        echo "❌ Opción desconocida: $1"
        echo "💡 Ejecuta: sudo bash list-backups.sh help"
        exit 1
        ;;
esac
