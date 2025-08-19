import express from "express";
const router = express.Router();
import authRequired from "../middleware/auth";

export default (client: any) => {
  // Listar todas las áreas (solo admin)
  router.get('/', authRequired(['admin']), async (req: any, res: any) => {
    const result = await client.query('SELECT id, nombre FROM areas');
    res.json(result.rows);
  });
  return router;
}; 