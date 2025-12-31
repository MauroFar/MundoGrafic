# 🎨 Guía Visual del Prototipo

## 📸 ¿Cómo se ve?

### 1️⃣ VISTA PRINCIPAL - Lista de Ítems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Cotización COT-001                                      [+ Agregar Ítem]   │
│  AOG FOODS S.A.                                                             │
│  Fecha: 2024-04-15                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  No. │ Tipo      │ Descripción      │ Cant.  │ Tamaño    │ P.Unit │ Total  │
│  ────┼───────────┼──────────────────┼────────┼───────────┼────────┼────────┤
│   1  │ Carpetas  │ Carpetas tamaño  │ 1,000  │ C:24x33   │ $5.50  │ $5,500 │
│      │           │ oficio           │        │ A:48x33   │        │        │
│      │           │                  │        │           │        │ [✏️][🗑️] │
│  ────┼───────────┼──────────────────┼────────┼───────────┼────────┼────────┤
│   2  │ Folletos  │ Folletos triptico│   500  │ C:21x28   │ $3.20  │ $1,600 │
│      │           │ tamaño carta     │        │ A:64x28   │        │        │
│      │           │                  │        │           │        │ [✏️][🗑️] │
│  ────┴───────────┴──────────────────┴────────┴───────────┴────────┴────────┤
│                                           TOTAL GENERAL:          $7,100.00 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2️⃣ MODAL DE EDICIÓN - Al hacer clic en "Agregar" o "Editar"

```
┌───────────────────────────────────────────────────────────────────────────┐
│  AGREGAR ÍTEM                                                        [✖]  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─ INFORMACIÓN BÁSICA ─────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  Tipo de Trabajo: [Carpetas ▼]    Cantidad: [1000]               │   │
│  │                                                                    │   │
│  │  Descripción: [________________________________]                  │   │
│  │                                                                    │   │
│  │  Tamaño Cerrado: [24x33 cm]    Tamaño Abierto: [48x33 cm]       │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─ PROCESOS A INCLUIR ──────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  📋 Pre-Prensa                                                     │   │
│  │  ☑ DISEÑO ............. Cant:[1] Precio:[500.00] = $500.00       │   │
│  │  ☐ PRUEBA COLOR                                                   │   │
│  │  ☐ PLACAS CMYK                                                    │   │
│  │                                                                    │   │
│  │  📄 Materiales                                                     │   │
│  │  ☐ PAPEL BOND 75g                                                 │   │
│  │  ☑ PAPEL COUCHÉ 150g .. Cant:[1000] Precio:[0.50] = $500.00      │   │
│  │  ☐ PAPEL OPALINA 240g                                             │   │
│  │                                                                    │   │
│  │  🖨️ Impresión                                                      │   │
│  │  ☑ IMPRESIÓN CMYK ..... Cant:[1000] Precio:[2.00] = $2,000.00    │   │
│  │  ☐ IMPRESIÓN DIGITAL                                              │   │
│  │                                                                    │   │
│  │  ✂️ Acabados                                                       │   │
│  │  ☑ PLASTIFICADO ....... Cant:[1000] Precio:[0.80] = $800.00      │   │
│  │  ☐ TROQUEL                                                        │   │
│  │  ☐ TROQUELADO                                                     │   │
│  │  ☑ UV SELECTIVO ....... Cant:[1000] Precio:[1.20] = $1,200.00    │   │
│  │  ☐ UV TOTAL                                                       │   │
│  │  ☐ PEGADO                                                         │   │
│  │  ☐ ENCOLADO                                                       │   │
│  │  ... (más procesos disponibles)                                   │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─ 🧮 CÁLCULO DE PRECIOS ───────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  Costo Total de Procesos: ............................. $5,000.00 │   │
│  │  Costo Unitario (÷ 1000): ................................. $5.00 │   │
│  │  Margen de Utilidad: [20] % ................................ $1.00 │   │
│  │  Precio Unitario: ....................................... $6.00 ☐  │   │
│  │                                                                    │   │
│  │  ═══════════════════════════════════════════════════════════════   │   │
│  │  TOTAL FINAL: ........................................... $6,000.00│   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│                                           [Cancelar]  [Guardar Ítem]     │
└───────────────────────────────────────────────────────────────────────────┘
```

## 🎮 Interacciones:

### ✅ Seleccionar Procesos:
1. Haz clic en el checkbox de cualquier proceso
2. Se despliegan los campos de cantidad y precio
3. Los valores se calculan automáticamente

### 🔢 Modificar Valores:
- Cambia la cantidad → El subtotal se actualiza
- Cambia el precio → El subtotal se actualiza
- Cambia el margen → El precio unitario se recalcula

### 💰 Precio Manual:
- Marca "Manual" junto a "Precio Unitario"
- Ahora puedes escribir directamente el precio
- El sistema ignora el cálculo automático

### 💾 Guardar:
- Click en "Guardar Ítem"
- El ítem se agrega a la tabla
- Los totales se actualizan automáticamente

## 🎨 Colores y Estilo:

### Paleta de colores:
- **Azul** (#3498db): Acciones principales
- **Verde** (#27ae60): Valores monetarios, éxito
- **Púrpura** (gradient): Headers, destacados
- **Gris** (#7f8c8d): Texto secundario
- **Rojo** (#e74c3c): Acciones de eliminar

### Efectos visuales:
- ✨ Animaciones suaves al abrir modales
- 🎯 Hover effects en botones y filas
- 📊 Cálculos en tiempo real
- 🔄 Transiciones suaves

## 📱 Responsive:

El diseño se adapta a diferentes tamaños de pantalla:
- **Desktop**: Vista completa con todos los elementos
- **Tablet**: Ajuste de columnas en grid
- **Móvil**: Stack vertical, modal de pantalla completa

## 🚀 Cómo Acceder:

### Opción 1: URL Directa
```
http://localhost:5173/cotizaciones/items-prototipo
```

### Opción 2: Desde Cotizaciones
1. Ve a: `http://localhost:5173/cotizaciones/ver`
2. Verás un botón púrpura: "🎨 Ver Prototipo de Ítems"
3. Click y listo

## 💡 Tips para la Demostración:

1. **Muestra el flujo completo:**
   - Ver lista → Agregar ítem → Seleccionar procesos → Ver cálculos → Guardar

2. **Demuestra la flexibilidad:**
   - Agrega diferentes tipos de trabajo
   - Combina distintos procesos
   - Muestra cómo se ajustan los precios

3. **Destaca características:**
   - Cálculo automático en tiempo real
   - Opción de precio manual
   - Organización por categorías
   - Resumen de costos claro

4. **Valida con usuarios:**
   - ¿Faltan procesos?
   - ¿Los campos son suficientes?
   - ¿La interfaz es intuitiva?
   - ¿Los cálculos son correctos?

## 🎯 Preguntas para Validar:

Usa el prototipo para responder:
- ✅ ¿Qué otros procesos necesitas agregar?
- ✅ ¿Qué campos adicionales hacen falta?
- ✅ ¿Los precios sugeridos tienen sentido?
- ✅ ¿Necesitas diferentes unidades de medida?
- ✅ ¿Cómo calculas realmente los precios?
- ✅ ¿Necesitas plantillas predefinidas?
- ✅ ¿Qué reportes necesitas generar?

---

**¡Ahora puedes ver, tocar y validar el sistema antes de invertir tiempo en el backend!** 🎉
