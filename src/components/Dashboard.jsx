import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <div className="dashboard-buttons">
        <Link to="/cotizaciones">
          <button>Cotizaciones</button>
        </Link>
        <Link to="/pedidos">
          <button>Pedidos</button>
        </Link>
        <Link to="/ordenes-trabajo">
          <button>Órdenes de Trabajo</button>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;