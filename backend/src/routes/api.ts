// Importamos las rutas existentes
import express from "express";
import rucRoutes from "./rucs";
import clientesRoutes from "./clientes";
import cotizacionRoutes from "./cotizaciones";
import cotizacionDetRoutes from "./cotizacionesDetalles";
import cotizacionesEditar from "./cotizacionesEditar";
import ordenTrabajoRoutes from "./ordenTrabajo";
import puppeteer from "puppeteer";
import uploadRoutes from "./upload";
import chatRoutes from "./chat";

export default (client: any) => {
  const router = express.Router(); // Creamos un router para manejar todas las rutas
    
  // Usamos las rutas importadas
  router.use("/rucs", rucRoutes(client)); // /api/rucs
  router.use("/clientes", clientesRoutes(client)); // /api/clientes
  router.use("/cotizaciones", cotizacionRoutes(client)); // /api/cotizaciones
  router.use("/cotizacionesDetalles", cotizacionDetRoutes(client)); // /api/cotizacionesDetalles
  router.use("/cotizacionesEditar", cotizacionesEditar(client));
  router.use("/ordenTrabajo", ordenTrabajoRoutes(client)); // /api/ordenTrabajo
  router.use("/upload", uploadRoutes); // /api/upload
  router.use("/chat", chatRoutes(client)); // /api/chat

  return router; // Devolvemos el router que agrupa todas las rutas
};
