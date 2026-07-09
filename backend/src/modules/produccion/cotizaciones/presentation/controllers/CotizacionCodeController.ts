import { Request, Response } from "express";
import { GetNextCotizacionCodeUseCase } from "../../application/use-cases/GetNextCotizacionCodeUseCase";

export class CotizacionCodeController {
  constructor(private readonly getNextCotizacionCodeUseCase: GetNextCotizacionCodeUseCase) {}

  getNextCode = async (_req: Request, res: Response) => {
    const codigo = await this.getNextCotizacionCodeUseCase.execute();
    return res.json({ codigo_cotizacion: codigo });
  };
}
