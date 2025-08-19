// Importamos las rutas existentes
import express from "express";
import rucRoutes from "./rucs";
import clientesRoutes from "./clientes";
import cotizacionRoutes from "./cotizaciones";
import cotizacionDetRoutes from "./cotizacionesDetalles";
import cotizacionesEditar from "./cotizacionesEditar";
// import ordenTrabajoRoutes from "./ordenTrabajo";    // TEMPORALMENTE COMENTADO
import puppeteer from "puppeteer";
// import uploadRoutes from "./upload";                // TEMPORALMENTE COMENTADO
// import chatRoutes from "./chat";                    // TEMPORALMENTE COMENTADO

export default (client: any) => {
  const router = express.Router(); // Creamos un router para manejar todas las rutas
    
  // Usamos las rutas importadas (TEMPORALMENTE COMENTADAS)
  router.use("/rucs", rucRoutes(client)); // /api/rucs
  router.use("/clientes", clientesRoutes(client)); // /api/clientes
  router.use("/cotizaciones", cotizacionRoutes(client)); // /api/cotizaciones
  router.use("/cotizacionesDetalles", cotizacionDetRoutes(client)); // /api/cotizacionesDetalles
  router.use("/cotizacionesEditar", cotizacionesEditar(client));
  // router.use("/ordenTrabajo", ordenTrabajoRoutes(client)); // /api/ordenTrabajo
  // router.use("/upload", uploadRoutes); // /api/upload
  // router.use("/chat", chatRoutes(client)); // /api/chat

  // Ruta de prueba simple
  router.get("/test", (req, res) => {
    res.json({ message: "API funcionando sin dependencias problemáticas" });
  });

  return router; // Devolvemos el router que agrupa todas las rutas
};
