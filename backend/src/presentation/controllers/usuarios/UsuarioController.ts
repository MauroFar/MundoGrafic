import { Request, Response } from "express";
import { ListUsuariosUseCase } from "../../../application/use-cases/usuarios/ListUsuariosUseCase";
import { ListVendedoresUseCase } from "../../../application/use-cases/usuarios/ListVendedoresUseCase";
import { CreateUsuarioUseCase } from "../../../application/use-cases/usuarios/CreateUsuarioUseCase";
import { UpdateUsuarioUseCase } from "../../../application/use-cases/usuarios/UpdateUsuarioUseCase";
import { DeleteUsuarioUseCase } from "../../../application/use-cases/usuarios/DeleteUsuarioUseCase";
import { GetUsuarioFirmaUseCase } from "../../../application/use-cases/usuarios/GetUsuarioFirmaUseCase";
import { UpdateUsuarioFirmaUseCase } from "../../../application/use-cases/usuarios/UpdateUsuarioFirmaUseCase";
import { AppError } from "../../../shared/errors/AppError";

export class UsuarioController {
  constructor(
    private readonly listUsuariosUseCase: ListUsuariosUseCase,
    private readonly listVendedoresUseCase: ListVendedoresUseCase,
    private readonly createUsuarioUseCase: CreateUsuarioUseCase,
    private readonly updateUsuarioUseCase: UpdateUsuarioUseCase,
    private readonly deleteUsuarioUseCase: DeleteUsuarioUseCase,
    private readonly getUsuarioFirmaUseCase: GetUsuarioFirmaUseCase,
    private readonly updateUsuarioFirmaUseCase: UpdateUsuarioFirmaUseCase,
  ) {}

  listar = async (_req: Request, res: Response) => {
    try {
      const usuarios = await this.listUsuariosUseCase.execute();
      return res.json(usuarios);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error listando usuarios";
      return res.status(500).json({ error: message });
    }
  };

  listarVendedores = async (_req: Request, res: Response) => {
    try {
      const vendedores = await this.listVendedoresUseCase.execute();
      return res.json(vendedores);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error listando vendedores";
      return res.status(500).json({ error: message });
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const usuario = await this.createUsuarioUseCase.execute(req.body || {});
      return res.json(usuario);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error creando usuario";
      return res.status(400).json({ error: message });
    }
  };

  editar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const usuario = await this.updateUsuarioUseCase.execute(id, req.body || {});
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.json(usuario);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error editando usuario";
      return res.status(400).json({ error: message });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      await this.deleteUsuarioUseCase.execute(id);
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error eliminando usuario";
      return res.status(400).json({ error: message });
    }
  };

  obtenerFirma = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const firma = await this.getUsuarioFirmaUseCase.execute(id);
      if (!firma) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.json(firma);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error obteniendo firma de usuario";
      return res.status(400).json({ error: message });
    }
  };

  actualizarFirma = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const firma = await this.updateUsuarioFirmaUseCase.execute(id, req.body || {});
      if (!firma) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.json(firma);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error actualizando firma de usuario";
      return res.status(400).json({ error: message });
    }
  };
}
