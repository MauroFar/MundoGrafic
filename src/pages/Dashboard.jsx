import { Link } from "react-router-dom";
import "../styles/Dashboard.css";
function Dashboard() {
  return (
    <div className="dashboard-container">
      <form className="dashboard-form">
      <h2>Dashboard</h2>
      <div className="dashboard-buttons">
        <Link to="/cotizaciones">
          <button>Cotizaciones</button>
        </Link>
        <Link to="/ordenes-trabajo">
          <button>Órdenes de Trabajo</button>
        </Link>
        <Link to="/dashboardGeneral">
          <button>En Produccion</button>
        </Link>
      </div>
      </form>
    </div>
  );
}

export default Dashboard;