# 🚀 Sistema Blue-Green Deployment Profesional

## 📋 **Resumen del Sistema**

Este sistema implementa un **Blue-Green Deployment** profesional para MundoGrafic, permitiendo:

- ✅ **Un solo código base** para BLUE (producción) y GREEN (staging)
- ✅ **Builds separados** con diferentes configuraciones
- ✅ **Backend independiente** en `staging/`
- ✅ **Frontend servido** desde build optimizado
- ✅ **Migraciones seguras** GREEN → BLUE
- ✅ **Pruebas integradas** antes de migrar a producción

## 🎯 **Arquitectura del Sistema**

### **BLUE (Producción)**
- **Frontend**: Puerto 3000
- **Backend**: Puerto 3002
- **Base de datos**: `sistema_mg`
- **Configuración**: `.env` (producción)

### **GREEN (Staging)**
- **Frontend**: Puerto 3001
- **Backend**: Puerto 3003
- **Base de datos**: `sistema_mg_staging`
- **Configuración**: `staging.env` + `.env.staging`

## 🛠️ **Scripts Principales**

### **1. control-green.sh**
Script principal para manejar el sistema GREEN:

```bash
./control-green.sh
```

**Opciones disponibles:**
1. 🚀 Levantar sistema GREEN completo
2. 🛑 Bajar sistema GREEN
3. 📊 Ver estado
4. 📝 Ver logs
5. 🌐 Acceso local y red
6. 🔄 Actualizar sistema GREEN
7. 🧪 Pruebas rápidas
8. 🟢 Migrar solo GREEN (staging)
9. 🔵 Migrar solo BLUE (producción)
10. 🟢🔵 Migrar GREEN → BLUE (secuencial)
11. 📊 Ver estado de migraciones
12. ❌ Salir

### **2. migrate-sequential.sh**
Script independiente para migraciones seguras:

```bash
./migrate-sequential.sh
```

**Opciones disponibles:**
1. 🟢 Migrar solo GREEN (staging)
2. 🔵 Migrar solo BLUE (producción)
3. 🟢🔵 Migrar GREEN → BLUE (secuencial)
4. 📊 Ver estado de migraciones
5. ❌ Salir

## 🔧 **Configuración**

### **Archivos de Configuración**

#### **staging.env** (Backend GREEN)
```bash
NODE_ENV=staging
PORT=3003
FRONTEND_PORT=3001
DB_NAME=sistema_mg_staging
DB_USER=postgres
DB_PASSWORD=2024Asdaspro@
DB_HOST=localhost
DB_PORT=5432
```

#### **.env.staging** (Frontend GREEN)
```bash
VITE_API_URL=http://localhost:3003
VITE_ENV=staging
VITE_APP_NAME=MundoGrafic Staging
VITE_APP_VERSION=1.0.0-staging
VITE_FRONTEND_PORT=3001
```

#### **knexfile.js** (Staging Backend)
```javascript
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  }
};
```

## 🚀 **Flujo de Trabajo**

### **1. Desarrollo y Testing**
```bash
# 1. Hacer cambios en el código
git add .
git commit -m "Nuevas funcionalidades"
git push origin main

# 2. En el servidor, actualizar y probar GREEN
./control-green.sh
# Seleccionar opción 6: Actualizar sistema GREEN

# 3. Probar el sistema GREEN
# Seleccionar opción 1: Levantar sistema GREEN completo
# Seleccionar opción 7: Pruebas rápidas
```

### **2. Migración Segura**
```bash
# Opción A: Usar control-green.sh
./control-green.sh
# Seleccionar opción 10: Migrar GREEN → BLUE (secuencial)

# Opción B: Usar migrate-sequential.sh
./migrate-sequential.sh
# Seleccionar opción 3: Migrar GREEN → BLUE (secuencial)
```

