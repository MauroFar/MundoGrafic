import {
  Certificado,
  Caracteristica,
  CertificadoCreateInput,
  CertificadoUpdateInput,
} from "../../entities/certificados/Certificado";

export interface CertificadoRepository {
  findAll(): Promise<Certificado[]>;
  findById(id: number): Promise<Certificado | null>;
  getNextNumber(): Promise<{ next_seq: number; numero_certificado: string }>;
  getCatalogoCar(): Promise<Caracteristica[]>;
  create(input: CertificadoCreateInput): Promise<{ id: number; numero_certificado: string | null }>;
  update(id: number, input: CertificadoUpdateInput): Promise<void>;
  delete(id: number): Promise<void>;
}
