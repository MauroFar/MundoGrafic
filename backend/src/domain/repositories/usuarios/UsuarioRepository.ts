import { UsuarioResumen, UsuarioVendedor } from "../../entities/usuarios/Usuario";

export interface CreateUsuarioRepositoryInput {
  email: string;
  nombre_usuario: string;
  password_hash: string;
  nombre: string;
  apellido: string | null;
  rol: string;
  area_ids: number[];
  email_personal: string | null;
  email_config: string;
  celular: string | null;
}

export interface UsuarioCreado {
  id: number;
  email: string;
  nombre_usuario: string;
  nombre: string;
  apellido: string | null;
  rol: string;
  rol_id: number | null;
  area_id: number | null;
  activo: boolean;
  fecha_creacion: string;
  firma_html: string | null;
  firma_activa: boolean;
  email_personal: string | null;
  email_config: string | null;
  celular: string | null;
}

export interface UpdateUsuarioRepositoryInput {
  id: number;
  email: string;
  nombre_usuario: string;
  nombre: string;
  apellido: string | null;
  rol: string;
  area_ids: number[];
  activo: boolean;
  password_hash: string | null;
  email_personal: string | null;
  email_config: string;
  celular: string | null;
}

export interface FirmaUsuario {
  id: number;
  nombre: string;
  firma_html: string | null;
  firma_activa: boolean;
}

export interface UsuarioRepository {
  findAll(): Promise<UsuarioResumen[]>;
  findVendedores(): Promise<UsuarioVendedor[]>;
  createUser(input: CreateUsuarioRepositoryInput): Promise<UsuarioCreado>;
  updateUser(input: UpdateUsuarioRepositoryInput): Promise<UsuarioCreado | null>;
  deleteUser(id: number): Promise<boolean>;
  updateFirma(id: number, firma: { firma_html: string | null; firma_activa: boolean }): Promise<FirmaUsuario | null>;
  findFirmaById(id: number): Promise<FirmaUsuario | null>;
}
