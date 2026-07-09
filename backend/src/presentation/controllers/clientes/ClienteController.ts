import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ListClientesUseCase } from "../../../application/use-cases/clientes/ListClientesUseCase";
import { SearchClientesUseCase } from "../../../application/use-cases/clientes/SearchClientesUseCase";
import { GetClienteByIdUseCase } from "../../../application/use-cases/clientes/GetClienteByIdUseCase";
import { CreateClienteUseCase } from "../../../application/use-cases/clientes/CreateClienteUseCase";
import { UpdateClienteUseCase } from "../../../application/use-cases/clientes/UpdateClienteUseCase";
import { DeleteClienteUseCase } from "../../../application/use-cases/clientes/DeleteClienteUseCase";

export class ClienteController {
  constructor(
    private readonly listClientesUseCase: ListClientesUseCase,
    private readonly searchClientesUseCase: SearchClientesUseCase,
    private readonly getClienteByIdUseCase: GetClienteByIdUseCase,
    private readonly createClienteUseCase: CreateClienteUseCase,
    private readonly updateClienteUseCase: UpdateClienteUseCase,
    private readonly deleteClienteUseCase: DeleteClienteUseCase,
  ) {}

  test = async (_req: Request, res: Response) => {
    return res.json({ message: "Endpoint de clientes funcionando", timestamp: new Date().toISOString() });
  };

  listar = async (_req: Request, res: Response) => {
    try {
      const clientes = await this.listClientesUseCase.execute();
      return res.json(clientes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al obtener clientes";
      return res.status(500).json({ error: "Error al obtener clientes", details: message });
    }
  };

  buscar = async (req: Request, res: Response) => {
    try {
      const clientes = await this.searchClientesUseCase.execute(String(req.query.q || ""));
      return res.json(clientes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al buscar clientes";
      return res.status(500).json({ error: "Error al buscar clientes", details: message });
    }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const cliente = await this.getClienteByIdUseCase.execute(id);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      return res.json(cliente);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error al obtener cliente";
      return res.status(500).json({ error: "Error al obtener cliente", details: message });
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const cliente = await this.createClienteUseCase.execute(req.body || {}, userId);
      return res.status(201).json({
        message: "Cliente creado exitosamente",
        cliente,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.statusCode === 409 ? "El cliente ya existe" : "Faltan campos requeridos",
          details: error.message,
        });
      }

      const message = error instanceof Error ? error.message : "Error al crear cliente";
      return res.status(500).json({ error: "Error al crear cliente", details: message });
    }
  };

  editar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const userId = (req as any).user?.id;
      const cliente = await this.updateClienteUseCase.execute(id, req.body || {}, userId);

      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      return res.json({
        message: "Cliente actualizado exitosamente",
        cliente,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.statusCode === 409 ? "Conflicto de datos" : "Faltan campos requeridos",
          details: error.message,
        });
      }

      const message = error instanceof Error ? error.message : "Error al actualizar cliente";
      return res.status(500).json({ error: "Error al actualizar cliente", details: message });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const cliente = await this.deleteClienteUseCase.execute(id);

      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      return res.json({
        message: "Cliente eliminado exitosamente",
        cliente,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.statusCode === 409 ? "No se puede eliminar el cliente" : error.message,
          details: error.message,
        });
      }

      const message = error instanceof Error ? error.message : "Error al eliminar cliente";
      return res.status(500).json({ error: "Error al eliminar cliente", details: message });
    }
  };
}
