import React from "react";
import { useTheme } from "../hooks/useTheme";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-gray-700 dark:bg-gray-900 p-4 text-white flex justify-between items-center transition-colors duration-300">
      <h1 className="font-bold">Sistema de Gestión</h1>
      <div className="flex gap-4 items-center">
        <button
          onClick={toggleTheme}
          className="bg-yellow-500 dark:bg-blue-600 hover:bg-yellow-600 dark:hover:bg-blue-700 px-4 py-2 rounded transition-colors duration-300 flex items-center gap-2"
          title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <>
              <span>🌙</span>
              <span>Modo Oscuro</span>
            </>
          ) : (
            <>
              <span>☀️</span>
              <span>Modo Claro</span>
            </>
          )}
        </button>
        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors duration-300">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
