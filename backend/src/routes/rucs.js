const express = require("express");
const router = express.Router();
const { Client } = require("pg");

require("dotenv").config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect();

// Obtener todos los RUCs y sus ejecutivos asociados
router.get("/", async (req, res) => {
  try {
    const result = await client.query(`
      SELECT rucs.id, rucs.ruc, rucs.descripcion, ejecutivos.nombre AS ejecutivo
      FROM rucs
      LEFT JOIN ejecutivos ON rucs.ejecutivo_id = ejecutivos.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

module.exports = router;
