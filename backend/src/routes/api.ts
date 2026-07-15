import express from "express";
import { Client } from "pg";

// ── Módulos producción (arquitectura limpia propia) ───────────────────────────
import { createClienteRoutes }             from "../presentation/routes/clientes/clienteRoutes";
import { createCotizacionesModuleRoutes }  from "../modules/produccion/cotizaciones/presentation/routes/cotizacionesModuleRoutes";
import { createOrdenesTrabajoModuleRoutes } from "../modules/produccion/ordenes-trabajo/presentation/routes/ordenTrabajoModuleRoutes";

// ── Módulos globales de arquitectura limpia ───────────────────────────────────
import { createUsuarioRoutes }             from "../presentation/routes/usuarios/usuarioRoutes";
import { createAreaRoutes }                from "../presentation/routes/areas/areaRoutes";
import { createRolRoutes }                 from "../presentation/routes/roles/rolRoutes";
import { createFirmasRoutes }              from "../presentation/routes/firmas/firmasRoutes";

// ── Módulos migrados a arquitectura limpia ────────────────────────────────────
import { createRucRoutes }                from "../presentation/routes/rucs/rucRoutes";
import { createPrensaRoutes }             from "../presentation/routes/prensas/prensaRoutes";
import { createReporteTrabajoRoutes }     from "../presentation/routes/reportesTrabajo/reporteTrabajoRoutes";
import { createRegistroOperarioRoutes }   from "../presentation/routes/registrosOperario/registroOperarioRoutes";
import { createListaPedidoRoutes }        from "../presentation/routes/listaPedidos/listaPedidoRoutes";
import { createPermisoRoutes }            from "../presentation/routes/permisos/permisoRoutes";
import { createChatRoutes }               from "../presentation/routes/chat/chatRoutes";

// ── Utilidades (infraestructura / sin dominio) ────────────────────────────────
import { createCertificadoRoutes }        from "../presentation/routes/certificados/certificadoRoutes";
import uploadRoutes                        from "./upload-simple";

export default (client: Client) => {
  const router = express.Router();

  console.log("🔧 [API Routes] Registrando rutas...");

  // ── Autenticación y gestión de acceso ──────────────────────────────────────
  router.use("/usuarios", createUsuarioRoutes(client));
  router.use("/areas",    createAreaRoutes(client));
  router.use("/roles",    createRolRoutes(client));
  router.use("/firmas",   createFirmasRoutes(client));

  // ── Catálogos / referencia ──────────────────────────────────────────────────
  router.use("/rucs",    createRucRoutes(client));
  router.use("/prensas", createPrensaRoutes(client));

  // ── Clientes ────────────────────────────────────────────────────────────────
  router.use("/clientes", createClienteRoutes(client));

  // ── Producción ───────────────────────────────────────────────────────────────
  router.use("/",             createCotizacionesModuleRoutes(client));   // /api/cotizaciones*
  router.use("/ordenTrabajo", createOrdenesTrabajoModuleRoutes(client)); // /api/ordenTrabajo*

  // ── Reportes y operarios ────────────────────────────────────────────────────
  router.use("/reportesTrabajo",    createReporteTrabajoRoutes(client));
  router.use("/registros-operario", createRegistroOperarioRoutes(client));

  // ── Lista de pedidos ─────────────────────────────────────────────────────────
  router.use("/lista-pedidos", createListaPedidoRoutes(client));

  // ── Permisos ─────────────────────────────────────────────────────────────────
  router.use("/permisos", createPermisoRoutes(client));

  // ── Chat ─────────────────────────────────────────────────────────────────────
  router.use("/chat", createChatRoutes(client));

  // ── Utilidades (sin dominio) ─────────────────────────────────────────────────
  router.use("/upload",       uploadRoutes);           // multer — sin client
  router.use("/certificados", createCertificadoRoutes(client));

  // ── Test ─────────────────────────────────────────────────────────────────────
  router.get("/test", (_req, res: any) => {
    res.json({ message: "API funcionando correctamente" });
  });

  console.log("🎉 [API Routes] Rutas registradas:");
  console.log("   ✅ /api/usuarios");
  console.log("   ✅ /api/areas");
  console.log("   ✅ /api/roles");
  console.log("   ✅ /api/firmas");
  console.log("   ✅ /api/rucs");
  console.log("   ✅ /api/prensas");
  console.log("   ✅ /api/clientes");
  console.log("   ✅ /api/cotizaciones*");
  console.log("   ✅ /api/ordenTrabajo*");
  console.log("   ✅ /api/reportesTrabajo");
  console.log("   ✅ /api/registros-operario");
  console.log("   ✅ /api/lista-pedidos");
  console.log("   ✅ /api/permisos");
  console.log("   ✅ /api/chat");
  console.log("   ✅ /api/upload");
  console.log("   ✅ /api/certificados");

  return router;
};