### **3. Verificación**
```bash
# Ver estado de migraciones
./control-green.sh
# Seleccionar opción 11: Ver estado de migraciones

# Ver logs del sistema
# Seleccionar opción 4: Ver logs
```

## 🔍 **Troubleshooting**

### **Problemas Comunes**

#### **1. Puerto en uso**
```bash
# Verificar puertos
sudo netstat -tlnp | grep -E ':(3001|3003)'

# Matar procesos
sudo kill -9 <PID>
```

#### **2. Permisos de archivos**
```bash
# Arreglar permisos
sudo chown -R mauro_far:mauro_far dist/
sudo chmod -R 755 dist/
```

#### **3. Base de datos no conecta**
```bash
# Verificar configuración
cat staging/backend/.env

# Verificar que existe la BD
psql -U postgres -l | grep sistema_mg_staging
```

#### **4. Frontend no se conecta al backend**
```bash
# Verificar .env.staging
cat .env.staging

# Verificar que el backend esté corriendo
curl http://localhost:3003/api/health
```

## 📊 **Monitoreo**

### **Logs del Sistema**
```bash
# Backend GREEN
tail -f staging/logs/backend.log

# Frontend GREEN
tail -f staging/logs/frontend.log

# Logs del sistema
./control-green.sh
# Seleccionar opción 4: Ver logs
```

### **Estado del Sistema**
```bash
# Ver estado completo
./control-green.sh
# Seleccionar opción 3: Ver estado

# Ver estado de migraciones
./control-green.sh
# Seleccionar opción 11: Ver estado de migraciones
```

## 🎯 **Mejores Prácticas**

### **1. Desarrollo**
- ✅ **Siempre probar en GREEN** antes de migrar a BLUE
- ✅ **Usar migraciones secuenciales** para cambios de BD
- ✅ **Verificar logs** después de cada cambio
- ✅ **Hacer backups** antes de migraciones importantes

### **2. Migraciones**
- ✅ **Migrar GREEN primero** y probar
- ✅ **Verificar que GREEN funciona** antes de migrar BLUE
- ✅ **Usar confirmaciones** para migraciones a producción
- ✅ **Monitorear logs** durante las migraciones

### **3. Mantenimiento**
- ✅ **Limpiar logs** periódicamente
- ✅ **Verificar estado** de migraciones regularmente
- ✅ **Actualizar dependencias** en ambos entornos
- ✅ **Hacer backups** de la base de datos

## 🔒 **Seguridad**

### **Firewall**
```bash
# Ver reglas activas
sudo ufw status

# Agregar puertos si es necesario
sudo ufw allow 3001/tcp
sudo ufw allow 3003/tcp
```

### **Base de Datos**
- ✅ **GREEN usa BD separada** (`sistema_mg_staging`)
- ✅ **BLUE usa BD de producción** (`sistema_mg`)
- ✅ **Conexiones locales** por defecto
- ✅ **Contraseñas en variables de entorno**

## 📞 **Soporte**

### **Comandos de Emergencia**
```bash
# Detener todo el sistema GREEN
./control-green.sh
# Seleccionar opción 2: Bajar sistema GREEN

# Ver estado completo
./control-green.sh
# Seleccionar opción 3: Ver estado

# Ver logs de errores
./control-green.sh
# Seleccionar opción 4: Ver logs
```

### **Información del Sistema**
```bash
# Versión del script
head -10 control-green.sh

# Configuración actual
cat staging.env
cat .env.staging

# Estado de la base de datos
psql -U postgres -c "\l" | grep sistema_mg
```

---

## 🎉 **¡Sistema Blue-Green Profesional Implementado!**

**El sistema está listo para uso en producción con:**
- ✅ **Deployment seguro** sin downtime
- ✅ **Testing integrado** antes de producción
- ✅ **Migraciones controladas** de base de datos
- ✅ **Monitoreo completo** del sistema
- ✅ **Recuperación rápida** en caso de problemas

**¡Disfruta de tu sistema Blue-Green profesional!** 🚀