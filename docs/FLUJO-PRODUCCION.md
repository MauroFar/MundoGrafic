# Flujo de Envío a Producción

## ¿Cómo funciona?

### 1. Desde "Ver Órdenes de Trabajo"
1. Navega a **Orden de Trabajo → Ver Órdenes de Trabajo**
2. Busca la orden que deseas enviar a producción
3. Haz clic en el botón **"Enviar a Producción"**
4. Confirma en el modal emergente
5. ✅ La orden se marcará como "en producción"

### 2. Mensaje de Éxito
Después de enviar la orden a producción, verás:
- ✅ Notificación de éxito con el número de orden
- 🔗 Enlace directo: **"Ver en Vista Kanban →"**
  - Haz clic para ir directamente a la Vista Kanban

### 3. Ver Estado en Producción
Una vez que la orden está en producción:
- El botón **"Enviar a Producción"** desaparece
- Aparece el botón **"Ver Estado"** 🎯
- Haz clic en **"Ver Estado"** para ir a la Vista Kanban

### 4. Vista Kanban
La orden aparecerá en:
- **Columna:** "En Proceso" (primera columna)
- **Indicador de urgencia:**
  - 🔴 Rojo: Vencida
  - 🟡 Amarillo: 1-3 días restantes
  - 🟢 Verde: Más de 3 días

### 5. Buscar Orden en Vista Kanban
- Usa el campo de búsqueda en la parte superior
- Escribe el número de orden (ej: "OT-000001")
- Presiona **Enter** o haz clic en **"Buscar"**
- La orden se filtrará instantáneamente

## Estados de Producción

Las órdenes pasan por estos estados en el Kanban:

1. **En Proceso** → Recién enviada a producción
2. **Preprensa** → En preparación de archivos
3. **Impresión** → En proceso de impresión
4. **Acabados/Empacado** → Terminados finales
5. **Listo p/Entrega** → Control de calidad aprobado
6. **Entregado** → Orden completada

## Verificación

### ¿Cómo verificar que funciona?

1. **Envía una orden a producción**
   - Ve a "Ver Órdenes de Trabajo"
   - Haz clic en "Enviar a Producción"
   - Confirma

2. **Verifica en la lista**
   - El botón cambia a "Ver Estado"
   - Ya no puedes eliminar la orden

3. **Ve a Vista Kanban**
   - Haz clic en "Ver Estado" o navega a "Producción → Vista Kanban"
   - Busca tu orden en la columna "En Proceso"

4. **Busca por número**
   - Escribe el número de orden en el buscador
   - Presiona Enter
   - La orden debe aparecer filtrada

## Troubleshooting

### La orden no aparece en Vista Kanban
1. ✅ Verifica que el estado sea "en producción"
2. 🔄 Refresca la Vista Kanban (botón "Actualizar")
3. 🔍 Usa el buscador para encontrar la orden específica
4. 📊 Revisa la consola del navegador (F12) para ver si hay errores

### El botón "Ver Estado" no aparece
- La orden debe estar en alguno de estos estados:
  - en producción
  - en proceso
  - en preprensa
  - en prensa
  - en impresión
  - en acabados
  - en control de calidad
  - en empacado
  - listo para entrega

## Permisos Necesarios

Para enviar órdenes a producción necesitas:
- ✅ Permiso de **"editar"** en **"ordenes_trabajo"**
- ✅ Rol: admin, ejecutivo, o impresion

## Notas Técnicas

### Backend
- Endpoint: `PUT /api/ordenTrabajo/:id/enviar-produccion`
- Cambia el estado a: `'en producción'`
- Actualiza `updated_at` automáticamente

### Frontend
- Actualización local inmediata
- Toast notification con enlace directo
- Botón "Ver Estado" dinámico
- Filtro por número de orden en tiempo real
