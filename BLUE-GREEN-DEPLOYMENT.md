# 🚀 Sistema de Despliegue Blue-Green para MundoGrafic

Este documento explica cómo implementar y usar un sistema de despliegue Blue-Green en tu servidor Debian para tu aplicación MundoGrafic.

## 🎯 ¿Qué es Blue-Green Deployment?

El despliegue Blue-Green es una estrategia que mantiene dos entornos idénticos:
- **🟦 Blue**: Entorno de producción actual
- **🟩 Green**: Entorno de pruebas/desarrollo

**Ventajas:**
- ✅ Cero tiempo de inactividad durante despliegues
- ✅ Rollback instantáneo en caso de problemas
- ✅ Pruebas seguras en entorno de producción
- ✅ Facilita testing A/B

## 📋 Prerrequisitos

- Servidor Debian 11/12 con acceso root
- Git instalado en el servidor
- Acceso SSH al servidor
- Tu código fuente en un repositorio Git

## 🔧 Configuración Inicial del Servidor

### Paso 1: Copiar scripts al servidor

```bash
# Desde tu máquina local, copia los scripts al servidor
scp setup-blue-green-server.sh usuario@tu-servidor:/tmp/
scp blue-green-deploy.sh usuario@tu-servidor:/tmp/
```

### Paso 2: Ejecutar configuración inicial

```bash
# Conectarse al servidor
ssh usuario@tu-servidor

# Ejecutar como root
sudo bash /tmp/setup-blue-green-server.sh
```

Este script:
- ✅ Actualiza el sistema
- ✅ Instala Node.js, Nginx, PM2
- ✅ Crea usuario `app` para la aplicación
- ✅ Configura directorios Blue-Green
- ✅ Configura Nginx automáticamente
- ✅ Configura firewall básico
- ✅ Crea scripts de gestión

### Paso 3: Copiar tu código al servidor

```bash
# En el servidor, copia tu código
sudo cp -r /ruta/a/tu/proyecto/* /opt/mundografic/frontend/
sudo cp -r /ruta/a/tu/backend/* /opt/mundografic/backend/

# Establecer permisos
sudo chown -R app:app /opt/mundografic
```

## 🚀 Primer Despliegue

### Desplegar en entorno Blue (producción)

```bash
# Copiar el script de despliegue
sudo cp /tmp/blue-green-deploy.sh /opt/mundografic/
sudo chmod +x /opt/mundografic/blue-green-deploy.sh

# Navegar al directorio del frontend
cd /opt/mundografic/frontend

# Desplegar en Blue
sudo bash /opt/mundografic/blue-green-deploy.sh blue
```

### Verificar el despliegue

```bash
# Ver estado del sistema
sudo bash /opt/mundografic/blue-green-deploy.sh status

# Ver logs de Nginx
sudo tail -f /var/log/nginx/mundografic_error.log
```

## 🔄 Flujo de Trabajo Blue-Green

### 1. Desarrollo y Pruebas

```bash
# Desplegar nueva versión en Green (entorno de pruebas)
cd /opt/mundografic/frontend
sudo bash /opt/mundografic/blue-green-deploy.sh green
```

### 2. Probar en Green

- 🌐 Accede a tu aplicación
- 🧪 Prueba todas las funcionalidades
- ✅ Verifica que todo funcione correctamente

### 3. Cambiar a Producción

```bash
# Cambiar de Blue a Green (nueva versión)
sudo bash /opt/mundografic/blue-green-deploy.sh switch
```

### 4. Verificar Producción

```bash
# Ver estado
sudo bash /opt/mundografic/blue-green-deploy.sh status

# Monitorear logs
sudo tail -f /var/log/nginx/mundografic_access.log
```

## 🛠️ Comandos Principales

### Despliegue

```bash
# Desplegar en Blue
sudo bash /opt/mundografic/blue-green-deploy.sh blue

# Desplegar en Green
sudo bash /opt/mundografic/blue-green-deploy.sh green

# Cambiar entre entornos
sudo bash /opt/mundografic/blue-green-deploy.sh switch
```

### Monitoreo

