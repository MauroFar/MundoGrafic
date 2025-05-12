import React from "react";
import Menu from "../../components/Menu";

const ordenTrabajoOptions = [
  { path: "/ordendetrabajo/ver", label: "Ver Órdenes" },
  { path: "/ordenes-trabajo/:id", label: "Crear Orden" },
  { path: "/ordendetrabajo/buscar", label: "Buscar Orden" }
];

const OrdenesTrabajoMenu = () => {
  return (
    <div style={{ display: "flex" }}>
      <Menu options={ordenTrabajoOptions} />
      <div style={{ padding: "1rem", flex: 1 }}>
        <h1>Órdenes de Trabajo</h1>
        <p>Aquí se gestionan las órdenes de trabajo.</p>
      </div>
    </div>
  );
};

export default OrdenesTrabajoMenu;
