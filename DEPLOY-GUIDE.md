# 🚀 Guía de Deploy - Sistema MundoGrafic

## 📋 Resumen de Cambios (2025-12-29)

### Base de Datos:
1. ✅ Tabla `detalle_cotizacion_imagenes` - múltiples imágenes por producto
2. ✅ Campo `alineacion_imagenes` en `detalle_cotizacion` (horizontal/vertical)
3. ✅ Eliminación de `numero_cotizacion` y secuencia
4. ✅ Formato `codigo_cotizacion` cambiado a 9 dígitos (000000001)
5. ✅ Campo `nombre_ejecutivo` editable en cotizaciones

### Código:
1. ✅ Sistema de múltiples imágenes con toggle de alineación
2. ✅ Servicio centralizado de vista previa PDF
3. ✅ Endpoints actualizados (cotizaciones, cotizacionesEditar)
4. ✅ Frontend con vista previa en tiempo real
5. ✅ Búsqueda de clientes con autocompletado

---

## 🔧 Requisitos Previos en el Servidor

```bash
# Verificar instalaciones
node --version    # >= 16.x
npm --version     # >= 8.x
pm2 --version     # >= 5.x
psql --version    # >= 12.x
git --version     # >= 2.x
```

---

## 📦 Paso 1: Preparar Repositorio Local

```bash
# En tu máquina local (Windows)

# 1. Verificar cambios pendientes
git status

# 2. Agregar todos los cambios de hoy
git add .

# 3. Commit con mensaje descriptivo
git commit -m "feat: sistema múltiples imágenes, formato codigo_cotizacion 9 dígitos, nombre_ejecutivo editable"

# 4. Push al repositorio
git push origin main
```

---

## 🚀 Paso 2: Deploy en Servidor Debian

### Opción A: Deploy Automático (Recomendado)

```bash
# Conectar al servidor
ssh usuario@tu-servidor-debian

# Ir al directorio del proyecto
cd /var/www/sistema-mg

# Dar permisos de ejecución al script
chmod +x deploy.sh

# Ejecutar deploy
./deploy.sh
```

**El script automáticamente:**
- 📦 Crea backup de BD
- 🛑 Detiene servicios
- 📥 Actualiza código desde Git
- 📦 Instala dependencias
- 🗄️ Ejecuta migraciones
- 🏗️ Compila frontend
- ▶️ Reinicia servicios
- ✅ Verifica estado

---

### Opción B: Deploy Manual (Paso a Paso)

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor-debian

# 2. Ir al directorio del proyecto
cd /var/www/sistema-mg

# 3. Backup de base de datos
pg_dump -U postgres sistema_mg > /var/backups/sistema-mg/backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Detener servicios
pm2 stop backend

# 5. Actualizar código
git pull origin main

# 6. Instalar dependencias backend
cd backend
npm install --production

# 7. Ejecutar migraciones
npx knex migrate:latest --env production

# 8. Compilar frontend
cd ..
npm install
npm run build

# 9. Reiniciar servicios
pm2 restart backend

# 10. Verificar estado
pm2 status
pm2 logs backend --lines 50
```

---

## 🔍 Paso 3: Verificación Post-Deploy

### Verificar Migraciones

```bash
cd /var/www/sistema-mg/backend

# Listar migraciones ejecutadas
npx knex migrate:list --env production

# Deberías ver:
# ✅ 20251229_001_create_detalle_cotizacion_imagenes.js
# ✅ 20251229_002_add_alineacion_imagenes.js
# ✅ 20251229_003_remove_numero_cotizacion.js
# ✅ 20251229_004_update_codigo_format.js
# ✅ 20251229_005_add_nombre_ejecutivo.js
```

### Verificar Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres sistema_mg

# Verificar tabla de imágenes
\d detalle_cotizacion_imagenes

# Verificar campo alineacion_imagenes
\d detalle_cotizacion

# Verificar eliminación de numero_cotizacion
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cotizaciones' AND column_name LIKE '%numero%';

# Verificar formato de codigo_cotizacion
SELECT id, codigo_cotizacion FROM cotizaciones LIMIT 5;
# Debe mostrar: 000000001, 000000002, etc.

# Verificar nombre_ejecutivo
\d cotizaciones
SELECT nombre_ejecutivo FROM cotizaciones WHERE nombre_ejecutivo IS NOT NULL LIMIT 3;

# Salir
\q
```

