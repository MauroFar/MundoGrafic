# 🚀 Guía de Despliegue en Producción - MundoGrafic

Esta guía te ayudará a desplegar tu aplicación MundoGrafic en un servidor Debian de manera profesional y segura.

## 📋 Prerrequisitos

- Servidor Debian 11/12 con acceso root
- Dominio configurado (opcional, pero recomendado)
- Acceso SSH al servidor

## 🔧 Configuración Inicial del Servidor

### 1. Ejecutar el script de configuración inicial

```bash
# En tu servidor Debian, ejecuta como root:
sudo bash setup-production.sh
```

Este script:
- Actualiza el sistema
- Instala Node.js 18.x, Nginx y dependencias
- Crea usuario `app` para la aplicación
- Configura firewall básico
- Configura Nginx automáticamente

### 2. Verificar la instalación

```bash
# Verificar que todo esté funcionando
node --version
npm --version
nginx -v
sudo systemctl status nginx
```

## 📁 Estructura de Directorios

Después de la configuración inicial, tendrás esta estructura:

```
/opt/myapp/
├── frontend/          # Tu código React
├── backend/           # Tu código Node.js
└── deploy.sh         # Script de despliegue

/var/www/myapp/       # Archivos compilados del frontend
```

## 🔐 Configuración de Variables de Entorno

### Frontend (.env)

Crea el archivo `.env` en `/opt/myapp/frontend/`:

```bash
# Variables de entorno para el frontend
VITE_API_URL=http://tu-dominio.com/api
VITE_APP_NAME=MundoGrafic
VITE_APP_VERSION=1.0.0
```

**⚠️ IMPORTANTE**: 
- Solo usa variables que empiecen con `VITE_`
- NO incluyas secretos sensibles aquí
- Las variables se compilan en el JS y son públicas

### Backend (.env)

Crea el archivo `.env` en `/opt/myapp/backend/`:

```bash
# Variables de entorno para el backend
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://usuario:password@localhost:5432/mundografic
JWT_SECRET=tu-jwt-secret-super-seguro
CORS_ORIGIN=http://tu-dominio.com
```

## 📦 Despliegue del Código

### 1. Copiar el código al servidor

```bash
# Desde tu máquina local, copia el frontend
scp -r ./frontend/* usuario@servidor:/opt/myapp/frontend/

# Copia el backend
scp -r ./backend/* usuario@servidor:/opt/myapp/backend/
```

### 2. Configurar permisos

```bash
# En el servidor
sudo chown -R app:app /opt/myapp
sudo chmod -R 755 /opt/myapp
```

### 3. Instalar dependencias y compilar

```bash
# Frontend
cd /opt/myapp/frontend
sudo -u app npm ci --only=production
sudo -u app npm run build

# Backend
cd /opt/myapp/backend
sudo -u app npm ci --only=production
```

## 🚀 Despliegue Automático

### Usar el script de despliegue

```bash
# Desplegar solo el frontend
sudo bash /opt/myapp/deploy.sh

# O usar el script completo
sudo bash deploy-frontend.sh production
```

### Despliegue manual

```bash
# 1. Compilar frontend
cd /opt/myapp/frontend
sudo -u app npm run build

# 2. Copiar archivos compilados
sudo rsync -a --delete dist/ /var/www/myapp/

# 3. Establecer permisos
sudo chown -R www-data:www-data /var/www/myapp
sudo chmod -R 755 /var/www/myapp

# 4. Recargar Nginx
sudo systemctl reload nginx
```

## 🌐 Configuración de Nginx

### Configuración básica

El archivo `/etc/nginx/sites-available/myapp` ya está configurado con:

- ✅ Compresión Gzip
- ✅ Cache para archivos estáticos
- ✅ Manejo de React Router
- ✅ Proxy para API
- ✅ Headers de seguridad
- ✅ Logs personalizados

### Configurar dominio

