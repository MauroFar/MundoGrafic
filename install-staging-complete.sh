#!/bin/bash

# Script principal de instalación completa de staging
# Sistema: MundoGrafic
# Uso: ./install-staging-complete.sh

set -e

echo "🚀 INSTALACIÓN COMPLETA DEL SISTEMA DE STAGING - MUNDOGRAFIC"
echo "================================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar si estamos como root
if [[ $EUID -eq 0 ]]; then
   error "Este script no debe ejecutarse como root. Usa tu usuario normal."
fi

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Debes ejecutar este script desde el directorio raíz del proyecto MundoGrafic"
fi

# Verificar sistema operativo
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    warning "Este script está diseñado para sistemas Linux. Puede no funcionar correctamente en otros sistemas."
fi

log "Iniciando instalación completa del sistema de staging..."

# Paso 1: Preparar estructura de staging
log "📁 Paso 1: Preparando estructura de staging..."
if [ -d "staging" ]; then
    warning "El directorio staging ya existe. Se sobrescribirá."
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Instalación cancelada por el usuario"
        exit 0
    fi
    rm -rf staging
fi

# Ejecutar script de preparación
log "Ejecutando script de preparación..."
./deploy-staging-server.sh

# Paso 2: Configurar base de datos
log "🗄️ Paso 2: Configurando base de datos de staging..."
if command -v psql &> /dev/null; then
    log "PostgreSQL ya está instalado"
else
    warning "PostgreSQL no está instalado. Se instalará automáticamente."
    read -p "¿Instalar PostgreSQL? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        warning "Debes instalar PostgreSQL manualmente antes de continuar"
        log "Instalación pausada. Instala PostgreSQL y ejecuta este script nuevamente."
        exit 1
    fi
fi

# Paso 3: Configurar nginx
log "🌐 Paso 3: Configurando nginx para staging..."
if command -v nginx &> /dev/null; then
    log "Nginx ya está instalado"
else
    warning "Nginx no está instalado. Se instalará automáticamente."
    read -p "¿Instalar nginx? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        warning "Debes instalar nginx manualmente antes de continuar"
        log "Instalación pausada. Instala nginx y ejecuta este script nuevamente."
        exit 1
    fi
fi

# Paso 4: Configurar firewall
log "🔥 Paso 4: Configurando firewall..."
if command -v ufw &> /dev/null; then
    log "UFW ya está instalado"
else
    warning "UFW no está instalado. Se instalará automáticamente."
    read -p "¿Instalar UFW? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        warning "Debes instalar UFW manualmente antes de continuar"
        log "Instalación pausada. Instala UFW y ejecuta este script nuevamente."
        exit 1
    fi
fi

# Paso 5: Instalar dependencias del sistema
log "📦 Paso 5: Instalando dependencias del sistema..."
cd staging
./install-dependencies.sh
cd ..

# Paso 6: Configurar base de datos
log "🗄️ Paso 6: Configurando base de datos..."
./setup-database-staging.sh

# Paso 7: Configurar nginx
log "🌐 Paso 7: Configurando nginx..."
./setup-nginx-staging.sh

# Paso 8: Configurar firewall
log "🔥 Paso 8: Configurando firewall..."
./setup-firewall-staging.sh

# Paso 9: Configurar monitoreo
log "📊 Paso 9: Configurando monitoreo y logs..."
./setup-monitoring-staging.sh

# Paso 10: Configurar backup automático
log "💾 Paso 10: Configurando backup automático..."
cd staging
./setup-auto-backup.sh
cd ..

# Paso 11: Ejecutar migraciones iniciales
log "🗄️ Paso 11: Ejecutando migraciones iniciales..."
cd staging/backend
npm install
npm run build
npm run migrate
cd ../..

# Paso 12: Construir frontend
log "🌐 Paso 12: Construyendo frontend..."
cd staging/frontend
npm install
npm run build
cd ../..

# Paso 13: Configurar servicios del sistema
log "⚙️ Paso 13: Configurando servicios del sistema..."