```bash
# Ver estado completo
sudo bash /opt/mundografic/blue-green-deploy.sh status

# Monitoreo básico
sudo bash /opt/mundografic/monitor.sh

# Logs de Nginx
sudo tail -f /var/log/nginx/mundografic_error.log
sudo tail -f /var/log/nginx/mundografic_access.log
```

### Gestión

```bash
# Hacer rollback
sudo bash /opt/mundografic/blue-green-deploy.sh rollback

# Ver backups disponibles
ls -la /var/backups/mundografic/

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔄 Flujo de Desarrollo Típico

### Escenario 1: Nueva Funcionalidad

```bash
# 1. Desarrollar en tu máquina local
git add .
git commit -m "Nueva funcionalidad"
git push origin main

# 2. En el servidor, desplegar en Green
cd /opt/mundografic/frontend
sudo bash /opt/mundografic/blue-green-deploy.sh green

# 3. Probar en Green
# Acceder a la aplicación y verificar

# 4. Si todo está bien, cambiar a producción
sudo bash /opt/mundografic/blue-green-deploy.sh switch

# 5. Verificar que Blue (producción) funcione
sudo bash /opt/mundografic/blue-green-deploy.sh status
```

### Escenario 2: Rollback por Problemas

```bash
# 1. Detectar problema en producción
# 2. Hacer rollback inmediato
sudo bash /opt/mundografic/blue-green-deploy.sh rollback

# 3. Verificar que el rollback funcionó
sudo bash /opt/mundografic/blue-green-deploy.sh status

# 4. Investigar y corregir el problema
# 5. Desplegar versión corregida en Green
sudo bash /opt/mundografic/blue-green-deploy.sh green
```

## 📁 Estructura de Directorios

```
/opt/mundografic/
├── frontend/                    # Código fuente del frontend
├── backend/                     # Código fuente del backend
├── blue-green-deploy.sh        # Script principal de despliegue
├── monitor.sh                   # Script de monitoreo
├── auto-backup.sh              # Script de backup automático
└── ecosystem.config.js         # Configuración de PM2

/var/www/
├── mundografic-blue/           # Entorno Blue (producción)
├── mundografic-green/          # Entorno Green (pruebas)
└── mundografic -> mundografic-blue  # Enlace simbólico

/var/backups/mundografic/       # Backups automáticos
/var/log/mundografic/           # Logs de la aplicación
```

## 🔒 Seguridad y Permisos

### Usuarios y Permisos

- **Usuario `app`**: Propietario del código fuente
- **Usuario `www-data`**: Propietario de archivos web
- **Usuario `root`**: Solo para operaciones de despliegue

### Firewall

- ✅ Puerto 22 (SSH) abierto
- ✅ Puerto 80 (HTTP) abierto
- ✅ Puerto 443 (HTTPS) abierto
- ❌ Todos los demás puertos cerrados

## 📊 Monitoreo y Logs

### Logs de Nginx

```bash
# Logs de acceso
sudo tail -f /var/log/nginx/mundografic_access.log

# Logs de error
sudo tail -f /var/log/nginx/mundografic_error.log

# Logs generales
sudo tail -f /var/log/nginx/error.log
```

### Logs de la Aplicación

```bash
# Logs de PM2 (backend)
sudo -u app pm2 logs

# Logs personalizados
sudo tail -f /var/log/mundografic/combined.log
```

### Monitoreo del Sistema

```bash
# Estado de servicios
sudo systemctl status nginx
sudo -u app pm2 status

# Uso de recursos
htop
df -h
free -h
```

## 🚨 Solución de Problemas

### Problema 1: Nginx no inicia

```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo journalctl -u nginx -f

# Verificar permisos
ls -la /var/www/mundografic/
```

### Problema 2: Frontend no carga

```bash
# Verificar enlace simbólico
ls -la /var/www/mundografic

# Verificar archivos
ls -la /var/www/mundografic-blue/
ls -la /var/www/mundografic-green/

# Verificar permisos
sudo chown -R www-data:www-data /var/www/mundografic-*
```

### Problema 3: API no responde

```bash
# Verificar estado del backend
sudo -u app pm2 status

