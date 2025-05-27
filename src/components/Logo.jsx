  import React from "react";
  import "../styles/Logo.css";
  // Importa los estilos específicos del logo si los tienes

  const Logo = () => {
    return (
      <div className="contenedorlogo">
        <span className="corp">CORPORACION</span>
        <h1 className="mundo">
          MUNDO
          <span className="graf">
            GRAFIC<span className="marca">®</span>
          </span>
        </h1>
      </div>
    );
  };

  export default Logo;
