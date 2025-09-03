#!/bin/bash

# Script de despliegue rápido para desarrollo
# Uso: bash quick-deploy.sh [blue|green]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_NAME="mundografic"
TARGET_ENV="${1:-blue}"  # Por defecto Blue

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar argumentos
if [[ ! "$TARGET_ENV" =~ ^(blue|green)$ ]]; then
    error "Entorno inválido: $TARGET_ENV. Use 'blue' o 'green'"
    echo "Uso: bash quick-deploy.sh [blue|green]"
    exit 1
fi

# Verificar que estamos en el directorio del proyecto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

log "🚀 Despliegue rápido en entorno $TARGET_ENV..."

# Obtener cambios de Git
log "📥 Obteniendo cambios de Git..."
git pull origin main

# Verificar si hay cambios en dependencias
if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    log "📦 Instalando nuevas dependencias..."
    npm install
else
    log "ℹ️  No hay cambios en dependencias"
fi

# Compilar frontend
log "🔨 Compilando frontend..."
npm run build

# Crear directorio de destino si no existe
TARGET_DIR="/var/www/${APP_NAME}-${TARGET_ENV}"
log "📁 Desplegando en $TARGET_DIR..."

# Crear directorio si no existe
sudo mkdir -p "$TARGET_DIR"

# Limpiar directorio de destino
log "🧹 Limpiando directorio de destino..."
sudo rm -rf "$TARGET_DIR"/*

# Copiar archivos compilados
log "📋 Copiando archivos compilados..."
sudo cp -r dist/* "$TARGET_DIR/"

# Establecer permisos
log "🔐 Estableciendo permisos..."
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"

# Cambiar al entorno desplegado si se solicita
read -p "🔄 ¿Cambiar al entorno $TARGET_ENV ahora? (y/N): " switch_now
if [[ $switch_now =~ ^[Yy]$ ]]; then
    log "🔄 Cambiando al entorno $TARGET_ENV..."
    
    # Crear backup del entorno actual
    CURRENT_LINK="/var/www/${APP_NAME}"
    if [ -L "$CURRENT_LINK" ] && [ -d "$(readlink -f "$CURRENT_LINK")" ]; then
        local current_dir=$(readlink -f "$CURRENT_LINK")
        local backup_dir="/var/backups/${APP_NAME}"
        sudo mkdir -p "$backup_dir"
        local timestamp=$(date +'%Y%m%d_%H%M%S')
        sudo cp -r "$current_dir" "$backup_dir/backup_${timestamp}"
        log "💾 Backup creado en $backup_dir/backup_${timestamp}"
    fi
    
    # Cambiar enlace simbólico
    sudo ln -sf "$TARGET_DIR" "$CURRENT_LINK"
    
    # Recargar Nginx
    log "🔄 Recargando Nginx..."
    sudo systemctl reload nginx
    
    log "✅ Cambio al entorno $TARGET_ENV completado"
else
    log "ℹ️  El entorno $TARGET_ENV está listo pero no activo"
    log "Para activarlo manualmente: sudo ln -sf $TARGET_DIR /var/www/${APP_NAME}"
fi

log "🎉 Despliegue rápido en $TARGET_ENV completado!"
log "🌐 Tu aplicación estará disponible en: http://$(hostname -I | awk '{print $1}')"
