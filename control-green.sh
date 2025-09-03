#!/bin/bash

# 🟢 CONTROL DEL SISTEMA GREEN (STAGING PROFESIONAL)
# ==================================================
# Sistema Blue-Green Deployment para MundoGrafic
# 
# Este script maneja el sistema GREEN (staging) de forma profesional:
# - Un solo código base para BLUE y GREEN
# - Builds separados con diferentes configuraciones
# - Backend independiente en staging/
# - Frontend servido desde build optimizado

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

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0  # Puerto en uso
    else
        return 1  # Puerto libre
    fi
}

# Función para levantar sistema GREEN
start_green() {
    log "🚀 Iniciando sistema GREEN (staging)..."
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        error "No se encontró package.json. Ejecuta desde el directorio raíz del proyecto."
        exit 1
    fi
    
    # Verificar que existe staging.env
    if [ ! -f "staging.env" ]; then
        error "No se encontró staging.env. Configuración requerida."
        exit 1
    fi
    
    # Verificar que existe .env.staging
    if [ ! -f ".env.staging" ]; then
        error "No se encontró .env.staging. Configuración del frontend requerida."
        exit 1
    fi
    
    # Verificar puertos
    if check_port 3003; then
        warning "Puerto 3003 (backend GREEN) ya está en uso"
    fi
    
    if check_port 3001; then
        warning "Puerto 3001 (frontend GREEN) ya está en uso"
    fi
    
    # Build frontend para staging
    log "📦 Building frontend para staging..."
    if npm run build -- --mode staging; then
        success "Frontend build completado"
    else
        error "Error en build del frontend"
        exit 1
    fi
    
    # Levantar backend GREEN
    log "📡 Iniciando backend GREEN..."
    cd staging/backend
    
    # Verificar que existe .env
    if [ ! -f ".env" ]; then
        log "Copiando configuración de staging..."
        cp ../../staging.env .env
    fi
    
    # Iniciar backend en background
    npm start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    # Esperar a que el backend inicie
    log "Esperando que el backend inicie..."
    sleep 5
    
    # Verificar que el backend esté funcionando
    if check_port 3003; then
        success "Backend GREEN iniciado (PID: $BACKEND_PID)"
    else
        error "Backend GREEN no pudo iniciar"
        exit 1
    fi
    
    # Volver al directorio raíz
    cd ../..
    
    # Servir frontend desde build
    log "🌐 Iniciando frontend GREEN..."
    if command -v serve >/dev/null 2>&1; then
        npx serve dist -p 3001 -s > staging/logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > staging/logs/frontend.pid
    else
        log "Instalando serve..."
        npm install -g serve
        npx serve dist -p 3001 -s > staging/logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > staging/logs/frontend.pid
    fi
    
    # Esperar a que el frontend inicie
    sleep 3
    
    # Verificar que el frontend esté funcionando
    if check_port 3001; then
        success "Frontend GREEN iniciado (PID: $FRONTEND_PID)"
    else
        error "Frontend GREEN no pudo iniciar"
        exit 1
    fi
    
    echo ""
    success "✅ Sistema GREEN iniciado correctamente:"
    echo "   🖥️  Frontend Local:  http://localhost:3001"
    echo "   🌐 Frontend Red:    http://192.168.130.149:3001"
    echo "   🔧 Backend Local:   http://localhost:3003"
    echo "   🌐 Backend Red:     http://192.168.130.149:3003"
    echo "   📊 PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
    echo ""
    log "💡 Para probar: curl http://localhost:3003/api/health"
}

