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
    admin: [
      { path: "/cotizaciones", label: "Cotizaciones" },
      { path: "/ordendeTrabajo", label: "Orden de Trabajo" },
      { path: "/produccion", label: "Producción" },
      { path: "/inventario", label: "Inventario" },
      { path: "/reportesTrabajoDiario", label: "Reportes de Trabajo Diario" },
    ],
    ejecutivo: [
      { path: "/cotizaciones", label: "Cotizaciones" },
      { path: "/ordendeTrabajo", label: "Orden de Trabajo" },
      { path: "/produccion", label: "Producción" },
      { path: "/inventario", label: "Inventario" },
      { path: "/reportesTrabajoDiario", label: "Reportes de Trabajo Diario" },
    ],
    impresion: [
      { path: "/ordendeTrabajo", label: "Orden de Trabajo" },
      { path: "/produccion", label: "Producción" },
      { path: "/reportesTrabajoDiario", label: "Reportes de Trabajo Diario" },
    ],
    default: [
      { path: "/inventario", label: "Inventario" },
    ],
    cotizaciones: [
      { path: "/cotizaciones/crear", label: "Crear Cotización" },
      { path: "/cotizaciones/ver", label: "Ver Cotizaciones" }
    ],
    ordenTrabajo: [
      { path: "/ordendeTrabajo/crear", label: "Crear Orden de Trabajo" },
      { path: "/ordendeTrabajo/ver", label: "Ver Órdenes de Trabajo" },
    ],
    produccion: [
      { path: "/dashboardGeneral", label: "En Producción" },
      { path: "/produccionDiaria", label: "Producción Diaria" },
      { path: "/productosTerminados", label: "Productos Terminados" },
    ],
  };

  const noBackButtonPaths = ["/welcome", "/"];
  const showBackButton = !noBackButtonPaths.includes(location.pathname);

  const isSubmenu = () => {
    return (
      location.pathname.startsWith("/cotizaciones") ||
      location.pathname.startsWith("/ordendeTrabajo") ||
      location.pathname.startsWith("/produccion") ||
      location.pathname === "/dashboardGeneral" ||
      location.pathname === "/productosTerminados"
    );
  };

  const getMenuItems = () => {
    if (location.pathname.startsWith("/cotizaciones")) return menus.cotizaciones;
    if (location.pathname.startsWith("/ordendeTrabajo")) return menus.ordenTrabajo;
    if (
      location.pathname.startsWith("/produccion") ||
      location.pathname === "/dashboardGeneral" ||
      location.pathname === "/productosTerminados"
    ) return menus.produccion;
    // Menú principal según el rol
    if (rol === 'admin') return menus.admin;
    if (rol === 'ejecutivo') return menus.ejecutivo;
    if (rol === 'impresion') return menus.impresion;
    return menus.default;
  };

  const menuItems = getMenuItems();
  const inSubmenu = isSubmenu();

  return (
    <aside className="bg-gray-900 text-white w-full sm:w-64 min-h-screen p-4 flex flex-col justify-between shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">
          {inSubmenu ? "Opciones" : "Menú"}
        </h2>

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

        {/* Botón para volver al menú principal si estás en un submenú */}
        {inSubmenu && (
          <button
            className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
            onClick={() => navigate("/welcome")}
          >
            ⬅️ Volver al Menú Principal
          </button>
        )}
      </div>

      {/* Eliminar botón de cerrar sesión aquí */}
    </aside>
  );
};

export default Sidebar;
