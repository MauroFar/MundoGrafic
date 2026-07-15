import { generarHTMLCotizacion, generarPDF } from "../../infrastructure/services/CotizacionPdfService";

export class PreviewCotizacionPdfUseCase {
  async execute(cotizacion: any, detalles: any[]) {
    const html = await generarHTMLCotizacion(cotizacion, detalles);
    const pdfBuffer = await generarPDF(html);
    return pdfBuffer.toString("base64");
  }
}
