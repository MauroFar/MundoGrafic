export interface UsuarioResumen {
  id: number;
  email: string;
  nombre_usuario: string | null;
  nombre: string;
  apellido: string | null;
  rol: string;
  area_id: number | null;
  activo: boolean;
  fecha_creacion: string;
  firma_html: string | null;
  firma_activa: boolean;
  email_personal: string | null;
  email_config: string | null;
  celular: string | null;
  area_ids: number[];
}

export interface UsuarioVendedor {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string;
  celular: string | null;
}
