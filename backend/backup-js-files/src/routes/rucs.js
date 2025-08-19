const express = require("express");
const router = express.Router();

// Definir la ruta de obtención de RUCs, pasando el cliente como parámetro
module.exports = function(client) {
  router.get("/", async (req, res) => {
    try {
      const result = await client.query(`
        SELECT rucs.id, rucs.ruc, rucs.descripcion
        FROM rucs
      `);
      console.log(result.rows); 
      res.json(result.rows);
    } catch (err) {
      console.error("Error al obtener los RUCs:", err);
      res.status(500).json({ error: "Error al obtener los datos" });
    }
  });

  return router;
};
