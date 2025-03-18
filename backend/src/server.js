require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client } = require("pg");

// Conectar con PostgreSQL
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect()
  .then(() => console.log("📌 Conectado a PostgreSQL"))
  .catch(err => console.error("Error de conexión:", err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
const rucRoutes = require("./routes/rucs");
app.use("/api/rucs", rucRoutes(client)); // Pasamos el cliente como argumento
const cotizacionRoutes = require("./routes/cotizaciones");
app.use("/api/cotizaciones", cotizacionRoutes(client));

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = client;  // Exportamos el cliente para usarlo en otras rutas si es necesario
