// Importamos las rutas existentes
import express from "express";
import rucRoutes from "./rucs";
import clientesRoutes from "./clientes";
import cotizacionRoutes from "./cotizaciones";
import cotizacionDetRoutes from "./cotizacionesDetalles";
import cotizacionesEditar from "./cotizacionesEditar";
import reportesTrabajoRoutes from "./reportesTrabajo";
import ordenTrabajoRoutes from "./ordenTrabajo";
import puppeteer from "puppeteer";
import uploadRoutes from "./upload-simple";
import chatRoutes from "./chat";
import permisosRoutes from "./permisos";
import prensasRoutes from "./prensas";

export default (client: any) => {
  const router = express.Router(); // Creamos un router para manejar todas las rutas
  
  console.log('🔧 [API Routes] Registrando rutas...');
    
  // Usamos las rutas importadas (TEMPORALMENTE COMENTADAS)
  router.use("/rucs", rucRoutes(client)); // /api/rucs
  console.log('✅ [API Routes] Ruta /rucs registrada');
  
  router.use("/clientes", clientesRoutes(client)); // /api/clientes
  console.log('✅ [API Routes] Ruta /clientes registrada');
  router.use("/cotizaciones", cotizacionRoutes(client)); // /api/cotizaciones
  router.use("/cotizacionesDetalles", cotizacionDetRoutes(client)); // /api/cotizacionesDetalles
  router.use("/cotizacionesEditar", cotizacionesEditar(client));
  router.use("/ordenTrabajo", ordenTrabajoRoutes(client)); // /api/ordenTrabajo
  router.use("/reportesTrabajo", reportesTrabajoRoutes(client)); // /api/reportesTrabajo
  router.use("/upload", uploadRoutes); // /api/upload
  router.use("/chat", chatRoutes(client)); // /api/chat
  router.use("/permisos", permisosRoutes(client)); // /api/permisos
  router.use("/prensas", prensasRoutes(client)); // /api/prensas
  console.log('✅ [API Routes] Ruta /prensas registrada');

  // Ruta de prueba simple
  router.get("/test", (req, res) => {
    res.json({ message: "API funcionando sin dependencias problemáticas" });
  });

  console.log('🎉 [API Routes] Todas las rutas registradas exitosamente');
  console.log('📋 [API Routes] Rutas disponibles:');
  console.log('   - /api/rucs');
  console.log('   - /api/clientes');
  console.log('   - /api/cotizaciones');
  console.log('   - /api/cotizacionesDetalles');
  console.log('   - /api/cotizacionesEditar');
  console.log('   - /api/ordenTrabajo');
  console.log('   - /api/reportesTrabajo');
  console.log('   - /api/upload');
  console.log('   - /api/chat');
  console.log('   - /api/permisos');
  console.log('   - /api/prensas');
  console.log('   - /api/test');

  return router; // Devolvemos el router que agrupa todas las rutas
};
