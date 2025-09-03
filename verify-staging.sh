#!/bin/bash

# Script de verificación rápida del sistema de staging
# Sistema: MundoGrafic
# Uso: ./verify-staging.sh

set -e

echo "🔍 VERIFICACIÓN RÁPIDA DEL SISTEMA DE STAGING"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para logging
log() {
    echo -e "${GREEN}[OK]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Contador de errores
ERROR_COUNT=0
WARNING_COUNT=0

# Verificar si el directorio staging existe
echo "📁 Verificando estructura del proyecto..."
if [ -d "staging" ]; then
    log "Directorio staging encontrado"
else
    error "Directorio staging no encontrado"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar archivos principales
echo ""
echo "📄 Verificando archivos principales..."
REQUIRED_FILES=(
    "staging.env"
    "staging/start-staging.sh"
    "staging/stop-staging.sh"
    "staging/deploy-staging.sh"
    "staging/health-check.sh"
    "staging/monitor-staging.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "$file encontrado"
    else
        error "$file no encontrado"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

# Verificar permisos de ejecución
echo ""
echo "🔐 Verificando permisos de ejecución..."
STAGING_SCRIPTS=(
    "staging/start-staging.sh"
    "staging/stop-staging.sh"
    "staging/deploy-staging.sh"
    "staging/health-check.sh"
    "staging/monitor-staging.sh"
)

for script in "${STAGING_SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        log "$script es ejecutable"
    else
        error "$script no es ejecutable"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

# Verificar servicios del sistema
echo ""
echo "🔧 Verificando servicios del sistema..."

# Verificar nginx
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        log "Nginx está activo y funcionando"
    else
        warning "Nginx está instalado pero no activo"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
else
    error "Nginx no está instalado"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar PostgreSQL
if command -v psql &> /dev/null; then
    if systemctl is-active --quiet postgresql; then
        log "PostgreSQL está activo y funcionando"
    else
        warning "PostgreSQL está instalado pero no activo"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
else
    error "PostgreSQL no está instalado"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "Node.js está instalado: $NODE_VERSION"
else
    error "Node.js no está instalado"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log "npm está instalado: $NPM_VERSION"
else
    error "npm no está instalado"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    log "PM2 está instalado"
else
    warning "PM2 no está instalado (recomendado para producción)"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Verificar puertos
echo ""
echo "🔌 Verificando puertos..."
PORTS_TO_CHECK=(
    "3000:Frontend"
    "3001:Backend"
    "8080:Nginx"
    "5432:PostgreSQL"
)

for port_info in "${PORTS_TO_CHECK[@]}"; do
    port=$(echo "$port_info" | cut -d: -f1)
    service=$(echo "$port_info" | cut -d: -f2)
    
    if netstat -tlnp | grep ":$port " > /dev/null; then
        log "Puerto $port ($service): ABIERTO"
    else
        warning "Puerto $port ($service): CERRADO"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done

# Verificar base de datos
echo ""
echo "🗄️ Verificando base de datos..."
if command -v psql &> /dev/null; then
    if psql -h localhost -U mundografic_user -d mundografic_staging -c "SELECT 1;" > /dev/null 2>&1; then
        log "Conexión a base de datos exitosa"
        
        # Verificar tablas
        TABLE_COUNT=$(psql -h localhost -U mundografic_user -d mundografic_staging -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$TABLE_COUNT" -gt 0 ]; then
            log "Base de datos tiene $TABLE_COUNT tablas"
        else
            warning "Base de datos no tiene tablas (puede necesitar migraciones)"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    else
        error "No se puede conectar a la base de datos"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
else
    error "psql no disponible para verificar base de datos"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar directorios de storage
echo ""
echo "📁 Verificando directorios de storage..."
STORAGE_DIRS=(
    "staging/backend/storage"
    "staging/backend/uploads"
    "staging/backend/firmas"
    "staging/backend/pdfs"
    "staging/logs"
)

for dir in "${STORAGE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log "$dir existe"
    else
        warning "$dir no existe"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done

# Verificar variables de entorno
echo ""
echo "⚙️ Verificando variables de entorno..."
if [ -f "staging.env" ]; then
    log "Archivo staging.env encontrado"
    
    # Verificar variables críticas
    CRITICAL_VARS=("DB_HOST" "DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET")
    for var in "${CRITICAL_VARS[@]}"; do
        if grep -q "^$var=" staging.env; then
            log "Variable $var configurada"
        else
            warning "Variable $var no encontrada"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    done
else
    error "Archivo staging.env no encontrado"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Verificar firewall
echo ""
echo "🔥 Verificando firewall..."
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        log "UFW está activo"
        
        # Verificar reglas importantes
        if sudo ufw status | grep -q "8080/tcp"; then
            log "Puerto 8080 (staging) permitido en firewall"
        else
            warning "Puerto 8080 (staging) no permitido en firewall"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    else
        warning "UFW está instalado pero no activo"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
else
    warning "UFW no está instalado"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Verificar cron jobs
echo ""
echo "⏰ Verificando cron jobs..."
if crontab -l 2>/dev/null | grep -q "staging"; then
    log "Cron jobs de staging configurados"
else
    warning "Cron jobs de staging no configurados"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Verificar servicios systemd
echo ""
echo "⚙️ Verificando servicios systemd..."
if [ -f "/etc/systemd/system/mundografic-staging.service" ]; then
    log "Servicio systemd mundografic-staging encontrado"
    
    if systemctl is-enabled --quiet mundografic-staging; then
        log "Servicio mundografic-staging habilitado"
    else
        warning "Servicio mundografic-staging no habilitado"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
else
    warning "Servicio systemd mundografic-staging no encontrado"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi

# Resumen final
echo ""
echo "================================================"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "================================================"

if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 SISTEMA COMPLETAMENTE VERIFICADO${NC}"
    echo "✅ No se encontraron errores ni advertencias"
elif [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️ SISTEMA VERIFICADO CON ADVERTENCIAS${NC}"
    echo "✅ No se encontraron errores críticos"
    echo "⚠️ Se encontraron $WARNING_COUNT advertencias"
else
    echo -e "${RED}❌ SISTEMA CON ERRORES${NC}"
    echo "❌ Se encontraron $ERROR_COUNT errores críticos"
    echo "⚠️ Se encontraron $WARNING_COUNT advertencias"
fi

echo ""
echo "📈 Estadísticas:"
echo "   ✅ Éxitos: $((${#REQUIRED_FILES[@]} + ${#STAGING_SCRIPTS[@]} + 10))"
echo "   ❌ Errores: $ERROR_COUNT"
echo "   ⚠️ Advertencias: $WARNING_COUNT"

echo ""
echo "🎯 Recomendaciones:"
if [ $ERROR_COUNT -gt 0 ]; then
    echo "   🔴 Corrige los errores críticos antes de usar el sistema"
fi
if [ $WARNING_COUNT -gt 0 ]; then
    echo "   🟡 Revisa las advertencias para optimizar el sistema"
fi
if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo "   🟢 El sistema está listo para usar"
fi

echo ""
echo "🔍 Para verificación detallada ejecuta:"
echo "   ./staging/health-check.sh"
echo "   ./staging/monitor-staging.sh"

echo ""
echo "================================================"
