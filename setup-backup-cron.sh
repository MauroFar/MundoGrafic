#!/bin/bash

# Script para configurar backups automáticos de la base de datos
# Uso: sudo bash setup-backup-cron.sh

set -e

echo "🔄 Configurando backups automáticos de la base de datos..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde /opt/myapp"
    exit 1
fi

# Hacer los scripts ejecutables
echo "🔧 Configurando permisos de ejecución..."
chmod +x backup-database.sh
chmod +x restore-database.sh
chmod +x list-backups.sh

# Crear directorio de backups si no existe
mkdir -p backups

# Función para agregar tarea cron
add_cron_job() {
    local schedule="$1"
    local description="$2"
    local command="$3"
    
    echo "📅 Configurando: $description"
    echo "   Horario: $schedule"
    
    # Crear la tarea cron
    (crontab -l 2>/dev/null; echo "$schedule $command") | crontab -
    
    echo "✅ Tarea cron agregada"
    echo ""
}

# Mostrar opciones de backup
echo "📋 Opciones de backup automático:"
echo "1. Diario (cada día a las 2:00 AM)"
echo "2. Semanal (cada domingo a las 2:00 AM)"
echo "3. Mensual (primer día del mes a las 2:00 AM)"
echo "4. Personalizado"
echo ""

read -p "Selecciona una opción (1-4): " choice

case $choice in
    1)
        # Backup diario
        add_cron_job "0 2 * * *" "Backup diario" "cd /opt/myapp && sudo bash backup-database.sh backup_diario_\$(date +\%Y-\%m-\%d) >> /var/log/backup.log 2>&1"
        ;;
    2)
        # Backup semanal
        add_cron_job "0 2 * * 0" "Backup semanal" "cd /opt/myapp && sudo bash backup-database.sh backup_semanal_\$(date +\%Y-\%m-\%d) >> /var/log/backup.log 2>&1"
        ;;
    3)
        # Backup mensual
        add_cron_job "0 2 1 * *" "Backup mensual" "cd /opt/myapp && sudo bash backup-database.sh backup_mensual_\$(date +\%Y-\%m) >> /var/log/backup.log 2>&1"
        ;;
    4)
        # Backup personalizado
        echo ""
        echo "📅 Configuración personalizada:"
        echo "Formato cron: minuto hora día mes día_semana"
        echo "Ejemplos:"
        echo "  0 2 * * *     - Diario a las 2:00 AM"
        echo "  0 2 * * 0     - Semanal (domingo) a las 2:00 AM"
        echo "  0 2 1 * *     - Mensual (día 1) a las 2:00 AM"
        echo "  0 3 * * 1-5   - Lunes a viernes a las 3:00 AM"
        echo ""
        read -p "Ingresa el horario cron: " custom_schedule
        add_cron_job "$custom_schedule" "Backup personalizado" "cd /opt/myapp && sudo bash backup-database.sh backup_personalizado_\$(date +\%Y-\%m-\%d_\%H-\%M) >> /var/log/backup.log 2>&1"
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

# Configurar limpieza automática de backups antiguos
echo "🧹 Configurando limpieza automática de backups antiguos..."
echo "   (Mantiene solo los últimos 30 días)"

# Agregar tarea de limpieza (diaria a las 3:00 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * find /opt/myapp/backups -name '*.sql.gz' -mtime +30 -delete >> /var/log/backup-cleanup.log 2>&1") | crontab -

echo "✅ Limpieza automática configurada"

# Crear archivo de log
touch /var/log/backup.log
chmod 644 /var/log/backup.log

# Mostrar tareas cron configuradas
echo ""
echo "📋 Tareas cron configuradas:"
crontab -l | grep -E "(backup|cleanup)" || echo "   No se encontraron tareas de backup"

# Crear script de verificación de estado
cat > check-backup-status.sh << 'EOF'
#!/bin/bash

echo "📊 Estado de los backups automáticos:"
echo "====================================="

# Verificar si cron está corriendo
if systemctl is-active --quiet cron; then
    echo "✅ Servicio cron: ACTIVO"
else
    echo "❌ Servicio cron: INACTIVO"
fi

# Mostrar tareas de backup configuradas
echo ""
echo "📅 Tareas de backup configuradas:"
crontab -l | grep -E "(backup|cleanup)" || echo "   No se encontraron tareas de backup"

# Mostrar últimos logs
echo ""
echo "📋 Últimos logs de backup:"
if [ -f "/var/log/backup.log" ]; then
    tail -10 /var/log/backup.log
else
    echo "   No se encontraron logs de backup"
fi

# Mostrar espacio usado
echo ""
echo "💾 Espacio usado por backups:"
if [ -d "/opt/myapp/backups" ]; then
    du -sh /opt/myapp/backups
    echo "   Archivos: $(find /opt/myapp/backups -name '*.sql.gz' | wc -l)"
else
    echo "   Directorio de backups no encontrado"
fi
EOF

chmod +x check-backup-status.sh

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📋 Comandos útiles:"
echo "  sudo bash list-backups.sh          - Gestionar backups"
echo "  sudo bash check-backup-status.sh   - Verificar estado de backups"
echo "  sudo bash backup-database.sh       - Crear backup manual"
echo "  crontab -l                         - Ver tareas cron"
echo "  tail -f /var/log/backup.log        - Ver logs en tiempo real"
echo ""
echo "💡 El primer backup automático se ejecutará según el horario configurado"
