import React from "react";
import Menu from "../../components/Menu";

const cotizacionOptions = [
 /* { path: "/cotizaciones/ver", label: "Ver Cotizaciones" },*/
  { path: "/cotizaciones/crear", label: "Crear Cotización" },
  { path: "/cotizaciones/buscar", label: "Buscar Cotización" }
];

const CotizacionesMenu = () => {
  return (
    <div style={{ display: "flex" }}>
      <Menu options={cotizacionOptions} />
      <div style={{ padding: "1rem", flex: 1 }}>
        <h1>Cotizaciones</h1>
        <p>Aquí se gestionan las cotizaciones.</p>
      </div>
    </div>
  );
};

export default CotizacionesMenu;
