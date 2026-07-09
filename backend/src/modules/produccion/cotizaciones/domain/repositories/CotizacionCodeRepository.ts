export interface CotizacionCodeRepository {
  getNextCotizacionCode(): Promise<string>;
}
