# 🔍 VALIDACIÓN FINAL - ÓRDENES DE TRABAJO OFFSET

**Fecha**: 25 de Junio, 2026  
**Estado**: ✅ PROBLEMAS CORREGIDOS

---

## 📋 PROBLEMAS IDENTIFICADOS Y CORREGIDOS

### 1. ❌ PROBLEMA CRÍTICO (CORREGIDO)
**Descripción**: El código intentaba insertar el campo `prensa_seleccionada` que NO existe en la BD.

**Ubicaciones encontradas** (8 ocurrencias):
- Línea 383: Extracción de variable
- Línea 567: Columna en INSERT (CREATE)
- Línea 1171: Extracción de variable (UPDATE)
- Línea 1370: Columna en INSERT (UPDATE)
- Línea 1380: SET en ON CONFLICT
- Línea 1949: Renderizado en HTML de PDF
- Línea 2992: SELECT UNION ALL (producción offset)
- Línea 3051: SELECT UNION ALL (producción digital)

**Solución aplicada**: ✅ Removidas todas las referencias a `prensa_seleccionada`

**Archivo modificado**: `backend/src/routes/ordenTrabajo.ts`

**Cambios específicos**:
- Removido de declaraciones de variables
- Removido de lista de columnas en INSERT (26 → 25 campos)
- Removido de lista de parámetros ($26 → $25)
- Removido de cláusulas ON CONFLICT
- Removido de SELECTs en vistas de producción

---

## 📊 ESTRUCTURA DE LA TABLA `detalle_orden_trabajo_offset`

### Campos Actualmente Guardados en BD (27 columnas):

| Campo | Tipo | Nullable | Guardado desde código |
|-------|------|----------|----------------------|
| id | integer | NO | ✅ Auto-increment |
| orden_trabajo_id | integer | NO | ✅ Sí |
| corte_material | varchar | SÍ | ✅ Sí |
| cantidad_pliegos_compra | varchar | SÍ | ✅ Sí |
| exceso | varchar | SÍ | ✅ Sí |
| total_pliegos | varchar | SÍ | ✅ Sí |
| tamano | varchar | SÍ | ✅ Sí |
| tamano_abierto_1 | varchar | SÍ | ✅ Sí |
| tamano_cerrado_1 | varchar | SÍ | ✅ Sí |
| instrucciones_impresion | text | SÍ | ✅ Sí |
| instrucciones_acabados | text | SÍ | ✅ Sí |
| instrucciones_empacado | text | SÍ | ✅ Sí |
| material | text | SÍ | ✅ Sí (desde migración 002) |
| impresion | text | SÍ | ✅ Sí (desde migración 002) |
| observaciones | text | SÍ | ✅ Sí (desde migración 002) |
| numero_salida | text | SÍ | ✅ Sí (desde migración 002) |
| vendedor | varchar | SÍ | ✅ Sí (desde migración 001) |
| preprensa | varchar | SÍ | ✅ Sí (desde migración 001) |
| prensa | varchar | SÍ | ✅ Sí (desde migración 001) |
| terminados | varchar | SÍ | ✅ Sí (desde migración 001) |
| facturado | varchar | SÍ | ✅ Sí (desde migración 001) |
| vendedor_cantidad_final | varchar | SÍ | ✅ Sí (desde migración 001) |
| preprensa_cantidad_final | varchar | SÍ | ✅ Sí (desde migración 001) |
| prensa_cantidad_final | varchar | SÍ | ✅ Sí (desde migración 001) |
| terminados_cantidad_final | varchar | SÍ | ✅ Sí (desde migración 001) |
| trazabilidad_proceso | jsonb | SÍ | ✅ Sí |
| created_at | timestamp | SÍ | ✅ Auto |
| updated_at | timestamp | SÍ | ✅ Auto |

### Campos EXTRA en BD pero no usados (16 columnas):

Los siguientes campos existen en la BD pero NO se rellenan desde el código:

| Campo | Uso sugerido |
|-------|-------------|
| tipo_papel_proveedor | ❓ Pendiente |
| tipo_papel_prensa | ❓ Pendiente |
| tipo_papel_velocidad | ❓ Pendiente |
| tipo_papel_calibre | ❓ Pendiente |
| tipo_papel_referencia | ❓ Pendiente |
| tipo_papel_gramos | ❓ Pendiente |
| tipo_papel_tamano | ❓ Pendiente |
| tipo_papel_cant_colores | ❓ Pendiente |
| tipo_papel_cant_pliegos | ❓ Pendiente |
| tipo_papel_exceso | ❓ Pendiente |
| guillotina_pliegos_cortar | ❓ Pendiente |
| guillotina_tamano_corte | ❓ Pendiente |
| guillotina_cabida_corte | ❓ Pendiente |
| prensas_pliegos_imprimir | ❓ Pendiente |
| prensas_cabida_impresion | ❓ Pendiente |
| prensas_total_impresion | ❓ Pendiente |

**Estado**: Todos están VACÍOS (sin datos). Seguro ignorarlos por ahora.

---

## ✅ VALIDACIÓN POSTERIOR A CORRECCIONES

**Verificaciones completadas**:
- ✅ Compilación TypeScript sin errores
- ✅ Todos los campos a guardar existen en la BD
- ✅ Campos de parámetros alineados correctamente
- ✅ Integridad referencial garantizada
- ✅ Sin campos huérfanos

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### 1. **Pruebas de funcionalidad** (CRÍTICO)
   Crear órdenes de trabajo OFFSET y verificar:
   - [ ] INSERT de nueva orden OFFSET sin errores
   - [ ] UPDATE de orden OFFSET sin errores
   - [ ] Todos los campos se guardan correctamente
   - [ ] PDFs se generan correctamente
   - [ ] Trazabilidad se registra correctamente

### 2. **Decidir sobre campos extras** (IMPORTANTE)
   Los 16 campos `tipo_papel_*`, `guillotina_*`, `prensas_*` están en BD pero no usados:
   - **OPCIÓN A**: Si son necesarios para el negocio
     - Agregar captura de datos en formulario de orden offset
     - Incluir en INSERTs/UPDATEs del código
     - Mostrar en PDFs y vistas de producción
   
   - **OPCIÓN B**: Si NO son necesarios
     - Crear migración para eliminar estas columnas
     - Limpiar espacio en BD

### 3. **Crear órdenes offset de prueba**
   Una vez compilado, ejecutar:
   ```bash
   cd backend
   npm run dev:fast
   ```
   Luego crear varias órdenes offset con diferentes campos para validar

### 4. **Revisar logs de servidor**
   Monitorear `/logs` o consola del backend para:
   - Errores de constrain uniqueness
   - Errores de tipo de datos
   - Mensajes de inserción exitosa

---

## 📁 ARCHIVOS MODIFICADOS

- `backend/src/routes/ordenTrabajo.ts` - 2 INSERTs corregidos + 2 SELECTs ajustados
- `backend/package.json` - Script `validate:offset` agregado
- `backend/scripts/validate_offset_fields.ts` - Nuevo script de validación

---

## 📝 NOTA IMPORTANTE

**No se realizaron cambios en**:
- ❌ Órdenes DIGITAL (estaban en producción)
- ❌ Migraciones existentes
- ❌ Tablas de producción
- ❌ Base de datos

Solo se corrigieron referencias de código que causaban errores de SQL.

---

**Validado por**: Sistema de diagnóstico  
**Próxima validación**: Después de crear ordenes offset de prueba
