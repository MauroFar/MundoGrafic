export interface ListCotizacionesInput {
  busqueda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
  global?: boolean;
  userId?: number;
  userRol?: string;
}

export interface CotizacionQueryRepository {
  listCotizaciones(input: ListCotizacionesInput): Promise<any[]>;
  getCotizacionById(id: number): Promise<any | null>;
}
