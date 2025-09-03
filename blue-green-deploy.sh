#!/bin/bash

# Sistema de Despliegue Blue-Green para MundoGrafic
# Uso: sudo bash blue-green-deploy.sh [blue|green|switch|status|rollback]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_NAME="mundografic"
BLUE_DIR="/var/www/${APP_NAME}-blue"
GREEN_DIR="/var/www/${APP_NAME}-green"
CURRENT_LINK="/var/www/${APP_NAME}"
NGINX_CONFIG="/etc/nginx/sites-available/${APP_NAME}"
BACKUP_DIR="/var/backups/${APP_NAME}"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para verificar si estamos ejecutando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Este script debe ejecutarse como root (sudo)"
        exit 1
    fi
}

# Función para crear directorios y estructura
setup_directories() {
    log "Configurando directorios Blue-Green..."
    
    mkdir -p "$BLUE_DIR" "$GREEN_DIR" "$BACKUP_DIR"
    
    # Crear enlace simbólico si no existe
    if [ ! -L "$CURRENT_LINK" ]; then
        ln -sf "$BLUE_DIR" "$CURRENT_LINK"
        log "Enlace simbólico creado apuntando a Blue"
    fi
    
    # Establecer permisos
    chown -R www-data:www-data "$BLUE_DIR" "$GREEN_DIR"
    chmod -R 755 "$BLUE_DIR" "$GREEN_DIR"
}

# Función para crear backup
create_backup() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/backup_${timestamp}"
    
    log "Creando backup en $backup_path..."
    
    if [ -L "$CURRENT_LINK" ] && [ -d "$(readlink -f "$CURRENT_LINK")" ]; then
        local current_dir=$(readlink -f "$CURRENT_LINK")
        cp -r "$current_dir" "$backup_path"
        log "Backup creado exitosamente"
    else
        warn "No se pudo crear backup - directorio actual no encontrado"
    fi
}

