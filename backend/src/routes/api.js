// Importamos las rutas existentes
const express = require("express");
const rucRoutes = require("./rucs");
const clientesRoutes = require("./clientes");
const cotizacionRoutes = require("./cotizaciones");
const cotizacionDetRoutes = require("./cotizacionesDetalles");
const buscarCotizaciones = require("./buscarCotizaciones");
const cotizacionesEditar = require("./cotizacionesEditar");
// pdfGenerator.js
const generatePDF = require("./pdfGenerator");

module.exports = (client) => {
  const router = express.Router(); // Creamos un router para manejar todas las rutas
    // Ruta para generar el PDF
    router.post("/pdfGenerator/generate", async (req, res) => {
      console.log("Solicitud recibida en /pdfGenerator/generate");
      try {
        const { content } = req.body;
  
        if (!content) {
          console.warn("Contenido HTML no proporcionado");
          return res.status(400).json({ error: "Contenido HTML es requerido" });
        }
  
        console.log("Contenido recibido para generar PDF:", content);
  
        const pdfBuffer = await generatePDF(content); // Aquí debe funcionar ahora
  
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=cotizacion.pdf");
        res.send(pdfBuffer);
  
      } catch (error) {
        console.error("Error al generar el PDF:", error.message);
        res.status(500).json({ error: "Error al generar el PDF", details: error.message });
      }
    });
    
  // Usamos las rutas importadas
  router.use("/rucs", rucRoutes(client)); // /api/rucs
  router.use("/clientes", clientesRoutes(client)); // /api/clientes
  router.use("/cotizaciones", cotizacionRoutes(client)); // /api/cotizaciones
  router.use("/cotizacionesDetalles", cotizacionDetRoutes(client)); // /api/cotizacionesDetalles
  router.use("/buscarCotizaciones", buscarCotizaciones(client));
  router.use("/cotizacionesEditar",cotizacionesEditar(client));
 
  
  

  return router; // Devolvemos el router que agrupa todas las rutas
};
