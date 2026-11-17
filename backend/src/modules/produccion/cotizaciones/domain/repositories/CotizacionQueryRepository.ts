export interface ListCotizacionesInput {
  busqueda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
  offset?: number;
  tipo?: string;
  userId?: number;
  userRol?: string;
}

export interface CotizacionQueryRepository {
  listCotizaciones(input: ListCotizacionesInput): Promise<any[]>;
  getCotizacionById(id: number): Promise<any | null>;
}
