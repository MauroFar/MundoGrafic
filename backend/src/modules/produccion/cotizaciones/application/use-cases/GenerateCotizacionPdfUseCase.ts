import { generarHTMLCotizacion, generarPDF } from "../../../../../routes/cotizaciones-helpers";
import { CotizacionDocumentDataService } from "../../infrastructure/services/CotizacionDocumentDataService";

export class GenerateCotizacionPdfUseCase {
  constructor(private readonly cotizacionDocumentDataService: CotizacionDocumentDataService) {}

  async execute(id: number) {
    const data = await this.cotizacionDocumentDataService.getCotizacionDocumentData(id);
    if (!data) {
      return { type: "not_found" as const };
    }

    const html = await generarHTMLCotizacion(data.cotizacion, data.detalles);
    const pdfBuffer = await generarPDF(html);

    return {
      type: "ok" as const,
      cotizacion: data.cotizacion,
      pdfBuffer,
    };
  }
}
