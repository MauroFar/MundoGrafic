  import React from "react";
  import "../styles/Logo.css";
  // Importa los estilos específicos del logo si los tienes

  const Logo = ({ titulo = "CORPORACION MUNDO GRAFIC" }) => {
    const esTituloPersona = titulo === "JUAN CARLOS PANCHI BURBANO";

    return (
      <div className="flex items-center gap-3 logo-container">
        {/* Prefer image from public/images if present */}
        <img src="/images/logo.png" alt="MundoGrafic" className="w-20 h-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="logo-text hidden sm:block">
          {esTituloPersona ? (
            <div className="text-lg font-bold text-black leading-tight">{titulo}</div>
          ) : (
            <>
              <div className="text-xs text-gray-500 font-bold">CORPORACION</div>
              <div className="text-lg font-bold text-black">
                MUNDO <span className="text-red-600">GRAFIC</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  export default Logo;