# Función para bajar sistema GREEN
stop_green() {
    log "🛑 Bajando sistema GREEN..."
    
    # Leer PIDs de los archivos
    if [ -f "staging/logs/backend.pid" ]; then
        BACKEND_PID=$(cat staging/logs/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            success "Backend GREEN detenido (PID: $BACKEND_PID)"
        fi
        rm -f staging/logs/backend.pid
    fi
    
    if [ -f "staging/logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat staging/logs/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            success "Frontend GREEN detenido (PID: $FRONTEND_PID)"
        fi
        rm -f staging/logs/frontend.pid
    fi
    
    # Matar procesos por nombre como respaldo
    pkill -f "node.*staging" 2>/dev/null || true
    pkill -f "serve.*3001" 2>/dev/null || true
    
    success "Sistema GREEN detenido"
}

# Función para ver estado
status_green() {
    log "📊 Estado del sistema GREEN:"
    echo ""
    
    # Verificar puertos
    if check_port 3003; then
        success "✅ Puerto 3003 (Backend GREEN): ABIERTO"
    else
        warning "❌ Puerto 3003 (Backend GREEN): CERRADO"
    fi
    
    if check_port 3001; then
        success "✅ Puerto 3001 (Frontend GREEN): ABIERTO"
    else
        warning "❌ Puerto 3001 (Frontend GREEN): CERRADO"
    fi
    
    echo ""
    log "🔍 Procesos relacionados:"
    ps aux | grep -E "(staging|serve.*3001)" | grep -v grep || echo "No hay procesos activos"
    
    echo ""
    log "🌐 Pruebas de conectividad:"
    if check_port 3003; then
        if curl -s http://localhost:3003/api/health >/dev/null 2>&1; then
            success "✅ Backend GREEN responde correctamente"
        else
            warning "⚠️  Backend GREEN no responde a /api/health"
        fi
    fi
    
    if check_port 3001; then
        if curl -s http://localhost:3001 >/dev/null 2>&1; then
            success "✅ Frontend GREEN responde correctamente"
        else
            warning "⚠️  Frontend GREEN no responde"
        fi
    fi
}

# Función para ver logs
logs_green() {
    log "📝 Logs del sistema GREEN:"
    echo ""
    
    if [ -f "staging/logs/backend.log" ]; then
        echo "🔧 Backend Logs (últimas 20 líneas):"
        echo "----------------------------------------"
        tail -20 staging/logs/backend.log
        echo ""
    fi
    
    if [ -f "staging/logs/frontend.log" ]; then
        echo "🌐 Frontend Logs (últimas 20 líneas):"
        echo "----------------------------------------"
        tail -20 staging/logs/frontend.log
        echo ""
    fi
    
    echo "💡 Para ver logs en tiempo real:"
    echo "   Backend:  tail -f staging/logs/backend.log"
    echo "   Frontend: tail -f staging/logs/frontend.log"
}

# Función para mostrar acceso
access_green() {
    log "🌐 Acceso al sistema GREEN:"
    echo ""
    echo "🖥️  Acceso Local:"
    echo "   Frontend: http://localhost:3001"
    echo "   Backend:  http://localhost:3003"
    echo ""
    echo "🌐 Acceso de Red:"
    echo "   Frontend: http://192.168.130.149:3001"
    echo "   Backend:  http://192.168.130.149:3003"
    echo ""
    echo "🧪 Pruebas:"
    echo "   Backend Health: curl http://localhost:3003/api/health"
    echo "   Frontend:       curl http://localhost:3001"
    echo ""
    echo "📊 Base de datos: sistema_mg_staging"
    echo "🔧 Configuración: staging.env"
}

# Función para actualizar sistema GREEN
update_green() {
    log "🔄 Actualizando sistema GREEN..."
    
    # Obtener cambios del repositorio
    log "📥 Obteniendo cambios del repositorio..."
    git pull origin main
    
    # Reinstalar dependencias si es necesario
    if [ -f "package-lock.json" ] && [ "package-lock.json" -nt "node_modules" ]; then
        log "📦 Reinstalando dependencias..."
        npm install
    fi
    
    # Reinstalar dependencias del backend staging
    if [ -f "staging/backend/package-lock.json" ] && [ "staging/backend/package-lock.json" -nt "staging/backend/node_modules" ]; then
        log "📦 Reinstalando dependencias del backend staging..."
        cd staging/backend
        npm install
        cd ../..
    fi
    
    # Detener sistema actual
    stop_green
    
    # Iniciar sistema actualizado
    start_green
    
    success "Sistema GREEN actualizado y reiniciado"
}

# Menú principal
show_menu() {
    echo ""
    echo "🟢 CONTROL DEL SISTEMA GREEN (STAGING PROFESIONAL)"
    echo "=================================================="
    echo ""
    echo "1. 🚀 Levantar sistema GREEN completo"
    echo "2. 🛑 Bajar sistema GREEN"
    echo "3. 📊 Ver estado"
    echo "4. 📝 Ver logs"
    echo "5. 🌐 Acceso local y red"
    echo "6. 🔄 Actualizar sistema GREEN"
    echo "7. 🧪 Pruebas rápidas"
    echo "8. ❌ Salir"
    echo ""
}

# Función para pruebas rápidas
test_green() {
    log "🧪 Ejecutando pruebas rápidas del sistema GREEN..."
    echo ""
    
    # Prueba 1: Verificar puertos
    log "1. Verificando puertos..."
    if check_port 3003; then
        success "✅ Puerto 3003 (Backend): ABIERTO"
    else
        error "❌ Puerto 3003 (Backend): CERRADO"
        return 1
    fi
    
    if check_port 3001; then
        success "✅ Puerto 3001 (Frontend): ABIERTO"
    else
        error "❌ Puerto 3001 (Frontend): CERRADO"
        return 1
    fi
    
    # Prueba 2: Backend health check
    log "2. Probando backend health check..."
    if curl -s http://localhost:3003/api/health >/dev/null 2>&1; then
        success "✅ Backend responde correctamente"
    else
        error "❌ Backend no responde"
        return 1
    fi
    
    # Prueba 3: Frontend
    log "3. Probando frontend..."
    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        success "✅ Frontend responde correctamente"
    else
        error "❌ Frontend no responde"
        return 1
    fi
    
    # Prueba 4: Base de datos
    log "4. Verificando conexión a base de datos..."
    if [ -f "staging/backend/.env" ]; then
        success "✅ Configuración de base de datos encontrada"
    else
        error "❌ Configuración de base de datos no encontrada"
        return 1
    fi
    
    echo ""
    success "🎉 Todas las pruebas pasaron correctamente!"
    echo "   El sistema GREEN está funcionando perfectamente."
}

# Main
main() {
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        error "No se encontró package.json. Ejecuta desde el directorio raíz del proyecto."
        exit 1
    fi
    
    # Crear directorio de logs si no existe
    mkdir -p staging/logs
    
    # Mostrar menú
    show_menu
    
    read -p "Selecciona una opción (1-8): " opcion
    
    case $opcion in
        1)
            start_green
            ;;
        2)
            stop_green
            ;;
        3)
            status_green
            ;;
        4)
            logs_green
            ;;
        5)
            access_green
            ;;
        6)
            update_green
            ;;
        7)
            test_green
            ;;
        8)
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
