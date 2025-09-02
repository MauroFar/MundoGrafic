import dotenv from "dotenv";
// import express from "express";  // TEMPORALMENTE COMENTADO
// import cors from "cors";  // TEMPORALMENTE COMENTADO
import { Client } from "pg";
// import path from "path";  // TEMPORALMENTE COMENTADO
// import authRoutes from "./routes/auth";  // TEMPORALMENTE COMENTADO
// import apiRoutes from "./routes/api";  // TEMPORALMENTE COMENTADO
// import authRequired from "./middleware/auth";  // TEMPORALMENTE COMENTADO
// import usuariosRoutes from './routes/usuarios';  // TEMPORALMENTE COMENTADO
// import areasRoutes from './routes/areas';  // TEMPORALMENTE COMENTADO
// import cotizacionesRoutes from './routes/cotizaciones';  // TEMPORALMENTE COMENTADO
// import os from 'os';  // TEMPORALMENTE COMENTADO

dotenv.config();

// const app = express();  // TEMPORALMENTE COMENTADO

// Middleware para logging (TEMPORALMENTE COMENTADO)
// app.use((req: any, res: any, next: any) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   next();
// });

// app.use(cors());  // TEMPORALMENTE COMENTADO
// app.use(express.json());  // TEMPORALMENTE COMENTADO
// app.use(express.static(path.join(__dirname, '../public')));  // TEMPORALMENTE COMENTADO


// Servir archivos estáticos desde la carpeta storage (TEMPORALMENTE COMENTADO)
// app.use('/storage', express.static(path.join(__dirname, '../storage')));  // TEMPORALMENTE COMENTADO
// app.use('/uploads', express.static(path.join(__dirname, '../storage/uploads')));  // TEMPORALMENTE COMENTADO

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

// Rutas de autenticación (TEMPORALMENTE COMENTADO)
// app.use("/api/auth", authRoutes(client));

// Rutas de cotizaciones (TEMPORALMENTE COMENTADO)
// app.use("/api/cotizaciones", cotizacionesRoutes(client));

// Rutas protegidas por rol (TEMPORALMENTE COMENTADO)
// app.use("/api/ordenes-trabajo", authRequired(["admin", "ejecutivo", "impresion"]));

// Importar las rutas agrupadas en api.js (TEMPORALMENTE COMENTADO)
// app.use("/api", apiRoutes(client));

// Rutas de usuarios (TEMPORALMENTE COMENTADO)
// app.use('/api/usuarios', usuariosRoutes(client));

// Rutas de áreas (TEMPORALMENTE COMENTADO)
// app.use('/api/areas', areasRoutes(client));

// Rutas de firmas (TEMPORALMENTE COMENTADO)
// import firmasRouter from './routes/firmas';
// app.use('/api/firmas', firmasRouter);

// function getLocalIP() {  // TEMPORALMENTE COMENTADO
//   const interfaces = os.networkInterfaces();
//   const ips = [];
  
//   for (const name of Object.keys(interfaces)) {
//     for (const iface of interfaces[name] || []) {
//       if (iface.family === 'IPv4' && !iface.internal) {
//         ips.push({
//           name: name,
//           address: iface.address,
//           netmask: iface.netmask
//         });
//       }
//     }
//   }
//   return ips;
// }

// Puerto
const PORT = process.env.PORT || 3002;

// app.listen(PORT, () => {  // TEMPORALMENTE COMENTADO
//   const ips = getLocalIP();
//   const localIP = ips.length > 0 ? ips[0].address : 'localhost';
  
//   console.log('🚀 SERVIDOR INICIADO');
//   console.log('================================');
//   console.log(`📍 Puerto: ${PORT}`);
//   console.log(`🌐 Local: http://localhost:${PORT}`);
  
//   if (ips.length > 0) {
//     console.log('🌍 Red local:');
//     ips.forEach((ip, index) => {
//       console.log(`   ${index + 1}. http://${ip.address}:${PORT} (${ip.name})`);
//     });
//   } else {
//     console.log('⚠️  No se detectaron IPs de red local');
//     console.log('📱 Frontend debe usar: http://localhost:${PORT}');
//     }
  
//   console.log('================================');
//   console.log('📌 Conectado a PostgreSQL');
// });

// TEMPORALMENTE: Solo probar la conexión a la base de datos
console.log('🔍 PROBANDO SOLO CONEXIÓN A BASE DE DATOS...');
console.log(`📍 Puerto configurado: ${PORT}`);
console.log('📌 Intentando conectar a PostgreSQL...');
 