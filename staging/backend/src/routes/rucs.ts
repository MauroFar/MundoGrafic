import express from "express";
const router = express.Router();

// Definir la ruta de obtención de RUCs, pasando el cliente como parámetro
export default function(client) {
  router.get("/", async (req: any, res: any) => {
    try {
      const result = await client.query(`
        SELECT rucs.id, rucs.ruc, rucs.descripcion
        FROM rucs
      `);
      console.log(result.rows); 
      res.json(result.rows);
    } catch (err: any) {
      console.error("Error al obtener los RUCs:", err);
      res.status(500).json({ error: "Error al obtener los datos" });
    }
  });

  return router;
};
