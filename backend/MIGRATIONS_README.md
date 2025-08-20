# Sistema de Migraciones con Knex.js

Este proyecto utiliza Knex.js para manejar las migraciones de la base de datos de manera profesional.

## 📋 Comandos Principales

### **Ejecutar Migraciones**
```bash
# Ejecutar todas las migraciones pendientes
npm run migrate

# O directamente con knex
npx knex migrate:latest
```

### **Revertir Migraciones**
```bash
# Revertir la última migración
npm run migrate:rollback

# Revertir todas las migraciones
npx knex migrate:rollback --all
```

### **Ver Estado de Migraciones**
```bash
# Ver qué migraciones están ejecutadas
npm run migrate:status
```

### **Crear Nueva Migración**
```bash
# Crear una nueva migración
npm run migrate:make nombre_de_la_migracion

# Ejemplo
npm run migrate:make add_campo_nuevo
```

### **Ejecutar Seeds (Datos de Prueba)**
```bash
# Ejecutar todos los seeds
npm run seed

# Crear un nuevo seed
npm run seed:make nombre_del_seed
```

## 🗂️ Estructura de Archivos

```
backend/
├── knexfile.js                    # Configuración de Knex
├── src/db/
│   ├── migrations/               # Archivos de migración
│   │   ├── 20241201_000001_create_orden_trabajo.js
│   │   ├── 20241201_000002_create_detalle_orden_trabajo.js
│   │   └── 20241201_000003_create_functions_and_triggers.js
│   ├── seeds/                    # Datos de prueba
│   │   └── 01_orden_trabajo_seed.js
│   └── knex.ts                   # Instancia de Knex para TypeScript
```

## 🔧 Configuración

### **Entornos Soportados**
- **development**: Para desarrollo local
- **production**: Para el servidor de producción
- **test**: Para pruebas (opcional)

### **Variables de Entorno**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=mundografic
NODE_ENV=development
```

## 📝 Crear una Nueva Migración

1. **Crear la migración:**
   ```bash
   npm run migrate:make agregar_campo_nuevo
   ```

2. **Editar el archivo generado:**
   ```javascript
   exports.up = function(knex) {
     return knex.schema.alterTable('orden_trabajo', function(table) {
       table.string('campo_nuevo', 100);
     });
   };

   exports.down = function(knex) {
     return knex.schema.alterTable('orden_trabajo', function(table) {
       table.dropColumn('campo_nuevo');
     });
   };
   ```

3. **Ejecutar la migración:**
   ```bash
   npm run migrate
   ```

## 🚀 Despliegue en Producción

### **Proceso Automatizado**
1. Subir código al servidor
2. Ejecutar migraciones: `npm run migrate`
3. Reiniciar aplicación
4. Verificar funcionamiento

### **Script de Despliegue Recomendado**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando despliegue..."

# Actualizar código
git pull origin main

# Instalar dependencias
npm install

# Ejecutar migraciones
echo "📋 Ejecutando migraciones..."
npm run migrate

# Compilar TypeScript
npm run build

# Reiniciar aplicación
pm2 restart mundografic-backend

echo "✅ Despliegue completado"
```

## ⚠️ Consideraciones Importantes

### **Antes de Ejecutar Migraciones**
- ✅ Hacer backup de la base de datos
- ✅ Probar en entorno de desarrollo
- ✅ Verificar que no hay datos críticos que se puedan perder

### **En Caso de Error**
- 🔄 Usar `npm run migrate:rollback` para revertir
- 📋 Revisar logs de error
- 🔧 Corregir la migración y volver a ejecutar

## 🔍 Verificar Migraciones

### **Ver Estado Actual**
```bash
npm run migrate:status
```

### **Ver Migraciones Pendientes**
```bash
npx knex migrate:list
```

## 📊 Tabla de Control

Knex.js crea automáticamente una tabla `knex_migrations` que registra:
- Nombre del archivo de migración
- Fecha de ejecución
- Checksum del archivo

Esta tabla evita que se ejecute la misma migración dos veces.

## 🆘 Solución de Problemas

### **Error: "Migration table not found"**
```bash
# Crear tabla de migraciones manualmente
npx knex migrate:init
```

### **Error: "Connection refused"**
- Verificar variables de entorno
- Comprobar que PostgreSQL esté corriendo
- Verificar credenciales de BD

### **Error: "Table already exists"**
- Usar `table.dropTableIfExists()` en lugar de `table.dropTable()`
- O verificar si la tabla ya existe antes de crearla