Edita `/etc/nginx/sites-available/myapp`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # Cambia esto
    
    # ... resto de la configuración
}
```

### Verificar y recargar

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configuración de SSL (HTTPS)

### Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtener certificado SSL

```bash
sudo certbot --nginx -d tu-dominio.com
```

### Renovación automática

```bash
# Verificar que funcione
sudo certbot renew --dry-run

# Agregar a crontab para renovación automática
sudo crontab -e
# Agregar esta línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🎯 Configuración del Backend

### 1. Configurar base de datos

```bash
# Instalar PostgreSQL si no está instalado
sudo apt install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres createdb mundografic
sudo -u postgres createuser --interactive
```

### 2. Configurar PM2 para el backend

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Crear archivo de configuración PM2
cat > /opt/myapp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mundografic-backend',
    script: 'src/server.ts',
    cwd: '/opt/myapp/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/pm2/err.log',
    out_file: '/var/log/pm2/out.log',
    log_file: '/var/log/pm2/combined.log',
    time: true
  }]
};
EOF

# Crear directorio de logs
sudo mkdir -p /var/log/pm2
sudo chown -R app:app /var/log/pm2
```

### 3. Iniciar el backend

```bash
cd /opt/myapp/backend
sudo -u app pm2 start ecosystem.config.js
sudo -u app pm2 save
sudo -u app pm2 startup
```

## 🔍 Monitoreo y Logs

### Ver logs de Nginx

```bash
# Logs de acceso
sudo tail -f /var/log/nginx/myapp_access.log

# Logs de error
sudo tail -f /var/log/nginx/myapp_error.log

# Logs generales
sudo tail -f /var/log/nginx/error.log
```

### Ver logs del backend

```bash
# Logs de PM2
sudo -u app pm2 logs

# Logs específicos
sudo tail -f /var/log/pm2/combined.log
```

### Monitoreo del sistema

```bash
# Estado de servicios
sudo systemctl status nginx
sudo -u app pm2 status

# Uso de recursos
htop
df -h
free -h
```

## 🔄 Actualizaciones

### Actualizar frontend

```bash
# 1. Copiar nuevo código
scp -r ./frontend/* usuario@servidor:/opt/myapp/frontend/

# 2. Recompilar y desplegar
sudo bash /opt/myapp/deploy.sh
```

### Actualizar backend

```bash
# 1. Copiar nuevo código
scp -r ./backend/* usuario@servidor:/opt/myapp/backend/

# 2. Instalar dependencias
cd /opt/myapp/backend
sudo -u app npm ci --only=production

# 3. Reiniciar aplicación
sudo -u app pm2 restart mundografic-backend
```

## 🛠️ Comandos Útiles

### Nginx
```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t
```

### PM2
```bash
sudo -u app pm2 start mundografic-backend
sudo -u app pm2 stop mundografic-backend
sudo -u app pm2 restart mundografic-backend
sudo -u app pm2 logs mundografic-backend
sudo -u app pm2 monit
```

### Sistema
```bash
# Ver puertos en uso
sudo netstat -tlnp

# Ver procesos
ps aux | grep node

# Ver uso de disco
df -h

# Ver memoria
free -h
```

## 🚨 Solución de Problemas

### Frontend no carga
```bash
# Verificar archivos
ls -la /var/www/myapp/

# Verificar permisos
sudo chown -R www-data:www-data /var/www/myapp

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### API no responde
```bash
# Verificar que el backend esté corriendo
sudo -u app pm2 status

# Verificar puerto
sudo netstat -tlnp | grep 3002

# Verificar logs del backend
sudo -u app pm2 logs
```

### Error 502 Bad Gateway
```bash
# Verificar que el backend esté corriendo
sudo -u app pm2 status

# Verificar configuración de proxy en Nginx
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `sudo tail -f /var/log/nginx/error.log`
2. Verifica el estado de los servicios: `sudo systemctl status nginx`
3. Verifica la configuración: `sudo nginx -t`
4. Revisa los permisos de archivos
5. Verifica que las variables de entorno estén correctas

---

**¡Tu aplicación MundoGrafic está lista para producción! 🎉**
