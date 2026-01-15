import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Client } from "pg";
import path from "path";
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import authRequired from "./middleware/auth";
import usuariosRoutes from './routes/usuarios';
import areasRoutes from './routes/areas';
import cotizacionesRoutes from './routes/cotizaciones';
import os from 'os';

dotenv.config();

const app = express();

// Middleware para logging
app.use((req: any, res: any, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Servir archivos estáticos desde la carpeta storage
app.use('/storage', express.static(path.join(__dirname, '../storage')));
app.use('/uploads', express.static(path.join(__dirname, '../storage/uploads')));

// Conectar con PostgreSQL
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Verificar la conexión a la base de datos
client.connect()
  .then(() => {
    console.log("📌 Conectado a PostgreSQL");
    
    // Verificar la existencia de las tablas necesarias
    return client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clientes'
      );
    `);
  })
  .then(result => {
    if (!result.rows[0].exists) {
      console.log("Creando tabla clientes...");
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
  .catch(err => {
    console.error("Error de conexión o inicialización:", err);
    process.exit(1);
  });

// Rutas de autenticación
app.use("/api/auth", authRoutes(client));

// Rutas de cotizaciones
app.use("/api/cotizaciones", cotizacionesRoutes(client));

// Rutas protegidas por rol
app.use("/api/ordenes-trabajo", authRequired(["admin", "ejecutivo", "impresion"]));

// Importar las rutas agrupadas en api.js
console.log('🚀 [Server] Registrando rutas API...');
app.use("/api", apiRoutes(client));
console.log('✅ [Server] Rutas API registradas exitosamente');

// Endpoint de prueba directo para clientes
app.get('/api/clientes/direct', (req, res) => {
  console.log('🧪 [Direct Test] Endpoint directo de clientes llamado');
  res.json({ message: 'Endpoint directo funcionando', timestamp: new Date().toISOString() });
});

// Rutas de usuarios
app.use('/api/usuarios', usuariosRoutes(client));

// Rutas de áreas
app.use('/api/areas', areasRoutes(client));

// Rutas de prensas
import prensasRoutes from './routes/prensas';
app.use('/api/prensas', prensasRoutes(client));

// Rutas de firmas
import firmasRouter from './routes/firmas';
app.use('/api/firmas', firmasRouter);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          name: name,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    }
  }
  return ips;
}

// Puerto
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  const ips = getLocalIP();
  const localIP = ips.length > 0 ? ips[0].address : 'localhost';
  
  console.log('🚀 SERVIDOR INICIADO');
  console.log('================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  
  if (ips.length > 0) {
    console.log('🌍 Red local:');
    ips.forEach((ip, index) => {
      console.log(`   ${index + 1}. http://${ip.address}:${PORT} (${ip.name})`);
    });
  } else {
    console.log('⚠️  No se detectaron IPs de red local');
    console.log('📱 Frontend debe usar: http://localhost:${PORT}');
    }
  
  console.log('================================');
  console.log('📌 Conectado a PostgreSQL');
});
 