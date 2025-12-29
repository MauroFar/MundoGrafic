# ✅ Checklist Pre-Deploy

## En Local (Windows)

```bash
# 1. Verificar que todo funcione localmente
npm run dev          # Frontend
cd backend && npm run dev  # Backend

# 2. Verificar que no haya errores
# - Crear cotización ✓
# - Agregar múltiples imágenes ✓
# - Vista previa PDF ✓
# - Guardar y editar ✓

# 3. Commit y push
git add .
git commit -m "feat: múltiples imágenes + código 9 dígitos + ejecutivo editable"
git push origin main
```

---

## En Servidor Debian (Opción Rápida)

```bash
# Conectar
ssh usuario@servidor

# Ir al proyecto
cd /var/www/sistema-mg

# Ejecutar deploy automático
chmod +x deploy.sh
./deploy.sh

# Listo! 🎉
```

---

## Verificación Rápida (2 minutos)

```bash
# 1. Ver logs
pm2 logs backend --lines 50

# 2. Verificar migraciones
cd backend
npx knex migrate:list --env production
# Debe mostrar 5 migraciones nuevas con ✅

# 3. Probar en navegador
# http://tu-dominio.com
# - Login
# - Crear cotización
# - Agregar 2-3 imágenes
# - Toggle horizontal/vertical
# - Vista previa PDF
# - Guardar
```

---

## Si Algo Falla

```bash
# Rollback rápido
./rollback.sh

# O manual
pm2 stop backend
psql -U postgres sistema_mg < /var/backups/sistema-mg/backup_*.sql
pm2 restart backend
```

---

## Tiempos Estimados

- ⏱️ Deploy automático: 3-5 minutos
- ⏱️ Verificación: 2 minutos
- ⏱️ Total: ~7 minutos

---

## Archivos Creados Hoy

### Migraciones (backend/src/db/migrations/):
- [x] 20251229_001_create_detalle_cotizacion_imagenes.js
- [x] 20251229_002_add_alineacion_imagenes.js
- [x] 20251229_003_remove_numero_cotizacion.js
- [x] 20251229_004_update_codigo_format.js
- [x] 20251229_005_add_nombre_ejecutivo.js

### Scripts:
- [x] deploy.sh
- [x] rollback.sh
- [x] DEPLOY-GUIDE.md

### Código:
- [x] Frontend: CotizacionesCrear.jsx (múltiples imágenes)
- [x] Frontend: CotizacionesVer.jsx (vista mejorada)
- [x] Frontend: cotizacionPreviewService.js (servicio centralizado)
- [x] Backend: cotizaciones.ts (actualizado)
- [x] Backend: cotizacionesEditar.ts (actualizado)
- [x] Backend: cotizacionesDetalles.ts (manejo de arrays)

---

## 🚀 Comando Único

```bash
ssh usuario@servidor "cd /var/www/sistema-mg && git pull && chmod +x deploy.sh && ./deploy.sh"
```

**¡Un solo comando y listo!** ✨
