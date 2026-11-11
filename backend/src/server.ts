import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Client } from "pg";
import path from "path";
import fs from "fs";
import os from "os";

import authRoutes   from "./routes/auth";
import apiRoutes    from "./routes/api";
import authRequired from "./middleware/auth";

dotenv.config();

const app = express();
const maintenanceFlagFile = process.env.MAINTENANCE_FLAG_FILE || "/var/www/mundografic/maintenance.on";
const maintenanceHtmlFile = path.join(__dirname, "../public/maintenance.html");
const announcementClients = new Set<any>();
const announcementState: any = {
  active: false,
  title: "",
  message: "",
  startedAt: null,
  votes: { agree: 0, disagree: 0, total: 0 },
  comments: [],
  users: {},
};

const getAnnouncementSnapshot = () => ({
  active: Boolean(announcementState.active),
  title: announcementState.title || "Actualización programada",
  message: announcementState.message || "",
  startedAt: announcementState.startedAt,
  votes: {
    agree: announcementState.votes?.agree || 0,
    disagree: announcementState.votes?.disagree || 0,
    total: announcementState.votes?.total || 0,
  },
  comments: Array.isArray(announcementState.comments) ? announcementState.comments.slice(0, 8) : [],
  users: announcementState.users || {},
});

const broadcastAnnouncement = (eventType: string, payload: any) => {
  const message = `event: announcement\ndata: ${JSON.stringify({ type: eventType, ...payload })}\n\n`;
  for (const client of announcementClients) {
    try {
      client.write(message);
    } catch {
      // Ignorar clientes caídos.
    }
  }
};

const resetAnnouncement = () => {
  announcementState.active = false;
  announcementState.title = "";
  announcementState.message = "";
  announcementState.startedAt = null;
  announcementState.votes = { agree: 0, disagree: 0, total: 0 };
  announcementState.comments = [];
  announcementState.users = {};
};

// ── Logging ───────────────────────────────────────────────────────────────────
app.use((req: any, _res: any, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// ── Estado de mantenimiento (sin auth, sin cors global) ───────────────────────
app.get("/api/system/maintenance-status", cors(), (_req: any, res: any) => {
  res.json({
    maintenance: fs.existsSync(maintenanceFlagFile),
    timestamp: new Date().toISOString(),
  });
});

// ── Anuncios de actualización en vivo (SSE) ───────────────────────────────────
app.get("/api/system/announcement", cors(), (_req: any, res: any) => {
  res.json(getAnnouncementSnapshot());
});

app.get("/api/system/announcement/stream", cors(), (req: any, res: any) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  announcementClients.add(res);
  res.write(`event: announcement\ndata: ${JSON.stringify({ type: "snapshot", ...getAnnouncementSnapshot() })}\n\n`);

  req.on("close", () => {
    announcementClients.delete(res);
  });
});

app.post("/api/system/announcement", (req: any, res: any) => {
  const { title, message } = req.body || {};
  const titleText = String(title || "Actualización programada").trim();
  const messageText = String(message || "").trim();

  if (!messageText) {
    return res.status(400).json({ message: "El mensaje es obligatorio." });
  }

  announcementState.active = true;
  announcementState.title = titleText;
  announcementState.message = messageText;
  announcementState.startedAt = new Date().toISOString();
  announcementState.votes = { agree: 0, disagree: 0, total: 0 };
  announcementState.comments = [];
  announcementState.users = {};

  const payload = getAnnouncementSnapshot();
  broadcastAnnouncement("announcement", payload);
  return res.json({ ok: true, announcement: payload });
});

app.post("/api/system/announcement/clear", (_req: any, res: any) => {
  const payload = getAnnouncementSnapshot();
  resetAnnouncement();
  broadcastAnnouncement("clear", { active: false, title: "", message: "", startedAt: null, votes: { agree: 0, disagree: 0, total: 0 }, comments: [], users: {} });
  return res.json({ ok: true, announcement: payload, cleared: true });
});

app.post("/api/system/announcement/vote", (req: any, res: any) => {
  const { userId, vote, comment } = req.body || {};
  const normalizedVote = vote === "agree" || vote === "disagree" ? vote : null;

  if (!normalizedVote) {
    return res.status(400).json({ message: "La respuesta no es válida." });
  }

  if (!announcementState.active) {
    return res.status(409).json({ message: "No hay un aviso activo en este momento." });
  }

  const safeUserId = String(userId || req.ip || `guest-${Date.now()}`);
  const previousVote = announcementState.users[safeUserId];

  if (previousVote && previousVote !== normalizedVote) {
    announcementState.votes[previousVote] = Math.max(0, (announcementState.votes[previousVote] || 0) - 1);
  }

  announcementState.users[safeUserId] = normalizedVote;
  announcementState.votes[normalizedVote] = (announcementState.votes[normalizedVote] || 0) + 1;
  announcementState.votes.total = Object.keys(announcementState.users).length;

  if (normalizedVote === "disagree" && comment && String(comment).trim()) {
    const trimmedComment = String(comment).trim().slice(0, 300);
    announcementState.comments = [{
      userId: safeUserId,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    }, ...(announcementState.comments || [])].slice(0, 8);
  }

  const payload = getAnnouncementSnapshot();
  broadcastAnnouncement("announcement", payload);
  return res.json({ ok: true, announcement: payload, vote: normalizedVote });
});

// ── Middleware de mantenimiento ───────────────────────────────────────────────
app.use((req: any, res: any, next: any) => {
  if (req.path === "/api/system/maintenance-status") return next();
  if (req.path.startsWith("/api/system/announcement")) return next();
  if (!fs.existsSync(maintenanceFlagFile)) return next();

  if (req.path.startsWith("/api/")) {
    return res.status(503).json({ message: "Sistema en mantenimiento", status: "maintenance" });
  }
  return res.status(503).sendFile(maintenanceHtmlFile, (err: any) => {
    if (err) res.status(503).send("Sistema en mantenimiento. Intenta nuevamente en unos minutos.");
  });
});

app.use(express.static(path.join(__dirname, "../public")));
app.use("/storage", express.static(path.join(__dirname, "../storage")));
app.use("/uploads", express.static(path.join(__dirname, "../storage/uploads")));

// ── PostgreSQL ────────────────────────────────────────────────────────────────
const client = new Client({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || "5432"),
});

