#!/bin/bash

# 🚀 MIGRACIÓN SECUENCIAL BLUE-GREEN
# ===================================
# Sistema de migración segura: GREEN → BLUE
# 
# Este script maneja las migraciones de base de datos de forma segura:
# 1. Migra primero GREEN (staging)
# 2. Permite probar GREEN
# 3. Migra BLUE (producción) solo si GREEN funciona

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Función para migrar base de datos GREEN (staging)
migrate_green() {
    log "🟢 Migrando base de datos GREEN (staging)..."
    
    cd staging/backend
    
    # Verificar que existe knexfile
    if [ ! -f "knexfile.js" ]; then
        error "No se encontró knexfile.js en staging/backend/"
        exit 1
    fi
    
    # Verificar que existe .env
    if [ ! -f ".env" ]; then
        log "Copiando configuración de staging..."
        cp ../../staging.env .env
    fi
    
    # Ejecutar migraciones
    log "📊 Ejecutando migraciones en sistema_mg_staging..."
    if npm run migrate; then
        success "✅ Migraciones en GREEN completadas exitosamente"
    else
        error "❌ Error en migraciones de GREEN"
        exit 1
    fi
    
    # Volver al directorio raíz
    cd ../..
}

# Función para migrar base de datos BLUE (producción)
migrate_blue() {
    log "🔵 Migrando base de datos BLUE (producción)..."
    
    cd backend
    
    # Verificar que existe knexfile
    if [ ! -f "knexfile.js" ]; then
        error "No se encontró knexfile.js en backend/"
        exit 1
    fi
    
    # Confirmar migración a producción
    echo ""
    warning "⚠️  ¿Estás seguro de que quieres migrar la base de datos de PRODUCCIÓN?"
    warning "⚠️  Esta operación puede afectar datos reales."
    read -p "¿Continuar con migración a PRODUCCIÓN? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        log "📊 Ejecutando migraciones en sistema_mg (PRODUCCIÓN)..."
        if npm run migrate; then
            success "✅ Migraciones en BLUE (PRODUCCIÓN) completadas exitosamente"
        else
            error "❌ Error en migraciones de BLUE (PRODUCCIÓN)"
            exit 1
        fi
    else
        warning "🛑 Migración a PRODUCCIÓN cancelada por el usuario"
        return 1
    fi
    
    # Volver al directorio raíz
    cd ..
}

# Función para migración secuencial completa
migrate_sequential() {
    log "🚀 Iniciando migración secuencial: GREEN → BLUE"
    
    # 1. Migrar GREEN
    migrate_green
    
    # 2. Preguntar si probar GREEN
    echo ""
    success "✅ GREEN migrado exitosamente"
    read -p "¿Quieres probar el sistema GREEN antes de migrar BLUE? (Y/n): " test_green
    
    if [[ $test_green =~ ^[Nn]$ ]]; then
        warning "⚠️  Saltando pruebas de GREEN"
    else
        log "🧪 Probando sistema GREEN..."
        ./control-green.sh
        echo ""
        read -p "Presiona Enter cuando hayas terminado de probar GREEN..."
    fi
    
    # 3. Preguntar si migrar BLUE
    echo ""
    read -p "¿GREEN funciona correctamente? ¿Migrar a BLUE (PRODUCCIÓN)? (y/N): " migrate_blue_confirm
    
    if [[ $migrate_blue_confirm =~ ^[Yy]$ ]]; then
        migrate_blue
        success "🎉 Migración secuencial completada: GREEN → BLUE"
    else
        warning "🛑 Migración a BLUE cancelada. GREEN migrado, BLUE sin cambios."
    fi
}

# Función para verificar estado de migraciones
check_migration_status() {
    log " Verificando estado de migraciones..."
    
    echo ""
    echo "🟢 Estado de migraciones en GREEN (staging):"
    cd staging/backend
    if npm run migrate:status >/dev/null 2>&1; then
        npm run migrate:status
    else
        warning "⚠️  No se pudo verificar estado de migraciones en GREEN"
    fi
    cd ../..
    
    echo ""
    echo "🔵 Estado de migraciones en BLUE (producción):"
    cd backend
    if npm run migrate:status >/dev/null 2>&1; then
        npm run migrate:status
    else
        warning "⚠️  No se pudo verificar estado de migraciones en BLUE"
    fi
    cd ..
}

# Menú principal
show_menu() {
    echo ""
    echo "🚀 MIGRACIÓN SECUENCIAL BLUE-GREEN"
    echo "=================================="
    echo ""
    echo "1. 🟢 Migrar solo GREEN (staging)"
    echo "2. 🔵 Migrar solo BLUE (producción)"
    echo "3. 🟢🔵 Migrar GREEN → BLUE (secuencial)"
    echo "4. 📊 Ver estado de migraciones"
    echo "5. ❌ Salir"
    echo ""
}

# Main
main() {
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        error "No se encontró package.json. Ejecuta desde el directorio raíz del proyecto."
        exit 1
    fi
    
    # Mostrar menú
    show_menu
    
    read -p "Selecciona una opción (1-5): " opcion
    
    case $opcion in
        1)
            migrate_green
            ;;
        2)
            migrate_blue
            ;;
        3)
            migrate_sequential
            ;;
        4)
            check_migration_status
            ;;
        5)
            log "👋 Saliendo..."
            exit 0
            ;;
        *)
            error "❌ Opción inválida"
            exit 1
            ;;
    esac
}

# Ejecutar main
main "$@"
