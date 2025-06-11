import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => navigate("/");

  const handleRedirect = (path) => navigate(path);

  const menus = {
    default: [
      { path: "/cotizaciones", label: "Cotizaciones" },
      { path: "/ordendeTrabajo", label: "Orden de Trabajo" },
      { path: "/produccion", label: "Producción" },
      { path: "/inventario", label: "Inventario" },
    ],
    cotizaciones: [
      { path: "/cotizaciones/crear", label: "Crear Cotización" },
      { path: "/cotizaciones/ver", label: "Ver Cotizaciones" },
      { path: "/cotizaciones/buscar", label: "Buscar Cotización" },
    ],
    ordenTrabajo: [
      { path: "/ordendeTrabajo/crear", label: "Crear Orden de Trabajo" },
      { path: "/ordendeTrabajo/buscar", label: "Buscar Orden de Trabajo" },
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
            <li key={item.path}>
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

      <button
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md mt-6"
        onClick={handleLogout}
      >
        🔒 Cerrar Sesión
      </button>
    </aside>
  );
};

export default Sidebar;
