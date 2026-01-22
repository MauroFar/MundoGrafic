# Implementación de Tipos de Orden (Offset y Digital)

## 📋 Resumen de Cambios

Se ha implementado un sistema profesional para diferenciar entre órdenes de trabajo de impresión **Offset** y **Digital**, con formularios específicos para cada tipo y manejo completo en base de datos y backend.

## 🎯 Arquitectura Implementada

### 1. Base de Datos
- ✅ Campo `tipo_orden` agregado SOLO a la tabla `orden_trabajo`
- ✅ Valores permitidos: 'offset' | 'digital'
- ✅ Índice creado para optimizar consultas
- ✅ Migración SQL completa con verificación
- ✅ **Cotizaciones NO tienen tipo** (se define al crear la orden)

### 2. Backend (API)
- ✅ Endpoint de creación actualizado para recibir `tipo_orden`
- ✅ Endpoint de edición actualizado para manejar `tipo_orden`
- ✅ Endpoint de listado incluye `tipo_orden` en respuesta
- ✅ Validación y manejo diferenciado según tipo

### 3. Frontend (React/TypeScript)
- ✅ Componente `FormularioOrdenOffset.tsx` (impresión tradicional)
- ✅ Componente `FormularioOrdenDigital.tsx` (impresión digital)
- ✅ Modal de selección de tipo al crear orden (manual o desde cotización)
- ✅ Renderizado condicional según tipo seleccionado
- ✅ Estados específicos para cada tipo de formulario

## 🎨 Filosofía de Diseño

**¿Por qué NO agregar tipo a las cotizaciones?**

1. **Flexibilidad de Negocio**: Un cliente puede cotizar algo y luego decidir el método de impresión
2. **Separación de Responsabilidades**: 
   - Cotización = Propuesta comercial (¿qué y cuánto?)
   - Orden = Instrucción de producción (¿cómo?)
3. **Simplicidad**: No hay que modificar el módulo de cotizaciones
4. **Decisión en el Momento Correcto**: El tipo se define cuando realmente se va a producir

## 🚀 Pasos para Implementar

### Paso 1: Ejecutar Migración SQL

Antes de usar el sistema, debes ejecutar la migración para agregar el campo `tipo_orden` a la base de datos.

**Opción A: Desde PowerShell (Windows)**
```powershell
cd backend
node run-migration-tipo-orden.js
```

**Opción B: Directamente en la base de datos**
Ejecuta el archivo SQL manualmente:
```sql
-- Ubicación: backend/migrations/add-tipo-orden-field.sql
```

### Paso 2: Reiniciar el Backend

Después de ejecutar la migración, reinicia el servidor backend para que tome los cambios:

```powershell
cd backend
npm run dev
```

### Paso 3: Limpiar caché del Frontend (si es necesario)

```powershell
cd ../
npm run dev
```

## 📝 Uso del Sistema

### Flujo Completo

```
1. COTIZACIÓN
   - Se crea cotización (sin tipo específico)
   - Se aprueba cotización
   
2. GENERAR ORDEN DE TRABAJO
   - Click en "Generar Orden"
   - Aparece modal: "¿Offset o Digital?"
   - Usuario selecciona según necesidad de producción
   
3. FORMULARIO ESPECÍFICO
   - Se muestra formulario según tipo seleccionado
   - Se completan datos técnicos
   - Se crea orden con tipo_orden definido
```

### Crear Nueva Orden Manualmente

1. Navega a "Crear Orden de Trabajo"
2. Aparecerá un modal preguntando el tipo de orden:
   - **Prensa (Offset)**: Para impresión offset tradicional
   - **Digital**: Para impresión digital

### Crear Orden desde Cotización

1. Aprueba la cotización
2. Click en "Generar Orden de Trabajo"
3. Se cargan los datos del cliente automáticamente
4. Aparece modal: **"¿Offset o Digital?"**
5. Selecciona el tipo según el proceso de producción que se usará
6. Se muestra el formulario correspondiente

**Ventaja de este flujo:** 
- ✅ Flexibilidad: La misma cotización puede generar órdenes offset o digital
- ✅ Decisión en el momento correcto (al producir, no al cotizar)
- ✅ Simple y claro para el usuario

### Según la selección, se mostrará el formulario correspondiente:

#### Formulario Offset
- Información del Trabajo (cantidad, concepto, tamaños)
- Material y Corte
- Cantidad de Pliegos
- Impresión y Acabados
- Prensa y Observaciones

#### Formulario Digital
- Tabla de Productos (múltiples líneas)
  - Cantidad, Códigos (MG y Cliente)
  - Producto, Avance, Medidas
  - Cavidad, Metros Impresos
- Información Técnica
  - Adherencia, Material
  - Lotes (Material y Producción)
  - Tipo de Impresión, Troquel
  - Terminados y Observaciones

### Editar Orden Existente

Al editar una orden, el sistema automáticamente muestra el formulario correcto según el `tipo_orden` guardado en la base de datos.

## 🔧 Estructura de Archivos Nuevos/Modificados

### Backend
```
backend/
├── migrations/
│   └── add-tipo-orden-field.sql          [NUEVO]
├── run-migration-tipo-orden.js            [NUEVO]
└── src/routes/
    └── ordenTrabajo.ts                    [MODIFICADO]
```

### Frontend
```
src/
├── components/
│   ├── FormularioOrdenOffset.tsx          [NUEVO]
│   └── FormularioOrdenDigital.tsx         [NUEVO]
└── pages/ordendeTrabajo/
    └── OrdendeTrabajo.tsx                 [MODIFICADO]
```

## 📊 Campos Específicos

### Offset (Tradicional)
- Material y especificaciones de corte
- Cálculo de pliegos (compra + exceso)
- Prensa seleccionada
- Instrucciones de impresión, acabados y empacado

### Digital
- Tabla de productos con múltiples líneas
- Adherencia del material
- Lote de material y producción
- Tipo de troquel y código
- Terminados especiales
- Cantidad por rollo

## 🎨 Ventajas de esta Implementación

✅ **Profesional**: Separación clara de responsabilidades
✅ **Escalable**: Fácil agregar más tipos en el futuro
✅ **Mantenible**: Componentes reutilizables
✅ **Trazable**: Filtros y reportes por tipo de orden
✅ **Validado**: Control completo en BD y backend
✅ **UX Optimizada**: Formularios específicos para cada flujo

## 🔍 Verificación

Para verificar que todo funciona correctamente:

1. **Verifica la migración**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orden_trabajo' 
   AND column_name = 'tipo_orden';
   ```

2. **Crea una orden Offset**: Verifica que se guarde con `tipo_orden = 'offset'`

3. **Crea una orden Digital**: Verifica que se guarde con `tipo_orden = 'digital'`

4. **Lista las órdenes**: Verifica que aparezca el campo `tipo_orden`

## 🐛 Solución de Problemas

### Error: "tipo_orden" column does not exist
- Ejecuta la migración SQL nuevamente
- Verifica la conexión a la base de datos

### No aparece el modal de selección
- Limpia el caché del navegador
- Verifica que `tipoOrdenSeleccionado` sea null al crear

### Los datos no se guardan correctamente
- Revisa los logs del backend
- Verifica que el campo `tipo_orden` esté en la solicitud

## 📞 Soporte

Si encuentras algún problema, revisa:
1. Logs del backend en la consola
2. Errores en la consola del navegador (F12)
3. Estado de la migración en la base de datos

---

**Implementado el**: 20 de Enero de 2026
**Versión**: 1.0.0
