# ============================================================================
# GUÍA COMPLETA: SISTEMA DE MIGRACIONES - MUNDOGRAFIC
# ============================================================================

## 📚 ÍNDICE
1. ¿Qué son las migraciones?
2. Flujo de trabajo recomendado
3. Cómo crear una nueva migración
4. Cómo ejecutar migraciones
5. Llevar cambios de LOCAL a PRODUCCIÓN
6. Comandos útiles
7. Resolución de problemas
8. Buenas prácticas

---

## 1. ¿QUÉ SON LAS MIGRACIONES?

Las migraciones son **archivos de control de versiones para tu base de datos**.
Cada migración registra un cambio en la estructura de la BD (agregar tablas,
columnas, índices, etc.).

### Ventajas:
✅ Control de versiones de la base de datos
✅ Historial de cambios documentado
✅ Sincronización entre desarrollo y producción
✅ Rollback automático si algo falla
✅ Trabajo en equipo sin conflictos

---

## 2. FLUJO DE TRABAJO RECOMENDADO

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  DESARROLLO │  →   │   PRUEBAS    │  →   │ PRODUCCIÓN  │
│   (Local)   │      │  (Staging)   │      │  (Servidor) │
└─────────────┘      └──────────────┘      └─────────────┘
      ↓                      ↓                     ↓
  Crear y probar         Verificar           Ejecutar con
  migraciones            cambios             backup
```

### Proceso paso a paso:

1. **LOCAL**: Desarrollas y creas migraciones
2. **LOCAL**: Pruebas que funcionen correctamente
3. **GIT**: Commit y push de las migraciones
4. **SERVIDOR**: Pull del código
5. **SERVIDOR**: Ejecutar migraciones con backup automático

---

## 3. CÓMO CREAR UNA NUEVA MIGRACIÓN

### Opción A: Crear migración vacía

```bash
# En el directorio backend/
npm run migrate:make nombre_descriptivo
```

Ejemplo:
```bash
npm run migrate:make add_telefono_to_clientes
```

Esto crea un archivo:
```
backend/src/db/migrations/20251230_XXXXXX_add_telefono_to_clientes.js
```

### Opción B: Plantilla de migración

Edita el archivo creado con esta estructura:

```javascript
/**
 * Migración: [Descripción clara del cambio]
 * Fecha: YYYY-MM-DD
 * Descripción: [Explicación detallada]
 */

exports.up = async function(knex) {
  // ⬆️ APLICAR CAMBIOS (crear/modificar/agregar)
  
  return knex.schema.table('nombre_tabla', table => {
    table.string('nueva_columna', 100).nullable();
    table.index('nueva_columna');
  });
};