### Verificar Servicios

```bash
# Ver logs del backend
pm2 logs backend --lines 100

# Buscar errores
pm2 logs backend --err

# Verificar procesos
pm2 status

# Reiniciar si es necesario
pm2 restart backend
```

### Probar Frontend

```bash
# Acceder desde navegador
http://tu-dominio.com

# Verificar:
# ✅ Login funciona
# ✅ Crear/editar cotización
# ✅ Agregar múltiples imágenes
# ✅ Toggle horizontal/vertical
# ✅ Vista previa PDF en tiempo real
# ✅ Guardar cotización
# ✅ Listado muestra código formato 000000001
```

---

## 🔄 Rollback en Caso de Problemas

### Opción A: Script Automático

```bash
cd /var/www/sistema-mg
chmod +x rollback.sh
./rollback.sh
```

### Opción B: Manual

```bash
# 1. Detener servicios
pm2 stop backend

# 2. Restaurar último backup
cd /var/www/sistema-mg/backend
DB_BACKUP="/var/backups/sistema-mg/backup_YYYYMMDD_HHMMSS.sql"
psql -U postgres sistema_mg < $DB_BACKUP

# 3. Revertir última migración
npx knex migrate:rollback --env production

# 4. Volver a versión anterior del código
cd /var/www/sistema-mg
git log --oneline -5  # Ver commits
git checkout HASH_ANTERIOR  # Reemplazar HASH_ANTERIOR

# 5. Reinstalar dependencias
cd backend
npm install --production

# 6. Reiniciar
pm pm2 restart backend
```

---

## 📊 Monitoreo Post-Deploy

```bash
# Ver uso de recursos
pm2 monit

# Logs en tiempo real
pm2 logs backend

# Métricas
pm2 describe backend

# Verificar errores
tail -f /var/www/sistema-mg/backend/logs/error.log
```

---

## 🛠️ Solución de Problemas Comunes

### Error: "Cannot find module"
```bash
cd /var/www/sistema-mg/backend
rm -rf node_modules package-lock.json
npm install --production
pm2 restart backend
```

### Error: "Migration failed"
```bash
# Ver log detallado
npx knex migrate:latest --env production --verbose

# Si falla, restaurar backup y revisar migración
```

### Error: "Port already in use"
```bash
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.js
```

### Frontend no carga cambios
```bash
cd /var/www/sistema-mg
rm -rf dist node_modules
npm install
npm run build
# Actualizar nginx o servidor web
```

---

## 📝 Checklist Final

- [ ] Backup de BD creado
- [ ] Código actualizado desde Git
- [ ] Dependencias instaladas
- [ ] Migraciones ejecutadas (5 nuevas)
- [ ] Frontend compilado
- [ ] Servicios reiniciados
- [ ] Base de datos verificada
- [ ] Frontend probado
- [ ] Sin errores en logs
- [ ] Performance normal

---

## 📞 Contacto y Soporte

Si encuentras problemas:

1. Revisa logs: `pm2 logs backend --err`
2. Verifica BD: `psql -U postgres sistema_mg`
3. Rollback si es necesario
4. Documenta el error

---

## 🎉 ¡Deploy Exitoso!

El sistema ahora cuenta con:
- ✅ Múltiples imágenes por producto
- ✅ Control de alineación horizontal/vertical
- ✅ Código de cotización profesional (9 dígitos)
- ✅ Nombre de ejecutivo personalizable
- ✅ Vista previa en tiempo real
- ✅ Código más limpio y mantenible

**Fecha de deploy:** 2025-12-29
**Versión:** 2.0.0