# Función para desplegar en un entorno específico
deploy_to_environment() {
    local env=$1
    local target_dir=""
    
    case $env in
        "blue")
            target_dir="$BLUE_DIR"
            ;;
        "green")
            target_dir="$GREEN_DIR"
            ;;
        *)
            error "Entorno inválido: $env. Use 'blue' o 'green'"
            exit 1
            ;;
    esac
    
    log "Desplegando en entorno $env..."
    
    # Verificar que estamos en el directorio del proyecto
    if [ ! -f "package.json" ]; then
        error "No se encontró package.json. Ejecuta este script desde el directorio del proyecto"
        exit 1
    fi
    
    # Obtener cambios de Git
    log "Obteniendo cambios de Git..."
    git pull origin main
    
    # Instalar dependencias si es necesario
    if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
        log "Instalando nuevas dependencias..."
        npm install
    fi
    
    # Compilar frontend
    log "Compilando frontend..."
    npm run build
    
    # Limpiar directorio de destino
    log "Limpiando directorio de destino..."
    rm -rf "$target_dir"/*
    
    # Copiar archivos compilados
    log "Copiando archivos compilados..."
    cp -r dist/* "$target_dir/"
    
    # Establecer permisos
    chown -R www-data:www-data "$target_dir"
    chmod -R 755 "$target_dir"
    
    log "Despliegue en $env completado exitosamente"
}

# Función para cambiar entre entornos
switch_environment() {
    local new_env=$1
    local current_env=""
    
    # Determinar entorno actual
    if [ -L "$CURRENT_LINK" ]; then
        local current_dir=$(readlink -f "$CURRENT_LINK")
        if [[ "$current_dir" == *"-blue" ]]; then
            current_env="blue"
        elif [[ "$current_dir" == *"-green" ]]; then
            current_env="green"
        fi
    fi
    
    if [ "$current_env" = "$new_env" ]; then
        warn "Ya estás en el entorno $new_env"
        return 0
    fi
    
    log "Cambiando de $current_env a $new_env..."
    
    # Crear backup antes del cambio
    create_backup
    
    # Cambiar enlace simbólico
    case $new_env in
        "blue")
            ln -sf "$BLUE_DIR" "$CURRENT_LINK"
            ;;
        "green")
            ln -sf "$GREEN_DIR" "$CURRENT_LINK"
            ;;
    esac
    
    # Recargar Nginx
    log "Recargando Nginx..."
    systemctl reload nginx
    
    log "Cambio a entorno $new_env completado exitosamente"
}

# Función para hacer rollback
rollback() {
    log "Iniciando rollback..."
    
    # Listar backups disponibles
    local backups=($(ls -t "$BACKUP_DIR" | grep "^backup_" | head -5))
    
    if [ ${#backups[@]} -eq 0 ]; then
        error "No hay backups disponibles para rollback"
        exit 1
    fi
    
    log "Backups disponibles:"
    for i in "${!backups[@]}"; do
        echo "  $((i+1)). ${backups[$i]}"
    done
    
    # Usar el backup más reciente por defecto
    local selected_backup="${backups[0]}"
    log "Usando backup más reciente: $selected_backup"
    
    # Crear backup del estado actual antes del rollback
    create_backup
    
    # Restaurar desde backup
    local current_dir=$(readlink -f "$CURRENT_LINK")
    log "Restaurando desde backup a $current_dir..."
    
    rm -rf "$current_dir"/*
    cp -r "$BACKUP_DIR/$selected_backup"/* "$current_dir/"
    
    # Establecer permisos
    chown -R www-data:www-data "$current_dir"
    chmod -R 755 "$current_dir"
    
    # Recargar Nginx
    log "Recargando Nginx..."
    systemctl reload nginx
    
    log "Rollback completado exitosamente"
}

# Función para mostrar estado
show_status() {
    log "Estado del sistema Blue-Green:"
    echo ""
    
    # Entorno actual
    if [ -L "$CURRENT_LINK" ]; then
        local current_dir=$(readlink -f "$CURRENT_LINK")
        if [[ "$current_dir" == *"-blue" ]]; then
            echo -e "🟦 Entorno ACTUAL: ${GREEN}BLUE${NC}"
        elif [[ "$current_dir" == *"-green" ]]; then
            echo -e "🟩 Entorno ACTUAL: ${GREEN}GREEN${NC}"
        fi
        echo "   Ruta: $current_dir"
    else
        echo -e "❌ ${RED}No hay enlace simbólico configurado${NC}"
    fi
    
    echo ""
    
    # Estado de directorios
    echo "📁 Estado de directorios:"
    if [ -d "$BLUE_DIR" ] && [ "$(ls -A "$BLUE_DIR")" ]; then
        echo -e "   🟦 Blue: ${GREEN}Activo${NC} ($(ls -1 "$BLUE_DIR" | wc -l) archivos)"
    else
        echo -e "   🟦 Blue: ${RED}Vacío${NC}"
    fi
    
    if [ -d "$GREEN_DIR" ] && [ "$(ls -A "$GREEN_DIR")" ]; then
        echo -e "   🟩 Green: ${GREEN}Activo${NC} ($(ls -1 "$GREEN_DIR" | wc -l) archivos)"
    else
        echo -e "   🟩 Green: ${RED}Vacío${NC}"
    fi
    
    echo ""
    
    # Estado de Nginx
    echo "🌐 Estado de Nginx:"
    if systemctl is-active --quiet nginx; then
        echo -e "   ${GREEN}✅ Nginx está ejecutándose${NC}"
    else
        echo -e "   ${RED}❌ Nginx no está ejecutándose${NC}"
    fi
    
    # Estado del backend
    echo ""
    echo "🔧 Estado del Backend:"
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        echo -e "   ${GREEN}✅ Backend ejecutándose en puerto 3000${NC}"
    else
        echo -e "   ${RED}❌ Backend no está ejecutándose en puerto 3000${NC}"
    fi
    
    # Backups disponibles
    echo ""
    echo "💾 Backups disponibles:"
    local backup_count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | grep "^backup_" | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        echo "   $backup_count backups en $BACKUP_DIR"
        echo "   Últimos 3:"
        ls -t "$BACKUP_DIR" | grep "^backup_" | head -3 | while read backup; do
            echo "     - $backup"
        done
    else
        echo "   No hay backups disponibles"
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "🚀 Sistema de Despliegue Blue-Green para MundoGrafic"
    echo ""
    echo "Uso: sudo bash blue-green-deploy.sh [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  blue     - Desplegar en entorno Blue"
    echo "  green    - Desplegar en entorno Green"
    echo "  switch   - Cambiar entre entornos Blue y Green"
    echo "  status   - Mostrar estado del sistema"
    echo "  rollback - Hacer rollback al último backup"
    echo "  help     - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  sudo bash blue-green-deploy.sh blue     # Desplegar en Blue"
    echo "  sudo bash blue-green-deploy.sh green    # Desplegar en Green"
    echo "  sudo bash blue-green-deploy.sh switch   # Cambiar entorno"
    echo "  sudo bash blue-green-deploy.sh status   # Ver estado"
    echo "  sudo bash blue-green-deploy.sh rollback # Hacer rollback"
}

# Función principal
main() {
    check_root
    
    # Configurar directorios si no existen
    setup_directories
    
    case "${1:-help}" in
        "blue")
            deploy_to_environment "blue"
            ;;
        "green")
            deploy_to_environment "green"
            ;;
        "switch")
            # Determinar a qué entorno cambiar
            local current_dir=$(readlink -f "$CURRENT_LINK")
            if [[ "$current_dir" == *"-blue" ]]; then
                switch_environment "green"
            else
                switch_environment "blue"
            fi
            ;;
        "status")
            show_status
            ;;
        "rollback")
            rollback
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
