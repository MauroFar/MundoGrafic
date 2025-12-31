# 🎯 Guía de Uso: Botón "Calcular con Procesos"

## ✅ Implementación Completada

Se ha integrado el **modal de cálculo de procesos** directamente en la página de crear/editar cotizaciones.

---

## 📍 ¿Dónde está el botón?

### Ubicación:
En la página de **Crear Cotización** o **Editar Cotización**:

```
http://localhost:5173/cotizaciones/crear
```

### En la tabla de productos/ítems:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Procesos │ Cantidad │ Detalle │ Valor Unit. │ Total │ Acciones    │
├──────────┼──────────┼─────────┼─────────────┼───────┼─────────────┤
│  [🧮]    │   1000   │ ...     │   $5.50     │ $5500 │    [🗑️]    │
│ Calcular │          │         │             │       │             │
└──────────┴──────────┴─────────┴─────────────┴───────┴─────────────┘
```

El botón **morado** con el ícono de calculadora aparece en la **primera columna** de cada fila.

---

## 🎮 Cómo Usar:

### Paso 1: Crear o Editar una Cotización
1. Ve a: `Cotizaciones → Crear Cotización`
2. Completa los datos del cliente
3. Agrega una fila con el botón "+ Agregar Fila"

### Paso 2: Calcular con Procesos
1. Haz clic en el botón **"Calcular"** (morado) en la fila
2. Se abre el modal de procesos

### Paso 3: Configurar el Ítem
En el modal:
1. **Selecciona el tipo de trabajo**: Carpetas, Folletos, etc.
2. **Ingresa la cantidad**: 1000, 500, etc.
3. **Agrega descripción** (opcional)
4. **Especifica tamaños**: Cerrado y Abierto

### Paso 4: Seleccionar Procesos
1. **Marca los procesos** que necesitas (checkboxes)
2. Al marcar un proceso, aparecen campos para:
   - Cantidad
   - Precio unitario
3. **El sistema calcula automáticamente**:
   - Subtotal de cada proceso
   - Costo total
   - Precio unitario
   - Total del ítem

### Paso 5: Guardar
1. Revisa los cálculos en la sección inferior
2. Haz clic en **"Guardar Ítem"**
3. Los valores se **insertan automáticamente** en la fila:
   - **Cantidad**: Se actualiza
   - **Detalle**: Se completa con tipo de trabajo + descripción + tamaños
   - **Valor Unitario**: Se calcula con los procesos
   - **Total**: Se actualiza automáticamente

---

## 📊 Ejemplo de Uso Completo:

### Antes de hacer clic en "Calcular":
```
┌─────────┬──────────┬─────────┬─────────────┬───────┐
│ Procesos│ Cantidad │ Detalle │ Valor Unit. │ Total │
├─────────┼──────────┼─────────┼─────────────┼───────┤
│ [Calc]  │    1     │ (vacío) │    0.00     │  0.00 │
└─────────┴──────────┴─────────┴─────────────┴───────┘
```

### Después de configurar en el modal y guardar:
```
┌─────────┬──────────┬──────────────────────────┬─────────────┬─────────┐
│ Procesos│ Cantidad │ Detalle                  │ Valor Unit. │ Total   │
├─────────┼──────────┼──────────────────────────┼─────────────┼─────────┤
│ [Calc]  │  1000    │ Carpetas - Corporativas  │    5.50     │ 5500.00 │
│         │          │ Tamaño: C:24x33 / A:48x33│             │         │
└─────────┴──────────┴──────────────────────────┴─────────────┴─────────┘
```

---

## 💡 Ventajas:

### ✅ Cálculo Automático
- No necesitas calcular manualmente
- Suma automática de todos los procesos
- Aplica margen de utilidad

### ✅ Transparencia
- Ves exactamente qué procesos incluiste
- Puedes ajustar precios individuales
- Control total sobre el cálculo

### ✅ Consistencia
- Mismo formato para todos los ítems
- Precios sugeridos del catálogo
- Histórico de procesos aplicados

### ✅ Flexibilidad
- Puedes editar manualmente después
- Opción de precio manual
- Ajustes personalizados por cliente

---

## 🔄 Re-calcular un Ítem:

Si ya calculaste una fila pero quieres modificarla:

1. Haz clic nuevamente en **"Calcular"**
2. El modal se abre con los **datos guardados previamente**
3. Modifica lo que necesites
4. Guarda de nuevo
5. Los valores se **actualizan**

---

## 📝 Datos que se Guardan:

Cuando guardas una cotización, se almacena:

```json
{
  "cantidad": 1000,
  "detalle": "Carpetas - Corporativas\nTamaño: C:24x33 / A:48x33",
  "valor_unitario": 5.50,
  "valor_total": 5500.00,
  
  // Datos adicionales para referencia:
  "tipo_trabajo": "Carpetas",
  "descripcion_trabajo": "Corporativas",
  "tamano_cerrado": "24x33 cm",
  "tamano_abierto": "48x33 cm",
  "procesos": [
    { "proceso": "DISEÑO", "cantidad": 1, "precio_unitario": 500, "subtotal": 500 },
    { "proceso": "PAPEL COUCHÉ 150g", "cantidad": 1000, "precio_unitario": 0.50, "subtotal": 500 },
    { "proceso": "IMPRESIÓN CMYK", "cantidad": 1000, "precio_unitario": 2.00, "subtotal": 2000 },
    // ... más procesos
  ]
}
```

---

## 🎯 Casos de Uso:

### Caso 1: Trabajo Simple
- 1 solo tipo de proceso (ej: impresión digital)
- Cálculo rápido
- Precios estándar

### Caso 2: Trabajo Complejo
- Múltiples procesos de acabados
- Varios materiales
- Precios personalizados

### Caso 3: Cotización con Múltiples Ítems
- Ítem 1: 1000 Carpetas → Calcular con procesos
- Ítem 2: 500 Folletos → Calcular con procesos
- Ítem 3: Manual (sin procesos detallados)

---

## ⚠️ Notas Importantes:

### 1. **Datos Ficticios**
Los procesos actuales son **de prueba**. Deberás:
- Validar que los 21 procesos sean correctos
- Agregar/quitar según necesites
- Ajustar precios sugeridos

### 2. **Edición Manual**
Después de calcular, **puedes editar manualmente**:
- La cantidad
- El detalle
- El valor unitario
- No se perderá el cálculo

### 3. **Persistencia**
Al guardar la cotización, **todos los datos se guardan**, incluyendo:
- Los procesos seleccionados
- Las cantidades
- Los precios

### 4. **Re-edición**
Si editas una cotización existente:
- Los datos se cargan
- Puedes recalcular
- Se mantiene el histórico

---

## 🚀 Próximos Pasos:

### Validación:
1. ✅ Prueba el flujo completo
2. ✅ Verifica que los cálculos sean correctos
3. ✅ Identifica procesos faltantes
4. ✅ Ajusta precios sugeridos

### Implementación del Backend:
Una vez validado, crear:
1. Tabla de catálogo de tipos de trabajo
2. Tabla de catálogo de procesos
3. Tabla de procesos aplicados por ítem
4. APIs para gestionar catálogos

### Mejoras Futuras:
- Plantillas predefinidas (ej: "Carpeta estándar")
- Histórico de precios por proceso
- Reportes de rentabilidad por proceso
- Comparativa de costos

---

## 🎨 Vista del Botón:

El botón se ve así en la tabla:

```
┌──────────────┐
│   [🧮]       │  ← Ícono de calculadora
│  Calcular    │  ← Texto descriptivo
│              │
│ (Color morado│
│  #9333EA)    │
└──────────────┘
```

Al hacer hover:
- Cambia a tono más oscuro (#7e22ce)
- Cursor tipo pointer
- Transición suave

---

**¡Ahora puedes calcular automáticamente los precios de tus cotizaciones con todos los procesos de producción!** 🎉