client
  .connect()
  .then(() => {
    console.log("📌 Conectado a PostgreSQL");
    return client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'clientes'
      );
    `);
  })
  .then((result) => {
    if (!result.rows[0].exists) {
      return client.query(`
        CREATE TABLE IF NOT EXISTS clientes (
          id SERIAL PRIMARY KEY,
          nombre_cliente VARCHAR(255) NOT NULL,
          ruc_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ruc_id) REFERENCES rucs(id)
        );
      `);
    }
  })
  .catch((err) => {
    console.error("Error de conexión o inicialización:", err);
    process.exit(1);
  });

// ── Rutas de autenticación ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes(client));

// ── Guard legacy (mantener compatibilidad con frontend existente) ─────────────
app.use("/api/ordenes-trabajo", authRequired(["admin", "ejecutivo", "impresion"]));

// ── API principal (todas las rutas bajo /api) ─────────────────────────────────
console.log("🚀 [Server] Registrando rutas API...");
app.use("/api", apiRoutes(client));
console.log("✅ [Server] Rutas API registradas exitosamente");

// ── Test directo ──────────────────────────────────────────────────────────────
app.get("/api/clientes/direct", (_req, res: any) => {
  res.json({ message: "Endpoint directo funcionando", timestamp: new Date().toISOString() });
});

// ── IP local ──────────────────────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const ips: { name: string; address: string; netmask: string }[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push({ name, address: iface.address, netmask: iface.netmask });
      }
    }
  }
  return ips;
}

// ── Arranque ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  const ips = getLocalIP();
  console.log("🚀 SERVIDOR INICIADO");
  console.log("================================");
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  if (ips.length > 0) {
    console.log("🌍 Red local:");
    ips.forEach((ip, i) => console.log(`   ${i + 1}. http://${ip.address}:${PORT} (${ip.name})`));
  } else {
    console.log("⚠️  No se detectaron IPs de red local");
  }
  console.log("================================");
  console.log("📌 Conectado a PostgreSQL");
});
