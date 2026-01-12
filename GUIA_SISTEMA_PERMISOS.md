# 📋 Guía de Uso del Sistema de Permisos Reutilizable

## 🎯 Objetivo
Este sistema te permite implementar permisos en **cualquier interfaz nueva** sin repetir código. Solo importas los componentes y listo.

---

## 🚀 Métodos Disponibles

### **Método 1: `<BotonConPermiso>` (Recomendado para botones)**

**Cuándo usar:** Botones de acción (Crear, Editar, Eliminar, etc.)

**Características:**
- ✅ Oculta automáticamente el botón si no tiene permiso
- ✅ Valida antes de ejecutar la acción
- ✅ Muestra modal de error automáticamente
- ✅ Incluye el modal sin configuración extra

**Ejemplo:**
```jsx
import BotonConPermiso from '../../components/BotonConPermiso';

<BotonConPermiso
  modulo="clientes"           // Módulo a verificar
  accion="crear"              // crear, leer, editar, eliminar
  onClick={() => crearCliente()}
  className="bg-blue-600 text-white px-4 py-2 rounded"
  textoError="crear un nuevo cliente"  // Opcional: texto personalizado
>
  Nuevo Cliente
</BotonConPermiso>
```

---

### **Método 2: `<ProtegidoPorPermiso>` (Para secciones completas)**

**Cuándo usar:** Ocultar secciones enteras de la UI (formularios, paneles, etc.)

**Características:**
- ✅ Oculta todo el contenido si no tiene permiso
- ✅ Puedes mostrar contenido alternativo (fallback)
- ✅ Ideal para proteger múltiples elementos a la vez

**Ejemplo:**
```jsx
import { ProtegidoPorPermiso } from '../../components/PermisosHelpers';

<ProtegidoPorPermiso 
  modulo="cotizaciones" 
  accion="editar"
  fallback={<p>No tienes permisos para editar</p>}  // Opcional
>
  <div className="panel-edicion">
    <input type="text" />
    <button>Guardar Cambios</button>
  </div>
</ProtegidoPorPermiso>
```

---

### **Método 3: `useAccionConPermiso()` (Para lógica compleja)**

**Cuándo usar:** Acciones con múltiples pasos o lógica condicional compleja

**Características:**
- ✅ Control total sobre cuándo validar
- ✅ Ideal para funciones con lógica antes/después
- ✅ Muestra modal automáticamente

**Ejemplo:**
```jsx
import { useAccionConPermiso } from '../../components/PermisosHelpers';

const MiComponente = () => {
  const eliminarConPermiso = useAccionConPermiso(
    'clientes',                    // Módulo
    'eliminar',                    // Acción
    'eliminar este cliente'        // Texto del modal
  );

  const handleEliminar = (id) => {
    eliminarConPermiso(() => {
      // Esta función solo se ejecuta si tiene permiso
      if (window.confirm("¿Estás seguro?")) {
        eliminarCliente(id);
        toast.success("Cliente eliminado");
      }
    });
  };

  return <button onClick={() => handleEliminar(123)}>Eliminar</button>;
};
```

---

## 📦 Instalación en Nueva Interfaz

### Paso 1: Importar lo que necesites

```jsx
// Para botones simples
import BotonConPermiso from '../../components/BotonConPermiso';

// Para secciones o lógica compleja
import { ProtegidoPorPermiso, useAccionConPermiso } from '../../components/PermisosHelpers';

// Para el modal (solo si usas método 2 o 3)
import { usePermisos } from '../../hooks/usePermisos';
import ModalSinPermisos from '../../components/ModalSinPermisos';
```

### Paso 2: Usar en tu componente

```jsx
const MiNuevaInterfaz = () => {
  // Solo si usas método 2 o 3 necesitas esto:
  const { modalData, cerrarModal } = usePermisos();

  return (
    <div>
      {/* Botón con permiso */}
      <BotonConPermiso
        modulo="mi_modulo"
        accion="crear"
        onClick={handleCrear}
        className="btn-primary"
      >
        Crear Nuevo
      </BotonConPermiso>

      {/* Modal (solo si usas método 2 o 3) */}
      <ModalSinPermisos 
        isOpen={modalData.isOpen}
        onClose={cerrarModal}
        accion={modalData.accion}
        modulo={modalData.modulo}
      />
    </div>
  );
};
```

