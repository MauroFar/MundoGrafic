import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles }) {
  const rol = localStorage.getItem('rol');
  if (!allowedRoles.includes(rol)) {
    return <Navigate to="/no-autorizado" />;
  }
  return children;
} 