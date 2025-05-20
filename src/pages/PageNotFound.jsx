import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
  const navigate = useNavigate();
  const alreadyRedirected = useRef(false);

  useEffect(() => {
    if (!alreadyRedirected.current) {
      alreadyRedirected.current = true;
      alert("Esta página está en construcción. Serás redirigido al menú principal.");
      navigate("/welcome");
    }
  }, [navigate]);

  return null;
};

export default PageNotFound;
