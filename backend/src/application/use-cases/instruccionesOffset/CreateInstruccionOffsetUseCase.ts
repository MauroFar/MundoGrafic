import { AppError } from '../../../shared/errors/AppError';
import { CategoriaInstruccionOffset } from '../../../domain/entities/instruccionesOffset/InstruccionOffset';
import { InstruccionOffsetRepository } from '../../../domain/repositories/instruccionesOffset/InstruccionOffsetRepository';

export class CreateInstruccionOffsetUseCase {
  constructor(private readonly repo: InstruccionOffsetRepository) {}

  async execute(categoria: CategoriaInstruccionOffset, nombreInput: unknown, descripcionInput: unknown) {
    const nombre = typeof nombreInput === 'string' ? nombreInput.trim() : '';
    const descripcionTexto = typeof descripcionInput === 'string' ? descripcionInput.trim() : '';
    const descripcion = descripcionTexto || null;

    if (!nombre) throw new AppError('El nombre de la plantilla es obligatorio', 400);
    if (nombre.length > 120) throw new AppError('El nombre no puede superar 120 caracteres', 400);
    if (descripcion && descripcion.length > 50000) {
      throw new AppError('La descripción no puede superar 50000 caracteres', 400);
    }
    if (await this.repo.existsByNombre(categoria, nombre)) {
      throw new AppError('Ya existe una plantilla con ese nombre', 409);
    }

    return this.repo.create(categoria, { nombre, descripcion });
  }
}
