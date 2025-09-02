# 🚀 Despliegue del Frontend en Servidor Debian

Este documento te guía paso a paso para desplegar el frontend de MundoGrafic en tu servidor Debian.

## 📋 Prerrequisitos

- Servidor Debian con acceso root
- Git instalado en el servidor
- Node.js y npm instalados en el servidor
- Backend ya configurado y ejecutándose en el puerto 3000

## 🔧 Opción 1: Despliegue Automático (Recomendado)

### 1. Copiar archivos al servidor
```bash
# Desde tu PC de desarrollo, copia estos archivos al servidor:
scp nginx-config.conf usuario@tu-servidor:/ruta/destino/
scp deploy-frontend-complete.sh usuario@tu-servidor:/ruta/destino/
```

### 2. Ejecutar el script de despliegue
```bash
# En el servidor, navega al directorio donde copiaste los archivos
cd /ruta/destino/

# Dar permisos de ejecución
chmod +x deploy-frontend-complete.sh

# Ejecutar como root
sudo bash deploy-frontend-complete.sh
```

## 🔧 Opción 2: Despliegue Manual

### 1. Instalar Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

### 2. Crear directorio para el frontend
```bash
sudo mkdir -p /var/www/mundografic
```

### 3. Configurar Nginx
```bash
# Copiar la configuración
sudo cp nginx-config.conf /etc/nginx/sites-available/mundografic

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/mundografic /etc/nginx/sites-enabled/

# Remover configuración por defecto
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### 4. Desplegar el frontend
```bash
# Navegar al directorio del proyecto
cd /ruta/a/tu/proyecto

# Obtener cambios de Git
git pull origin main

# Instalar dependencias (si es necesario)
npm install

# Compilar el frontend
npm run build

# Copiar archivos compilados
sudo rsync -a --delete dist/ /var/www/mundografic/

# Establecer permisos
sudo chown -R www-data:www-data /var/www/mundografic
sudo chmod -R 755 /var/www/mundografic
```

## 🌐 Verificar el Despliegue

### 1. Verificar estado de Nginx
```bash
sudo systemctl status nginx
```

### 2. Verificar que el frontend esté disponible
```bash
# Abrir en el navegador
http://IP-DEL-SERVIDOR
```

### 3. Verificar logs si hay problemas
```bash
# Logs de acceso
sudo tail -f /var/log/nginx/mundografic_access.log

# Logs de error
sudo tail -f /var/log/nginx/mundografic_error.log
```

## 🔄 Actualizaciones Futuras

### Opción 1: Usar el script update.sh existente
```bash
# Desde el directorio del proyecto
sudo bash update.sh
```

### Opción 2: Actualización manual
```bash
# Obtener cambios
git pull origin main

# Recompilar
npm run build

# Desplegar
sudo rsync -a --delete dist/ /var/www/mundografic/
sudo chown -R www-data:www-data /var/www/mundografic
```

## 🚨 Solución de Problemas

### Error 1: Nginx no inicia
```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo journalctl -u nginx -f
```

### Error 2: Frontend no carga
```bash
# Verificar permisos
ls -la /var/www/mundografic/

# Verificar que index.html existe
cat /var/www/mundografic/index.html | head -5
```

### Error 3: APIs no funcionan
```bash
# Verificar que el backend esté ejecutándose
sudo systemctl status mundografic-backend

# Verificar puerto
netstat -tlnp | grep :3000
```

## 📁 Estructura de Archivos en el Servidor

```
/var/www/mundografic/          # Directorio del frontend
├── index.html                 # Página principal
├── assets/                    # Archivos estáticos
│   ├── *.js                  # JavaScript compilado
│   ├── *.css                 # CSS compilado
│   └── *.png                 # Imágenes
└── ...

/etc/nginx/sites-available/    # Configuraciones de sitios
└── mundografic               # Configuración de tu sitio

/etc/nginx/sites-enabled/     # Sitios habilitados
└── mundografic -> ../sites-available/mundografic
```

## 🔒 Seguridad

- El frontend se sirve desde `/var/www/mundografic`
- Los permisos están configurados para `www-data:www-data`
- Las APIs se redirigen al backend en `localhost:3000`
- Headers de seguridad están configurados en Nginx

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Nginx
2. Verifica que el backend esté ejecutándose
3. Confirma que los archivos estén en `/var/www/mundografic`
4. Verifica la configuración de Nginx con `nginx -t`
