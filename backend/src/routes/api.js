// Importamos las rutas existentes
const express = require("express");
const rucRoutes = require("./rucs");
const clientesRoutes = require("./clientes");
const cotizacionRoutes = require("./cotizaciones");
const cotizacionDetRoutes = require("./cotizacionesDetalles");
const cotizacionesEditar = require("./cotizacionesEditar");
const ordenTrabajoRoutes = require("./ordenTrabajo");
const puppeteer = require("puppeteer");
const uploadRoutes = require("./upload");
const chatRoutes = require("./chat").default || require("./chat");

module.exports = (client) => {
  const router = express.Router(); // Creamos un router para manejar todas las rutas
    
  // Usamos las rutas importadas
  router.use("/rucs", rucRoutes(client)); // /api/rucs
  router.use("/clientes", clientesRoutes(client)); // /api/clientes
  router.use("/cotizaciones", cotizacionRoutes(client)); // /api/cotizaciones
  router.use("/cotizacionesDetalles", cotizacionDetRoutes(client)); // /api/cotizacionesDetalles
  router.use("/cotizacionesEditar", cotizacionesEditar(client));
  router.use("/ordenTrabajo", (ordenTrabajoRoutes.default || ordenTrabajoRoutes)(client)); // /api/ordenTrabajo
  router.use("/upload", uploadRoutes); // /api/upload
  router.use("/chat", chatRoutes(client)); // /api/chat

  return router; // Devolvemos el router que agrupa todas las rutas
};
