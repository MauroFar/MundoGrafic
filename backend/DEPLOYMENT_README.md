# 🚀 Guía de Despliegue - MundoGrafic Backend

Esta guía te ayudará a configurar la base de datos en tu servidor y restaurar los datos desde tu entorno local.

## 📋 Prerrequisitos

1. **PostgreSQL instalado en tu servidor**
2. **Node.js y npm instalados en tu servidor**
3. **Código desplegado en el servidor via Git**
4. **Archivo `.env` configurado con las credenciales del servidor**

## 🔧 Configuración del Archivo .env

Crea un archivo `.env` en el directorio `backend/` con la siguiente configuración:

```bash
# Configuración de Base de Datos para el Servidor
DB_HOST=tu-servidor.com
DB_PORT=5432
DB_NAME=mundografic_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Configuración de la aplicación
NODE_ENV=production
PORT=3000

# Configuración de JWT (mantén la misma que en desarrollo)
JWT_SECRET=tu_jwt_secret_muy_seguro

# Configuración de CORS (ajusta según tu dominio)
CORS_ORIGIN=https://tu-dominio.com

# Configuración de email (si usas nodemailer)
EMAIL_HOST=smtp.tu-proveedor.com
EMAIL_PORT=587
EMAIL_USER=tu_email@dominio.com
EMAIL_PASS=tu_password_email

# Configuración de archivos
UPLOAD_PATH=./storage/uploads
MAX_FILE_SIZE=10485760
```

## 🚀 Proceso de Despliegue

### Opción 1: Despliegue Automático (Recomendado)

```bash
# Desde el directorio backend/
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

Este script automáticamente:
1. ✅ Instala dependencias
2. ✅ Configura la base de datos
3. ✅ Crea backup de datos locales
4. ✅ Restaura datos en el servidor

### Opción 2: Despliegue Manual

#### Paso 1: Instalar dependencias
```bash
cd backend/
npm install
```

#### Paso 2: Configurar base de datos
```bash
node setup-server-db.js
```

#### Paso 3: Backup y restore de datos
```bash
node backup-restore.js
```

## 📊 Scripts Disponibles

### `setup-server-db.js`
- Crea la base de datos si no existe
- Ejecuta todas las migraciones SQL
- Verifica que las tablas se crearon correctamente

### `backup-restore.js`
- Crea backup completo de tu base de datos local
- Restaura todos los datos en el servidor
- Maneja errores de forma segura

### `deploy-to-server.sh`
- Script completo que automatiza todo el proceso
- Verifica cada paso antes de continuar
- Proporciona feedback detallado

## 🔍 Verificación del Despliegue

Después del despliegue, verifica que:

1. **Base de datos creada**: Las tablas están presentes
2. **Datos restaurados**: Los registros están disponibles
3. **Aplicación funcionando**: El servidor responde correctamente

### Comandos de verificación:

```bash
# Verificar estado de migraciones
npm run migrate:status

# Verificar tablas en la base de datos
node -e "
const { Client } = require('pg');
require('dotenv').config();
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});
client.connect().then(() => {
  return client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
}).then(result => {
  console.log('Tablas disponibles:', result.rows.map(r => r.table_name));
  client.end();
}).catch(console.error);
"
```

## 🚨 Solución de Problemas

### Error: "database does not exist"
- Verifica que PostgreSQL esté corriendo
- Confirma las credenciales en `.env`
- Asegúrate de que el usuario tenga permisos para crear bases de datos

### Error: "permission denied"
- Verifica que el usuario de la base de datos tenga permisos suficientes
- Asegúrate de que el usuario pueda crear tablas e insertar datos

### Error: "connection refused"
- Verifica que PostgreSQL esté escuchando en el puerto correcto
- Confirma que el firewall permita conexiones al puerto de la base de datos

## 📝 Comandos Útiles

```bash
# Iniciar en producción
npm run start

# Iniciar en desarrollo
npm run dev

# Solo configurar base de datos
node setup-server-db.js

# Solo hacer backup/restore
node backup-restore.js

# Ver logs en tiempo real
tail -f logs/app.log
```

## 🔄 Actualizaciones Futuras

Para futuras actualizaciones:

1. **Hacer pull del código actualizado**
2. **Ejecutar nuevas migraciones**: `npm run migrate`
3. **Reiniciar la aplicación**: `npm run start`

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs de error
2. Verifica la configuración del archivo `.env`
3. Confirma que PostgreSQL esté funcionando correctamente
4. Revisa los permisos del usuario de la base de datos

---

**¡Despliegue exitoso! 🎉**

Tu aplicación MundoGrafic debería estar funcionando correctamente en el servidor con todos los datos restaurados.
