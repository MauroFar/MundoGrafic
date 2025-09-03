# 🚀 Sistema de Staging Completo - MundoGrafic

## 📋 Descripción General

Este es un sistema completo de **staging blue-green** para el proyecto MundoGrafic, diseñado para permitir pruebas completas del sistema (frontend, backend, base de datos) en un entorno de servidor Debian sin afectar la producción.

## 🎯 Características Principales

- ✅ **Backend completo** con Node.js/Express
- ✅ **Frontend completo** con React
- ✅ **Base de datos separada** PostgreSQL
- ✅ **Nginx configurado** para staging
- ✅ **Firewall configurado** con UFW
- ✅ **Monitoreo automático** del sistema
- ✅ **Backup automático** diario
- ✅ **Logs organizados** y rotación automática
- ✅ **Servicios systemd** para gestión
- ✅ **Cron jobs** para tareas automáticas
- ✅ **Scripts de gestión** completos

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │   Base de       │
│   (Puerto 3000) │◄──►│   (Puerto 3001) │◄──►│   Datos        │
│                 │    │                 │    │   (Puerto 5432) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Nginx       │
                    │  (Puerto 8080)  │
                    │   Proxy/Static  │
                    └─────────────────┘
```

## 📁 Estructura de Archivos

```
MundoGrafic/
├── staging/                          # Directorio principal de staging
│   ├── frontend/                     # Frontend de React
│   ├── backend/                      # Backend de Node.js
│   ├── database/                     # Base de datos y backups
│   ├── nginx/                        # Configuración de nginx
│   ├── logs/                         # Logs del sistema
│   ├── start-staging.sh              # Script de inicio
│   ├── stop-staging.sh               # Script de parada
│   ├── deploy-staging.sh             # Script de despliegue
│   ├── monitor-staging.sh            # Monitoreo del sistema
│   ├── health-check.sh               # Verificación de salud
│   ├── cleanup-logs.sh               # Limpieza de logs
│   ├── backup-staging.sh             # Backup manual
│   ├── restore-staging.sh            # Restauración
│   ├── install-dependencies.sh       # Instalación de dependencias
│   ├── quick-commands.sh             # Comandos rápidos
│   ├── ecosystem-staging.config.js   # Configuración PM2
│   └── staging.env                   # Variables de entorno
├── staging.env                       # Variables de entorno principales
├── setup-staging-complete.sh         # Script de configuración completa
├── setup-nginx-staging.sh            # Configuración de nginx
├── setup-database-staging.sh         # Configuración de base de datos
├── setup-firewall-staging.sh         # Configuración de firewall
├── setup-monitoring-staging.sh       # Configuración de monitoreo
├── deploy-staging-server.sh          # Despliegue en servidor
├── install-staging-complete.sh       # Instalación completa automática
├── verify-staging.sh                 # Verificación del sistema
└── README-STAGING-SYSTEM.md          # Esta documentación
```

## 🚀 Instalación Rápida

### Opción 1: Instalación Automática Completa (Recomendada)

```bash
# 1. Clonar o descargar el proyecto
git clone <tu-repositorio>
cd MundoGrafic