---

## 📝 Módulos y Acciones Disponibles

### **Módulos:**
- `clientes`
- `cotizaciones`
- `ordenes_trabajo`
- `produccion`
- `inventario`
- `usuarios`
- `reportes`

### **Acciones:**
- `crear` - Crear nuevos registros
- `leer` - Ver/listar registros
- `editar` - Modificar registros
- `eliminar` - Borrar registros

---

## 🎨 Ejemplo Completo de Tabla CRUD

```jsx
import BotonConPermiso from '../../components/BotonConPermiso';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const TablaProductos = () => {
  const productos = [/* ... */];

  return (
    <div>
      {/* Header con botón crear */}
      <div className="flex justify-between mb-4">
        <h1>Productos</h1>
        <BotonConPermiso
          modulo="inventario"
          accion="crear"
          onClick={() => navigate('/productos/crear')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          <FaPlus /> Nuevo Producto
        </BotonConPermiso>
      </div>

      {/* Tabla */}
      <table>
        <tbody>
          {productos.map(producto => (
            <tr key={producto.id}>
              <td>{producto.nombre}</td>
              <td>
                {/* Botón editar */}
                <BotonConPermiso
                  modulo="inventario"
                  accion="editar"
                  onClick={() => editarProducto(producto.id)}
                  className="text-blue-600 p-2"
                >
                  <FaEdit />
                </BotonConPermiso>

                {/* Botón eliminar */}
                <BotonConPermiso
                  modulo="inventario"
                  accion="eliminar"
                  onClick={() => eliminarProducto(producto.id)}
                  className="text-red-600 p-2"
                >
                  <FaTrash />
                </BotonConPermiso>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## ✅ Ventajas del Sistema

1. **Sin repetir código** - Importas y usas, no necesitas escribir validaciones
2. **Consistente** - Todos los permisos funcionan igual en toda la app
3. **Fácil de mantener** - Cambios en un solo lugar afectan toda la app
4. **Modal automático** - Los usuarios ven advertencias claras
5. **Backend protegido** - Aunque manipulen el frontend, el backend rechaza acciones

---

## 🔧 Personalización

### Cambiar el texto del modal:
```jsx
<BotonConPermiso
  modulo="clientes"
  accion="eliminar"
  textoError="eliminar este cliente permanentemente"  // ← Aquí
  onClick={handleDelete}
>
  Eliminar
</BotonConPermiso>
```

### Botón deshabilitado (no oculto):
Si quieres que el botón se vea pero deshabilitado cuando no tiene permiso, necesitas hacer:

```jsx
import { usePermisos } from '../../hooks/usePermisos';

const { tienePermiso } = usePermisos();

<button
  onClick={handleAccion}
  disabled={!tienePermiso('clientes', 'editar')}
  className="btn"
>
  Editar
</button>
```

---

## 🚨 Errores Comunes

### ❌ Error: "modalData is not defined"
**Solución:** Importar y usar el modal cuando uses método 2 o 3:
```jsx
const { modalData, cerrarModal } = usePermisos();
// ...
<ModalSinPermisos isOpen={modalData.isOpen} onClose={cerrarModal} />
```

### ❌ Error: "El botón no desaparece"
**Solución:** Verifica que el nombre del módulo sea exacto:
- ✅ `"clientes"` (correcto)
- ❌ `"cliente"` (incorrecto - sin 's')
- ❌ `"Clientes"` (incorrecto - con mayúscula)

---

## 📞 Soporte

Si necesitas agregar un nuevo módulo:
1. Ve a `backend/create-permissions-system.js`
2. Agrega el módulo al array de módulos
3. Ejecuta el script: `node create-permissions-system.js`
4. Configura los permisos desde Gestión de Usuarios

---

¡Listo! Ahora puedes implementar permisos en cualquier interfaz en **menos de 5 líneas de código**. 🚀