exports.down = async function(knex) {
  // ⬇️ REVERTIR CAMBIOS (deshacer lo que hizo "up")
  
  return knex.schema.table('nombre_tabla', table => {
    table.dropColumn('nueva_columna');
  });
};
```

### Ejemplos de operaciones comunes:

#### Agregar columna:
```javascript
exports.up = function(knex) {
  return knex.schema.table('clientes', table => {
    table.string('telefono', 20).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('clientes', table => {
    table.dropColumn('telefono');
  });
};
```

#### Crear tabla nueva:
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('productos', table => {
    table.increments('id').primary();
    table.string('nombre', 200).notNullable();
    table.decimal('precio', 10, 2).defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('productos');
};
```

#### Modificar datos (con seguridad):
```javascript
exports.up = async function(knex) {
  // 1. Agregar nueva columna
  await knex.schema.table('cotizaciones', table => {
    table.string('codigo_nuevo', 20);
  });
  
  // 2. Migrar datos existentes
  await knex.raw(`
    UPDATE cotizaciones 
    SET codigo_nuevo = LPAD(id::TEXT, 9, '0')
  `);
  
  // 3. Hacer columna NOT NULL
  await knex.schema.alterTable('cotizaciones', table => {
    table.string('codigo_nuevo', 20).notNullable().alter();
  });
};
```

---

## 4. CÓMO EJECUTAR MIGRACIONES

### En DESARROLLO (Windows con PowerShell):

```powershell
# Navegar al directorio backend
cd backend

# Ejecutar migraciones
.\migrate.ps1

# O usando npm
npm run migrate
```

### Ver estado de migraciones:

```powershell
npm run migrate:status
```

Salida esperada:
```
Completed:
  20251229_001_create_detalle_cotizacion_imagenes.js
  20251229_002_add_alineacion_imagenes.js
  
Pending:
  (Ninguna)
```

---

## 5. LLEVAR CAMBIOS DE LOCAL A PRODUCCIÓN

### 🎯 PROCESO COMPLETO PASO A PASO

#### PASO 1: Desarrollo Local (Tu PC)

1. Crear las migraciones:
```powershell
cd backend
npm run migrate:make mi_nueva_funcionalidad
```

2. Editar el archivo de migración creado

3. Probar localmente:
```powershell
.\migrate.ps1
```

4. Verificar que funciona correctamente

5. Commit y push:
```bash
git add backend/src/db/migrations/
git commit -m "feat: agregar migración para [descripción]"
git push origin main
```

#### PASO 2: Servidor de Producción (Debian)

1. Conectarse al servidor:
```bash
ssh usuario@tu-servidor.com
```

2. Navegar al directorio del proyecto:
```bash
cd /ruta/al/proyecto/backend
```

3. Actualizar código:
```bash
git pull origin main
```

4. Ejecutar migraciones CON BACKUP AUTOMÁTICO:
```bash
# Este script hace backup automáticamente antes de migrar
./migrate-production.sh
```

El script te pedirá confirmación:
```
⚠️  ADVERTENCIA: Estás a punto de ejecutar migraciones en PRODUCCIÓN
   Solo debe ejecutarse en el servidor de producción

¿Estás en el servidor de PRODUCCIÓN? (SI/no): SI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INFORMACIÓN DE LA BASE DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🗄️  Base:     mundografic
  📡 Host:     localhost
  👤 Usuario:  postgres
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Migraciones que se ejecutarán:
  - 20251229_001_create_detalle_cotizacion_imagenes.js
  - 20251229_002_add_alineacion_imagenes.js
  - 20251229_003_remove_numero_cotizacion.js
  - 20251229_004_update_codigo_format.js
  - 20251229_005_add_nombre_ejecutivo.js

¿Proceder con las migraciones? (escribe 'EJECUTAR' para confirmar): EJECUTAR

💾 Creando backup de seguridad...
✅ Backup creado exitosamente
   Tamaño: 2.5 MB
   Ubicación: ./backups/backup_pre_migration_20251230_143022.sql.gz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EJECUTANDO MIGRACIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tabla detalle_cotizacion_imagenes creada exitosamente
✅ Campo alineacion_imagenes agregado a detalle_cotizacion
✅ Campo numero_cotizacion eliminado
✅ Códigos actualizados. Ejemplos:
   ID 1 → 000000001
✅ Campo nombre_ejecutivo agregado a cotizaciones

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ MIGRACIONES COMPLETADAS EXITOSAMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Backup guardado en: ./backups/backup_pre_migration_20251230_143022.sql.gz
```

5. Verificar que el sistema funciona correctamente

6. (Opcional) Eliminar el backup si todo está OK:
```bash
rm ./backups/backup_pre_migration_20251230_143022.sql.gz
```

---

## 6. COMANDOS ÚTILES

### Comandos de npm (desde /backend):

```bash
# Ejecutar migraciones pendientes
npm run migrate

# Ver estado de migraciones
npm run migrate:status

# Crear nueva migración
npm run migrate:make nombre_de_la_migracion

# Rollback (deshacer última migración)
npm run migrate:rollback

# Ver lista de migraciones
npm run migrate:list
```

### Scripts PowerShell (Windows):

```powershell
# Ejecutar en desarrollo
.\migrate.ps1

# Ejecutar en producción (no usar en local)
.\migrate.ps1 -Environment production
```

### Scripts Bash (Debian/Linux):

```bash
# Desarrollo
./migrate.sh

# Producción CON BACKUP AUTOMÁTICO
./migrate-production.sh
```

---

## 7. RESOLUCIÓN DE PROBLEMAS

### ❌ Error: "relation already exists"

**Problema**: Intentas crear una tabla/columna que ya existe

**Solución**:
```javascript
// Verificar antes de crear
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('nombre_tabla');
  if (!hasTable) {
    await knex.schema.createTable('nombre_tabla', ...);
  }
};
```

### ❌ Error: "column does not exist"

**Problema**: Intentas modificar una columna que no existe

**Solución**:
```javascript
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('tabla', 'columna');
  if (hasColumn) {
    // Realizar operación
  }
};
```

### ❌ Migración falló en producción

**Solución**: Restaurar backup

1. Ver los backups disponibles:
```bash
ls -lh ./backups/
```

2. Restaurar el backup:
```bash
gunzip ./backups/backup_pre_migration_FECHA.sql.gz
PGPASSWORD=$DB_PASSWORD psql -h localhost -U postgres -d mundografic < ./backups/backup_pre_migration_FECHA.sql
```

3. Corregir la migración problemática

4. Volver a intentar

### ❌ Migraciones desincronizadas

**Problema**: Local y producción tienen diferentes migraciones aplicadas

**Solución**:
```bash
# Ver estado en ambos entornos
npm run migrate:status

# Identificar diferencias y aplicar las faltantes
```

---

## 8. BUENAS PRÁCTICAS

### ✅ SIEMPRE:

1. **Probar migraciones localmente primero**
   - Nunca ejecutar migraciones directamente en producción sin probar

2. **Usar nombres descriptivos**
   - ✅ `20251230_add_telefono_to_clientes.js`
   - ❌ `migration1.js`

3. **Documentar las migraciones**
   ```javascript
   /**
    * Migración: Agregar campo teléfono a clientes
    * Fecha: 2025-12-30
    * Descripción: Permite almacenar el teléfono de contacto principal
    * Autor: Tu Nombre
    */
   ```

4. **Incluir rollback (down)**
   - Siempre implementar la función `down()` para poder revertir

5. **Usar transacciones para operaciones complejas**
   ```javascript
   exports.up = async function(knex) {
     return knex.transaction(async (trx) => {
       await trx.schema.alterTable(...);
       await trx('tabla').update(...);
     });
   };
   ```

6. **El backup es automático en producción**
   - El script `migrate-production.sh` crea backup automáticamente

### ❌ NUNCA:

1. ❌ Modificar migraciones ya ejecutadas en producción
2. ❌ Eliminar archivos de migración del historial
3. ❌ Ejecutar migraciones manualmente con SQL en producción
4. ❌ Saltarse migraciones
5. ❌ Usar `DROP TABLE` sin migrar datos primero

### ⚠️ OPERACIONES PELIGROSAS:

Si necesitas **eliminar columnas o tablas con datos**:

```javascript
exports.up = async function(knex) {
  // 1. Primero MIGRA los datos importantes
  await knex.raw(`
    INSERT INTO tabla_nueva (campo_importante)
    SELECT campo_viejo FROM tabla_vieja
  `);
  
  // 2. Espera unos días y verifica que todo funciona
  
  // 3. Recién entonces elimina (en otra migración)
  await knex.schema.dropTable('tabla_vieja');
};
```

---

## 9. ESTRUCTURA DE ARCHIVOS

```
backend/
├── src/
│   └── db/
│       ├── knex.ts                 # Instancia de Knex
│       └── migrations/             # 📁 Todas las migraciones
│           ├── 20251229_001_create_detalle_cotizacion_imagenes.js
│           ├── 20251229_002_add_alineacion_imagenes.js
│           └── ...
├── knexfile.js                     # Configuración de Knex
├── migrate.sh                      # Script bash para desarrollo
├── migrate.ps1                     # Script PowerShell para Windows
├── migrate-production.sh           # Script para producción con backup
├── backups/                        # 📁 Backups automáticos
│   └── backup_pre_migration_*.sql.gz
└── .env                            # Variables de entorno
```

---

## 10. RESUMEN RÁPIDO

### Tu flujo de trabajo ideal:

```bash
# 1. LOCAL: Crear migración
cd backend
npm run migrate:make mi_cambio

# 2. LOCAL: Editar la migración
# Editar: backend/src/db/migrations/202512XX_mi_cambio.js

# 3. LOCAL: Probar
.\migrate.ps1

# 4. LOCAL: Verificar que funciona
npm run migrate:status

# 5. LOCAL: Commit
git add backend/src/db/migrations/
git commit -m "feat: agregar [descripción]"
git push

# 6. SERVIDOR: Conectar y actualizar
ssh usuario@servidor
cd /ruta/proyecto/backend
git pull

# 7. SERVIDOR: Migrar CON BACKUP
./migrate-production.sh
```

**¡Eso es todo!** El sistema creará backups automáticamente y te pedirá confirmación antes de tocar producción.

---

## 📞 SOPORTE

Si algo sale mal:
1. No entres en pánico
2. El backup se creó automáticamente
3. Revisa los mensajes de error
4. Restaura el backup si es necesario
5. Corrige el problema y vuelve a intentar

**Recuerda**: Siempre tienes un backup automático antes de cada migración en producción.
