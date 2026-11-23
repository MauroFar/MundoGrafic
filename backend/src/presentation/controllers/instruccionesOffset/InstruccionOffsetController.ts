import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CategoriaInstruccionOffset } from '../../../domain/entities/instruccionesOffset/InstruccionOffset';
import { CreateInstruccionOffsetUseCase } from '../../../application/use-cases/instruccionesOffset/CreateInstruccionOffsetUseCase';
import { ListInstruccionesOffsetUseCase } from '../../../application/use-cases/instruccionesOffset/ListInstruccionesOffsetUseCase';

const CATEGORIAS: readonly CategoriaInstruccionOffset[] = ['impresion', 'acabados', 'empacado'];

export class InstruccionOffsetController {
  constructor(
    private readonly listUseCase: ListInstruccionesOffsetUseCase,
    private readonly createUseCase: CreateInstruccionOffsetUseCase,
  ) {}

  listar = async (req: Request, res: Response) => {
    const categoria = this.obtenerCategoria(req.params.categoria);
    if (!categoria) return res.status(400).json({ error: 'Categoría de instrucciones inválida' });

    try {
      return res.json(await this.listUseCase.execute(categoria));
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  crear = async (req: Request, res: Response) => {
    const categoria = this.obtenerCategoria(req.params.categoria);
    if (!categoria) return res.status(400).json({ error: 'Categoría de instrucciones inválida' });

    try {
      const { nombre, descripcion } = req.body ?? {};
      const creada = await this.createUseCase.execute(categoria, nombre, descripcion);
      return res.status(201).json(creada);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  private obtenerCategoria(valor: string): CategoriaInstruccionOffset | null {
    return CATEGORIAS.includes(valor as CategoriaInstruccionOffset)
      ? valor as CategoriaInstruccionOffset
      : null;
  }

  private handleError(res: Response, error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una plantilla con ese nombre' });
    }

    const message = error instanceof Error ? error.message : 'Error interno';
    return res.status(500).json({ error: message });
  }
}
