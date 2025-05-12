require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client } = require("pg");
const generatePDF = require("./routes/pdfGenerator"); // Asegúrate de que la ruta esté correcta

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

// Agregar un endpoint de prueba para generar PDF
app.get("/api/test-pdf", async (req, res) => {
  try {
    // HTML de prueba para generar el PDF
    const testHtmlContent = `
      <html>
        <head><title>Prueba PDF</title></head>
        <body>
          <h1>Contenido de prueba para PDF</h1>
          <p>Este es un PDF de prueba generado manualmente.</p>
        </body>
      </html>
    `;

    // Generar el PDF
    const pdfBuffer = await generatePDF(testHtmlContent);

    // Verificar el tamaño del buffer antes de enviarlo
    console.log("Tamaño del buffer de PDF:", pdfBuffer.length);

    // Establecer cabeceras para la descarga del archivo PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=test.pdf");

    // Enviar el PDF al cliente
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generando el PDF:", error.message);
    res.status(500).send("Error al generar el PDF");
  }
});


// Importar las rutas agrupadas en api.js
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes(client)); // Usamos /api como prefijo para todas las rutas

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