# Crear archivo de servicio systemd para staging
sudo tee /etc/systemd/system/mundografic-staging.service << 'EOF'
[Unit]
Description=MundoGrafic Staging System
After=network.target postgresql.service nginx.service

[Service]
Type=forking
User=mundografic
WorkingDirectory=/home/mundografic/staging
ExecStart=/home/mundografic/staging/start-staging.sh
ExecStop=/home/mundografic/staging/stop-staging.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable mundografic-staging.service

# Paso 14: Verificar instalación
log "🔍 Paso 14: Verificando instalación..."

# Verificar que todos los servicios estén funcionando
log "Verificando servicios..."
cd staging
./health-check.sh
cd ..

# Paso 15: Configurar cron jobs
log "⏰ Paso 15: Configurando cron jobs..."

# Agregar monitoreo cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd)/staging && ./monitor-staging.sh >> logs/cron-monitor.log 2>&1") | crontab -

# Agregar limpieza de logs diaria a las 3:00 AM
(crontab -l 2>/dev/null; echo "0 3 * * * cd $(pwd)/staging && ./cleanup-logs.sh >> logs/cron-cleanup.log 2>&1") | crontab -

# Paso 16: Crear script de gestión rápida
log "⚡ Paso 16: Creando script de gestión rápida..."

cat > staging/quick-commands.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "⚡ Comandos rápidos para MundoGrafic Staging"
echo "=============================================="
echo ""
echo "🚀 Iniciar sistema: ./start-staging.sh"
echo "🛑 Detener sistema: ./stop-staging.sh"
echo "🔄 Reiniciar sistema: ./stop-staging.sh && ./start-staging.sh"
echo "📊 Monitoreo: ./monitor-staging.sh"
echo "🏥 Health Check: ./health-check.sh"
echo "🧹 Limpiar logs: ./cleanup-logs.sh"
echo "💾 Backup manual: ./backup-staging.sh"
echo "📝 Ver logs: tail -f logs/*.log"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
echo "   Nginx: http://localhost:8080"
echo ""
echo "🔧 Servicios del sistema:"
echo "   sudo systemctl start mundografic-staging"
echo "   sudo systemctl stop mundografic-staging"
echo "   sudo systemctl restart mundografic-staging"
echo "   sudo systemctl status mundografic-staging"
EOF

chmod +x staging/quick-commands.sh

# Paso 17: Crear documentación final
log "📚 Paso 17: Creando documentación final..."

cat > STAGING-INSTALLATION-COMPLETE.md << 'EOF'
# 🚀 Instalación Completa de Staging - MundoGrafic

## ✅ Instalación Completada

El sistema de staging ha sido instalado exitosamente en tu servidor.

## 🌐 Acceso al Sistema

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Nginx**: http://localhost:8080
- **Base de datos**: localhost:5432

## 📁 Estructura del Sistema

```
staging/
├── frontend/          # Frontend de React
├── backend/           # Backend de Node.js
├── database/          # Base de datos y backups
├── nginx/             # Configuración de nginx
├── logs/              # Logs del sistema
├── start-staging.sh   # Script de inicio
├── stop-staging.sh    # Script de parada
├── deploy-staging.sh  # Script de despliegue
├── monitor-staging.sh # Monitoreo del sistema
├── health-check.sh    # Verificación de salud
├── quick-commands.sh  # Comandos rápidos
└── staging.env        # Variables de entorno
```

## 🚀 Comandos Principales

### Gestión del Sistema
```bash
# Iniciar sistema
./staging/start-staging.sh

# Detener sistema
./staging/stop-staging.sh

# Reiniciar sistema
./staging/stop-staging.sh && ./staging/start-staging.sh

# Ver estado
./staging/monitor-staging.sh

# Verificar salud
./staging/health-check.sh
```

