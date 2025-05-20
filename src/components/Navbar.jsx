import React from "react";

const Navbar = () => {
  return (
    <header className="bg-gray-700 p-4 text-white flex justify-between">
      <h1 className="font-bold">Sistema de Gestión</h1>
      <button className="bg-red-500 px-4 py-2 rounded">Cerrar Sesión</button>
    </header>
  );
};

export default Navbar;
