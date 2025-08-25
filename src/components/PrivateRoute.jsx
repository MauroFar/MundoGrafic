import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  
  // Verificar si el usuario está autenticado
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  // Verificar si el usuario tiene el rol permitido
  if (!allowedRoles.includes(rol)) {
    return <Navigate to="/no-autorizado" />;
  }
  
  return children;
} 