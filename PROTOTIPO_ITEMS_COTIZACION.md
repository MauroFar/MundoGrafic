# 📋 Prototipo: Sistema de Ítems de Cotización

## 🎯 ¿Qué es esto?

Este es un **prototipo visual** del sistema de ítems de cotización con procesos de producción. Usa **datos ficticios** para que puedas visualizar cómo funcionaría antes de implementar el backend.

## 🚀 Cómo ver el prototipo

### 1. Acceder desde el navegador:

```
http://localhost:5173/cotizaciones/items-prototipo
```

### 2. O agregar un botón temporal en tu menú:

En cualquier vista de cotizaciones, puedes agregar un botón:

```jsx
<button onClick={() => navigate('/cotizaciones/items-prototipo')}>
  Ver Prototipo de Ítems
</button>
```

## 📦 Archivos creados:

### Frontend:
- `src/pages/cotizaciones/CotizacionItems.jsx` - Componente principal (lista de ítems)
- `src/pages/cotizaciones/ItemEditorModal.jsx` - Modal de edición de ítem
- `src/styles/cotizaciones/CotizacionItems.css` - Estilos de la lista
- `src/styles/cotizaciones/ItemEditorModal.css` - Estilos del modal

### Datos Mock incluidos:
- **Tipos de Trabajo**: 8 tipos (Carpetas, Folletos, Revistas, etc.)
- **Procesos**: 21 procesos organizados en 4 categorías
- **Ítems de ejemplo**: 2 ítems pre-cargados

## 🎨 Funcionalidades del prototipo:

### Vista Principal:
✅ Lista de ítems en formato tabla
✅ Muestra: tipo, descripción, cantidad, tamaño, precio unitario, total
✅ Botones de editar y eliminar por ítem
✅ Cálculo automático del total general
✅ Botón "Agregar Ítem"

### Modal de Edición de Ítem:
✅ Selección de tipo de trabajo (dropdown)
✅ Campos de cantidad y tamaños
✅ **21 procesos disponibles** organizados en categorías:
  - 📋 Pre-Prensa (Diseño, Prueba Color, Placas)
  - 📄 Materiales (3 tipos de papel)
  - 🖨️ Impresión (CMYK, Digital)
  - ✂️ Acabados (Plastificado, UV, Troquel, etc.)

✅ **Checkbox interactivo** - Al marcar un proceso se despliegan:
  - Campo de cantidad
  - Campo de precio unitario (editable)
  - Cálculo automático del subtotal

✅ **Cálculo automático en tiempo real:**
  - Suma de todos los procesos
  - Costo unitario (÷ cantidad)
  - Margen de utilidad (configurable)
  - Precio unitario final
  - Total del ítem

✅ Opción de precio manual (override del cálculo)

## 🧪 Cómo probar:

1. **Ver ítems existentes**: 
   - Hay 2 ítems pre-cargados (Carpetas y Folletos)
   - Puedes ver sus detalles en la tabla

2. **Editar un ítem**:
   - Click en el botón de editar (lápiz)
   - Se abre el modal con todos los datos
   - Puedes modificar cantidad, precios, procesos
   - Los cálculos se actualizan en tiempo real

3. **Agregar nuevo ítem**:
   - Click en "Agregar Ítem"
   - Selecciona tipo de trabajo
   - Ingresa cantidad
   - Marca los procesos que necesitas
   - Ajusta cantidades y precios
   - Observa cómo se calcula automáticamente

4. **Jugar con los procesos**:
   - Marca/desmarca procesos
   - Cambia cantidades
   - Ajusta precios
   - Modifica el margen de utilidad
   - Ve el precio final actualizarse

5. **Eliminar ítem**:
   - Click en el ícono de eliminar (basurero)
   - Confirma la acción

## 📊 Datos Mock - Ejemplos:

### Ítem 1: Carpetas (1000 unidades)
- Diseño: $500
- Papel Couché: 1000 hojas × $0.50 = $500
- Impresión CMYK: 1000 hojas × $2.00 = $2,000
- Plastificado: 1000 piezas × $0.80 = $800
- UV Selectivo: 1000 piezas × $1.20 = $1,200
- **Total: $5,000 → $5.00 por pieza**

### Ítem 2: Folletos (500 unidades)
- Diseño: 2 horas × $500 = $1,000
- Papel Bond: 500 hojas × $0.20 = $100
- Impresión Digital: 500 hojas × $1.00 = $500
- **Total: $1,600 → $3.20 por pieza**

## 🎯 Validar con el prototipo:

Usa este prototipo para:
- ✅ Validar que la interfaz es intuitiva
- ✅ Verificar que los cálculos son correctos
- ✅ Identificar procesos faltantes o innecesarios
- ✅ Decidir qué campos adicionales necesitas
- ✅ Mostrar a usuarios/clientes para feedback
- ✅ Documentar requerimientos antes del backend

## 🔄 Próximos pasos:

Una vez validado el prototipo:

1. **Definir catálogos finales**:
   - Lista completa de tipos de trabajo
   - Lista completa de procesos
   - Precios sugeridos

2. **Crear estructura de BD**:
   - Tablas de catálogos
   - Tablas de cotizaciones e ítems
   - Relaciones

3. **Implementar APIs backend**:
   - CRUD de catálogos
   - CRUD de ítems de cotización
   - Cálculos

4. **Conectar frontend con backend**:
   - Reemplazar datos mock con llamadas API
   - Persistencia real

## 🐛 Nota:

Este prototipo **NO guarda en base de datos**. Los cambios se pierden al recargar la página. Es solo para visualización y validación.

## 💡 Sugerencias:

- Prueba agregar diferentes tipos de trabajos
- Experimenta con diferentes combinaciones de procesos
- Valida que los cálculos tienen sentido
- Identifica campos o procesos faltantes
- Toma screenshots para documentar

---

**¡Ahora puedes visualizar y validar el sistema antes de crear toda la estructura de backend!** 🎉
