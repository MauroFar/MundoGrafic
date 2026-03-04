import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rol = localStorage.getItem('rol');

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/", { replace: true });
    window.location.reload(); // Fuerza recarga y limpieza de la UI
  };

  const handleRedirect = (path) => {
    // Si el usuario va a crear una orden, forzar reemplazo y limpiar state
    if (path === '/ordendeTrabajo/crear') {
      navigate(path, { replace: true, state: undefined });
    } else {
      navigate(path);
    }
  };

  // Menús según el rol
  const menus = {
    // Menú completo sin restricciones por rol
    all: [
      { path: "/clientes", label: "Clientes" },
      { path: "/cotizaciones", label: "Cotizaciones" },
      { path: "/ordendeTrabajo", label: "Orden de Trabajo" },
      { path: "/produccion/kanban", label: "Producción" },
      { path: "/inventario", label: "Inventario" },
      { path: "/administracion", label: "Administración" },
      { path: "/reportesTrabajoDiario", label: "Reportes de Trabajo Diario" },
    ],
    clientes: [
      { path: "/clientes/ver", label: "Ver Clientes" },
      { path: "/clientes/crear", label: "Crear Cliente" }
    ],
    cotizaciones: [
      { path: "/cotizaciones/crear", label: "Crear Cotización" },
      { path: "/cotizaciones/ver", label: "Ver Cotizaciones" }
    ],
    ordenTrabajo: [
      { path: "/ordendeTrabajo/crear", label: "Crear Orden de Trabajo" },
      { path: "/ordendeTrabajo/ver", label: "Ver Órdenes de Trabajo" },
      { path: "/certificados", label: "Certificados Calidad" },
    ],
    // Submenú de Producción
    produccion: [
      { path: "/clientes", label: "Clientes" },
      { path: "/cotizaciones", label: "Cotizaciones" },
      { path: "/ordendeTrabajo", label: "Orden de Trabajo" },
      { path: "/produccion/kanban", label: "Vista Kanban" },
      { path: "/productosTerminados", label: "Productos Liberados" },
      { path: "/productosEntregados", label: "Productos Entregados" },
    ],
    // Submenú de Administración
    administracion: [
      { path: "/admin/usuarios", label: "Gestión de Usuarios" },
      { path: "/admin/roles", label: "Gestión de Roles" },
      { path: "/admin/areas", label: "Gestión de Áreas" },
      { path: "/admin/catalogo-procesos", label: "Catálogo de Procesos" },
      { path: "/admin/tipos-trabajo", label: "Tipos de Trabajo" },
      { path: "/inventario", label: "Inventario" },
      { path: "/reportesTrabajoDiario", label: "Reportes" },
    ],
  };

  const noBackButtonPaths = ["/welcome", "/"];
  const showBackButton = !noBackButtonPaths.includes(location.pathname);

  const isSubmenu = () => {
    return (
      location.pathname.startsWith("/clientes") ||
      location.pathname.startsWith("/cotizaciones") ||
      location.pathname.startsWith("/ordendeTrabajo") ||
      location.pathname.startsWith("/certificados") ||
      location.pathname.startsWith("/produccion") ||
      location.pathname.startsWith("/admin") ||
      location.pathname === "/administracion" ||
      location.pathname === "/productosTerminados" ||
      location.pathname === "/productosEntregados"
    );
  };

  const getMenuItems = () => {
    if (location.pathname.startsWith("/clientes")) return menus.clientes;
    if (location.pathname.startsWith("/cotizaciones")) return menus.cotizaciones;
    if (location.pathname.startsWith("/ordendeTrabajo") || location.pathname.startsWith("/certificados")) return menus.ordenTrabajo;
    if (location.pathname.startsWith("/admin") || location.pathname === "/administracion") {
      return menus.administracion;
    }
    if (
      location.pathname.startsWith("/produccion") ||
      location.pathname === "/productosTerminados" ||
      location.pathname === "/productosEntregados"
    ) {
      return menus.produccion;
    }
    // Menú principal - mostrar todo sin filtrar por rol
    return menus.all;
  };

  const menuItems = getMenuItems();
  const inSubmenu = isSubmenu();

  return (
    <aside className="bg-gray-900 text-white w-full sm:w-64 min-h-screen p-4 flex flex-col justify-between shadow-lg">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-center text-blue-400">
            {inSubmenu ? "Opciones" : "Menú"}
          </h2>
          <button
            onClick={() => window.dispatchEvent(new Event('hide-sidebar'))}
            className="ml-2 text-sm bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
            title="Ocultar menú"
          >
            Ocultar
          </button>
        </div>

        {/* Render solo el menú activo */}
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path + '-' + item.label}>
              <button
                onClick={() => handleRedirect(item.path)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-md transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-blue-600 text-white border-l-4 border-blue-400"
                    : "hover:bg-gray-700 text-gray-300"
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Gestión TI: ahora disponible desde el Menú Principal */}

        {/* Botón para regresar al menú anterior si estás en un submenú */}
        {inSubmenu && (
          <button
            className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
            onClick={() => {
              if (location.pathname.startsWith("/admin") || location.pathname === "/administracion") {
                navigate('/welcome');
              } else {
                navigate('/produccion/kanban');
              }
            }}
            title="Regresar al menú principal"
          >
            ⬅️ Regresar
          </button>
        )}
      </div>

      {/* Eliminar botón de cerrar sesión aquí */}
    </aside>
  );
};

export default Sidebar;