# Verificar puerto
sudo netstat -tlnp | grep :3000

# Ver logs del backend
sudo -u app pm2 logs
```

### Problema 4: Error en despliegue

```bash
# Ver estado del sistema
sudo bash /opt/mundografic/blue-green-deploy.sh status

# Ver logs de Nginx
sudo tail -f /var/log/nginx/mundografic_error.log

# Verificar directorios
sudo ls -la /var/www/
```

## 🔄 Actualizaciones y Mantenimiento

### Actualizar Dependencias

```bash
# En tu máquina local
npm update
git add package*.json
git commit -m "Actualizar dependencias"
git push origin main

# En el servidor
cd /opt/mundografic/frontend
sudo bash /opt/mundografic/blue-green-deploy.sh green
```

### Limpiar Backups Antiguos

```bash
# Ver backups
ls -la /var/backups/mundografic/

# Eliminar backups antiguos (más de 30 días)
sudo find /var/backups/mundografic/ -name "backup_*" -mtime +30 -delete
```

### Actualizar Scripts

```bash
# Copiar nuevos scripts
scp blue-green-deploy.sh usuario@servidor:/tmp/
sudo cp /tmp/blue-green-deploy.sh /opt/mundografic/
sudo chmod +x /opt/mundografic/blue-green-deploy.sh
```

## 📈 Mejores Prácticas

### 1. Siempre Prueba en Green

- ✅ Nunca despliegues directamente en Blue
- ✅ Siempre usa Green para pruebas
- ✅ Solo cambia a Blue cuando estés seguro

### 2. Backups Regulares

- ✅ Los backups se crean automáticamente
- ✅ Mantén al menos 7 días de backups
- ✅ Verifica que los backups funcionen

### 3. Monitoreo Continuo

- ✅ Revisa logs regularmente
- ✅ Monitorea el estado del sistema
- ✅ Configura alertas si es posible

### 4. Rollback Rápido

- ✅ Ten un plan de rollback
- ✅ Practica el rollback regularmente
- ✅ Documenta problemas y soluciones

## 🎯 Casos de Uso Comunes

### Desarrollo Diario

```bash
# 1. Desplegar cambios en Green
sudo bash /opt/mundografic/blue-green-deploy.sh green

# 2. Probar cambios
# 3. Si hay problemas, corregir y repetir
# 4. Si todo está bien, cambiar a producción
sudo bash /opt/mundografic/blue-green-deploy.sh switch
```

### Lanzamiento de Versión

```bash
# 1. Crear tag de versión
git tag v1.2.0
git push origin v1.2.0

# 2. Desplegar en Green
sudo bash /opt/mundografic/blue-green-deploy.sh green

# 3. Pruebas exhaustivas
# 4. Cambiar a producción
sudo bash /opt/mundografic/blue-green-deploy.sh switch

# 5. Monitorear producción
sudo bash /opt/mundografic/monitor.sh
```

### Mantenimiento de Emergencia

```bash
# 1. Detectar problema crítico
# 2. Rollback inmediato
sudo bash /opt/mundografic/blue-green-deploy.sh rollback

# 3. Investigar problema
# 4. Corregir y probar en Green
# 5. Desplegar corrección cuando esté lista
```

## 📞 Soporte y Ayuda

### Comandos de Diagnóstico

```bash
# Estado completo del sistema
sudo bash /opt/mundografic/blue-green-deploy.sh status

# Monitoreo en tiempo real
sudo bash /opt/mundografic/monitor.sh

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/mundografic_error.log
```

### Información del Sistema

```bash
# Versiones instaladas
node --version
npm --version
nginx -v
pm2 --version

# Estado de servicios
sudo systemctl status nginx
sudo -u app pm2 status

# Uso de recursos
df -h
free -h
```

---

## 🎉 ¡Tu Sistema Blue-Green está Listo!

Con este sistema tienes:
- ✅ Despliegues sin tiempo de inactividad
- ✅ Rollback instantáneo
- ✅ Entorno de pruebas seguro
- ✅ Monitoreo completo
- ✅ Backups automáticos

**¡Disfruta de despliegues seguros y profesionales! 🚀**