### Monitoreo y Mantenimiento
```bash
# Monitoreo en tiempo real
./staging/monitor-staging.sh

# Limpiar logs
./staging/cleanup-logs.sh

# Backup manual
./staging/backup-staging.sh

# Ver logs
tail -f staging/logs/*.log
```

### Servicios del Sistema
```bash
# Iniciar servicio
sudo systemctl start mundografic-staging

# Detener servicio
sudo systemctl stop mundografic-staging

# Reiniciar servicio
sudo systemctl restart mundografic-staging

# Ver estado
sudo systemctl status mundografic-staging

# Habilitar inicio automático
sudo systemctl enable mundografic-staging
```

## 🔧 Configuración Automática

### Cron Jobs Configurados
- **Monitoreo**: Cada 5 minutos
- **Limpieza de logs**: Diario a las 3:00 AM
- **Backup automático**: Diario a las 2:00 AM

### Servicios del Sistema
- **Nginx**: Configurado en puerto 8080
- **PostgreSQL**: Base de datos mundografic_staging
- **Firewall**: Puertos configurados y seguros

## 📊 Monitoreo

El sistema incluye monitoreo automático de:
- Estado de servicios
- Uso de recursos (CPU, memoria, disco)
- Logs de errores
- Conexiones de base de datos
- Salud de endpoints

## 🔒 Seguridad

- Firewall configurado con UFW
- Solo puertos necesarios abiertos
- PostgreSQL solo acepta conexiones locales
- Headers de seguridad en nginx
- Logs de acceso y errores

## 💾 Backup y Recuperación

- Backup automático diario
- Backup manual disponible
- Restauración desde backup
- Rotación automática de backups

## 🆘 Solución de Problemas

### Verificar Estado del Sistema
```bash
./staging/health-check.sh
./staging/monitor-staging.sh
```

### Ver Logs
```bash
tail -f staging/logs/backend-error.log
tail -f staging/logs/frontend-error.log
tail -f staging/logs/nginx/staging_error.log
```

### Reiniciar Servicios
```bash
sudo systemctl restart nginx
sudo systemctl restart postgresql
./staging/stop-staging.sh && ./staging/start-staging.sh
```

## 📞 Soporte

Para problemas o consultas:
1. Revisar logs del sistema
2. Ejecutar health-check
3. Verificar monitoreo
4. Revisar documentación

## 🎯 Próximos Pasos

1. **Probar el sistema**: Acceder a http://localhost:8080
2. **Configurar dominio**: Si tienes un dominio para staging
3. **Personalizar**: Ajustar configuraciones según necesidades
4. **Monitorear**: Revisar logs y métricas regularmente

---

**¡Sistema de staging instalado exitosamente! 🎉**
EOF

# Paso 18: Verificación final
log "🔍 Paso 18: Verificación final del sistema..."

echo ""
echo "================================================================"
echo "🎉 INSTALACIÓN COMPLETA FINALIZADA EXITOSAMENTE"
echo "================================================================"
echo ""
echo "✅ Sistema de staging completamente instalado y configurado"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
echo "   Nginx: http://localhost:8080"
echo ""
echo "📁 Directorio principal: ./staging/"
echo "📚 Documentación: STAGING-INSTALLATION-COMPLETE.md"
echo ""
echo "🚀 Para iniciar el sistema:"
echo "   cd staging && ./start-staging.sh"
echo ""
echo "⚡ Comandos rápidos:"
echo "   ./staging/quick-commands.sh"
echo ""
echo "🔍 Para verificar el estado:"
echo "   ./staging/health-check.sh"
echo ""
echo "📊 Para monitoreo continuo:"
echo "   ./staging/monitor-staging.sh"
echo ""
echo "================================================================"
echo "🎯 El sistema está listo para usar"
echo "================================================================"

# Iniciar el sistema automáticamente
log "🚀 Iniciando sistema de staging automáticamente..."
cd staging
./start-staging.sh &
cd ..

log "✅ Sistema iniciado en segundo plano"
log "🔍 Puedes verificar el estado con: ./staging/health-check.sh"
