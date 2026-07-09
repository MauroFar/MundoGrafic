import {
  ClienteBuscarItem,
  ClienteCreateInput,
  ClienteListado,
  ClienteUpdateInput,
} from "../../entities/clientes/Cliente";

export interface ClienteRepository {
  findAll(): Promise<ClienteListado[]>;
  search(query: string): Promise<ClienteBuscarItem[]>;
  findById(id: number): Promise<ClienteListado | null>;
  create(input: ClienteCreateInput): Promise<{ id: number; codigo_cliente: string; nombre_cliente: string; email_cliente: string | null }>;
  update(input: ClienteUpdateInput): Promise<{ id: number; nombre_cliente: string; email_cliente: string | null } | null>;
  delete(id: number): Promise<{ id: number; nombre_cliente: string } | null>;
  hasRelatedDocuments(id: number): Promise<boolean>;
}
