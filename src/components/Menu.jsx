import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Menu = ({ options }) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-800 p-4 min-w-[200px] min-h-screen text-white">
      {/* Botón Volver */}
      <button
        className="bg-gray-200 border border-gray-300 py-2 px-4 w-full mb-5 cursor-pointer hover:bg-gray-300 text-gray-800 font-semibold"
        onClick={() => navigate("/dashboard")}
      >
        ← Volver
      </button>

      <ul className="space-y-4">
        {options.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              className="text-white font-bold hover:text-gray-400 block"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;
