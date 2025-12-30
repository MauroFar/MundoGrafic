# ============================================================================
# GUÍA RÁPIDA: Llevar Migraciones de LOCAL a PRODUCCIÓN
# ============================================================================

## 🎯 PROCESO SIMPLE EN 7 PASOS

### PASO 1: LOCAL - Verificar que todo funciona
```powershell
cd backend
npm run migrate:status
```

### PASO 2: LOCAL - Hacer commit de las migraciones
```bash
git status
git add backend/src/db/migrations/
git commit -m "feat: migraciones [descripción]"
git push origin main
```

### PASO 3: SERVIDOR - Conectar por SSH
```bash
ssh tu-usuario@tu-servidor.com
```

### PASO 4: SERVIDOR - Ir al directorio del proyecto
```bash
cd /ruta/al/proyecto/backend
```

### PASO 5: SERVIDOR - Actualizar código
```bash
git pull origin main
```

### PASO 6: SERVIDOR - Ejecutar migraciones CON BACKUP
```bash
./migrate-production.sh
```

### PASO 7: VERIFICAR que todo funciona
- Accede a tu aplicación
- Verifica que los cambios se aplicaron correctamente
- Si todo está OK, puedes eliminar el backup:
```bash
rm ./backups/backup_pre_migration_FECHA.sql.gz
```

---

## 🚨 SI ALGO SALE MAL

### Restaurar el backup automático:
```bash
cd /ruta/al/proyecto/backend
ls -lh ./backups/
gunzip ./backups/backup_pre_migration_FECHA.sql.gz
PGPASSWORD=$DB_PASSWORD psql -h localhost -U postgres -d mundografic < ./backups/backup_pre_migration_FECHA.sql
```

---

## 📝 TUS MIGRACIONES ACTUALES (29/12/2025)

Las siguientes migraciones están listas para aplicar en producción:

1. **20251229_001_create_detalle_cotizacion_imagenes.js**
   - Crea tabla para múltiples imágenes por producto
   - ✅ Segura - No elimina datos

2. **20251229_002_add_alineacion_imagenes.js**
   - Agrega campo `alineacion_imagenes` a `detalle_cotizacion`
   - ✅ Segura - Solo agrega columna

3. **20251229_003_remove_numero_cotizacion.js**
   - Elimina columna `numero_cotizacion` y su secuencia
   - ⚠️  Verifica que no uses `numero_cotizacion` en producción
   - Migra datos a `codigo_cotizacion` antes de eliminar

4. **20251229_004_update_codigo_format.js**
   - Actualiza formato de códigos a 9 dígitos (000000001)
   - ✅ Segura - Solo actualiza formato

5. **20251229_005_add_nombre_ejecutivo.js**
   - Restaura campo `nombre_ejecutivo` en cotizaciones
   - ✅ Segura - Solo agrega columna

---

## ⚡ COMANDOS RÁPIDOS

### En tu PC (Windows):
```powershell
cd backend
.\migrate.ps1                  # Ejecutar migraciones en local
npm run migrate:status         # Ver estado
npm run migrate:make nombre    # Crear nueva migración
```

### En el servidor (Debian):
```bash
cd backend
./migrate-production.sh        # Ejecutar con backup automático
npm run migrate:status         # Ver estado
```

---

## 🔑 IMPORTANTE

✅ **SIEMPRE** el script `migrate-production.sh` crea backup automático
✅ Te pide **doble confirmación** antes de ejecutar
✅ Si algo falla, puedes restaurar el backup
✅ Los backups se guardan en `./backups/`

**¡No tengas miedo!** El sistema está diseñado para ser seguro.
