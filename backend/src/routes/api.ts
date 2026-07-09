// Importamos las rutas existentes
import express from "express";
import rucRoutes from "./rucs";
import { createClienteRoutes } from "../presentation/routes/clientes/clienteRoutes";
import { createCotizacionesModuleRoutes } from "../modules/produccion/cotizaciones/presentation/routes/cotizacionesModuleRoutes";
import reportesTrabajoRoutes from "./reportesTrabajo";
import ordenTrabajoRoutes from "./ordenTrabajo";
import { createOrdenesTrabajoModuleRoutes } from "../modules/produccion/ordenes-trabajo/presentation/routes/ordenTrabajoModuleRoutes";
import puppeteer from "puppeteer";
import uploadRoutes from "./upload-simple";
import chatRoutes from "./chat";
import permisosRoutes from "./permisos";
import prensasRoutes from "./prensas";
import certificadosRoutes from "./certificados";
import registrosOperarioRoutes from "./registrosOperario";
import listaPedidosRoutes from "./listaPedidos";

export default (client: any) => {
  const router = express.Router(); // Creamos un router para manejar todas las rutas

  console.log("🔧 [API Routes] Registrando rutas...");

  // Usamos las rutas importadas (TEMPORALMENTE COMENTADAS)
  router.use("/rucs", rucRoutes(client)); // /api/rucs
  console.log("✅ [API Routes] Ruta /rucs registrada");

  router.use("/clientes", createClienteRoutes(client)); // /api/clientes
  console.log("✅ [API Routes] Ruta /clientes registrada");
  router.use("/", createCotizacionesModuleRoutes(client)); // /api/cotizaciones*
  router.use("/ordenTrabajo", createOrdenesTrabajoModuleRoutes(client)); // /api/ordenTrabajo limpio
  router.use("/ordenTrabajo", ordenTrabajoRoutes(client)); // /api/ordenTrabajo legacy fallback
  router.use("/reportesTrabajo", reportesTrabajoRoutes(client)); // /api/reportesTrabajo
  router.use("/upload", uploadRoutes); // /api/upload
  router.use("/chat", chatRoutes(client)); // /api/chat
  router.use("/permisos", permisosRoutes(client)); // /api/permisos
  router.use("/prensas", prensasRoutes(client)); // /api/prensas
  console.log("✅ [API Routes] Ruta /prensas registrada");
  router.use("/certificados", certificadosRoutes(client)); // /api/certificados
  console.log("✅ [API Routes] Ruta /certificados registrada");
  router.use("/registros-operario", registrosOperarioRoutes(client)); // /api/registros-operario
  console.log("✅ [API Routes] Ruta /registros-operario registrada");
  router.use("/lista-pedidos", listaPedidosRoutes(client)); // /api/lista-pedidos
  console.log("✅ [API Routes] Ruta /lista-pedidos registrada");

  // Ruta de prueba simple
  router.get("/test", (req, res) => {
    res.json({ message: "API funcionando sin dependencias problemáticas" });
  });

  console.log("🎉 [API Routes] Todas las rutas registradas exitosamente");
  console.log("📋 [API Routes] Rutas disponibles:");
  console.log("   - /api/rucs");
  console.log("   - /api/clientes");
  console.log("   - /api/cotizaciones");
  console.log("   - /api/cotizacionesDetalles");
  console.log("   - /api/cotizacionesEditar");
  console.log("   - /api/ordenTrabajo");
  console.log("   - /api/reportesTrabajo");
  console.log("   - /api/upload");
  console.log("   - /api/chat");
  console.log("   - /api/permisos");
  console.log("   - /api/prensas");
  console.log("   - /api/registros-operario");
  console.log("   - /api/lista-pedidos");
  console.log("   - /api/test");

  return router; // Devolvemos el router que agrupa todas las rutas
};
