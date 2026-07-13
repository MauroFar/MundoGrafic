import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PageNotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const alreadyRedirected = useRef(false);

  useEffect(() => {
    if (!alreadyRedirected.current) {
      alreadyRedirected.current = true;
      // Redirigir al menú sin alert bloqueante — el toast o consola dan el contexto
      console.warn(`[PageNotFound] Ruta no encontrada: ${location.pathname}${location.search}`);
      navigate("/welcome", { replace: true });
    }
  }, [navigate, location]);

  return null;
};

export default PageNotFound;