# 2. Dar permisos de ejecución
chmod +x *.sh
chmod +x staging/*.sh

# 3. Ejecutar instalación completa
./install-staging-complete.sh
```

### Opción 2: Instalación Manual por Pasos

```bash
# 1. Preparar estructura de staging
./deploy-staging-server.sh

# 2. Configurar base de datos
./setup-database-staging.sh

# 3. Configurar nginx
./setup-nginx-staging.sh

# 4. Configurar firewall
./setup-firewall-staging.sh

# 5. Configurar monitoreo
./setup-monitoring-staging.sh

# 6. Instalar dependencias
cd staging && ./install-dependencies.sh

# 7. Desplegar sistema
./deploy-staging.sh
```

## 🔧 Configuración del Sistema

### Variables de Entorno

El archivo `staging.env` contiene todas las configuraciones necesarias:

```bash
# Configuración de Staging
NODE_ENV=staging
PORT=3001
FRONTEND_PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mundografic_staging
DB_USER=mundografic_user
DB_PASSWORD=mundografic_pass_2024

# JWT
JWT_SECRET=mundografic_staging_secret_key_2024
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Storage
STORAGE_PATH=./storage
UPLOAD_PATH=./storage/uploads
FIRMAS_PATH=./storage/firmas
PDFS_PATH=./storage/pdfs
```

### Puertos del Sistema

- **3000**: Frontend de React
- **3001**: Backend de Node.js
- **8080**: Nginx (proxy y archivos estáticos)
- **5432**: PostgreSQL (base de datos)

## 🎮 Comandos de Gestión

### Comandos Principales

```bash
# Iniciar sistema completo
./staging/start-staging.sh

# Detener sistema completo
./staging/stop-staging.sh

# Reiniciar sistema
./staging/stop-staging.sh && ./staging/start-staging.sh

# Desplegar actualizaciones
./staging/deploy-staging.sh

# Ver estado del sistema
./staging/monitor-staging.sh

# Verificar salud del sistema
./staging/health-check.sh
```

### Comandos de Monitoreo

```bash
# Monitoreo en tiempo real
./staging/monitor-staging.sh

# Ver logs en tiempo real
tail -f staging/logs/*.log

# Ver logs específicos
tail -f staging/logs/backend-error.log
tail -f staging/logs/frontend-error.log

# Limpiar logs antiguos
./staging/cleanup-logs.sh
```

### Comandos de Backup

```bash
# Backup manual
./staging/backup-staging.sh

# Restaurar desde backup
./staging/restore-staging.sh <directorio_backup>

# Ver backups disponibles
ls -la staging/database/backups/
```

### Comandos del Sistema

```bash
# Ver estado de servicios
sudo systemctl status mundografic-staging
sudo systemctl status nginx
sudo systemctl status postgresql

# Reiniciar servicios
sudo systemctl restart mundografic-staging
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Ver logs del sistema
sudo journalctl -u mundografic-staging -f
sudo journalctl -u nginx -f
```

## 📊 Monitoreo y Logs

### Monitoreo Automático

El sistema incluye monitoreo automático cada 5 minutos que verifica:

- Estado de servicios (backend, frontend, nginx, postgresql)
- Uso de recursos (CPU, memoria, disco)
- Estado de puertos
- Conexiones de base de datos
- Logs de errores recientes

### Logs del Sistema

```
staging/logs/
├── backend-error.log      # Errores del backend
├── backend-out.log        # Salida del backend
├── frontend-error.log     # Errores del frontend
├── frontend-out.log       # Salida del frontend
├── cron-monitor.log       # Logs de monitoreo automático
├── cron-cleanup.log       # Logs de limpieza automática
└── auto-backup.log        # Logs de backup automático
```

### Rotación de Logs

- **Logs activos**: Máximo 1000 líneas
- **Compresión**: Después de 7 días
- **Eliminación**: Después de 30 días
- **Limpieza automática**: Diaria a las 3:00 AM

## 🔒 Seguridad

### Firewall (UFW)

- Solo puertos necesarios abiertos
- PostgreSQL solo acepta conexiones locales
- Reglas específicas para staging

### Headers de Seguridad

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Base de Datos

- Usuario específico para staging
- Contraseña segura
- Privilegios limitados al esquema de staging

## 💾 Backup y Recuperación

### Backup Automático

- **Frecuencia**: Diario a las 2:00 AM
- **Contenido**: Base de datos + archivos importantes
- **Retención**: Últimos 10 backups
- **Compresión**: Automática

### Backup Manual

```bash
# Crear backup manual
./staging/backup-staging.sh

# Restaurar desde backup
./staging/restore-staging.sh database/backups/staging_20241201_143022
```

## 🆘 Solución de Problemas

### Verificación del Sistema

```bash
# Verificación rápida
./verify-staging.sh

# Verificación detallada
./staging/health-check.sh

# Monitoreo continuo
./staging/monitor-staging.sh
```

### Problemas Comunes

#### 1. Servicios no inician

```bash
# Verificar logs
sudo journalctl -u mundografic-staging -f

# Verificar dependencias
./staging/health-check.sh

# Reiniciar servicios
sudo systemctl restart mundografic-staging
```

#### 2. Base de datos no conecta

```bash
# Verificar servicio PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
psql -h localhost -U mundografic_user -d mundografic_staging

# Verificar variables de entorno
cat staging.env | grep DB_
```

#### 3. Nginx no funciona

```bash
# Verificar configuración
sudo nginx -t

# Verificar servicio
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/staging_error.log
```

#### 4. Puertos cerrados

```bash
# Verificar puertos
sudo netstat -tlnp | grep -E ':(3000|3001|8080|5432)'

# Verificar firewall
sudo ufw status

# Verificar servicios
./staging/monitor-staging.sh
```

## 🔄 Actualizaciones y Mantenimiento

### Actualizar Código

```bash
# 1. Detener sistema
./staging/stop-staging.sh

# 2. Actualizar desde git
git pull origin main

# 3. Desplegar actualizaciones
./staging/deploy-staging.sh
```

### Mantenimiento Regular

```bash
# Limpiar logs (automático diario)
./staging/cleanup-logs.sh

# Verificar backups
ls -la staging/database/backups/

# Verificar uso de disco
df -h

# Verificar uso de memoria
free -h
```

## 📈 Escalabilidad

### Para Producción

- Usar PM2 para gestión de procesos
- Configurar balanceador de carga
- Implementar monitoreo con herramientas como Prometheus
- Configurar alertas automáticas

### Para Múltiples Entornos

- Crear directorios separados para cada entorno
- Usar variables de entorno específicas
- Configurar nginx con múltiples sitios
- Implementar CI/CD pipeline

## 🤝 Contribución

### Reportar Problemas

1. Ejecutar `./verify-staging.sh`
2. Ejecutar `./staging/health-check.sh`
3. Revisar logs relevantes
4. Documentar pasos para reproducir

### Mejorar el Sistema

1. Fork del proyecto
2. Crear rama para feature
3. Implementar cambios
4. Probar con scripts de verificación
5. Crear pull request

## 📞 Soporte

### Recursos Disponibles

- **Documentación**: Este README
- **Scripts de verificación**: `./verify-staging.sh`
- **Monitoreo**: `./staging/monitor-staging.sh`
- **Health Check**: `./staging/health-check.sh`
- **Logs**: Directorio `staging/logs/`

### Contacto

Para soporte técnico o consultas:
1. Revisar esta documentación
2. Ejecutar scripts de verificación
3. Revisar logs del sistema
4. Consultar la documentación del proyecto principal

## 📝 Changelog

### Versión 1.0.0 (2024-12-01)
- ✅ Sistema completo de staging implementado
- ✅ Backend con Node.js/Express
- ✅ Frontend con React
- ✅ Base de datos PostgreSQL separada
- ✅ Nginx configurado para staging
- ✅ Firewall configurado con UFW
- ✅ Monitoreo automático del sistema
- ✅ Backup automático diario
- ✅ Logs organizados y rotación automática
- ✅ Servicios systemd para gestión
- ✅ Cron jobs para tareas automáticas
- ✅ Scripts de gestión completos

---

## 🎉 ¡Sistema de Staging Listo!

Tu sistema de staging está completamente configurado y listo para usar. Puedes probar todas las funcionalidades sin afectar la producción.

**¡Disfruta desarrollando y probando en tu entorno seguro de staging!** 🚀
