import express, { Request, Response } from "express";

export default (client: any) => {
  const router = express.Router();

  // ... existing code ...

  // En cada handler, tipar (req: Request, res: Response)
  // Ejemplo:
  // router.get("/datosCotizacion/:id", async (req: Request, res: Response) => {
  // ...

  // ... existing code ...

  return router;
}; 