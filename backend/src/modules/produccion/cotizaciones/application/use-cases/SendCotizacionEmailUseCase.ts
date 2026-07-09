import { generarHTMLCotizacion, generarPDF } from "../../../../../routes/cotizaciones-helpers";
import { CotizacionDocumentDataService } from "../../infrastructure/services/CotizacionDocumentDataService";
import { CotizacionEmailService, DestinatarioEmail } from "../../infrastructure/services/CotizacionEmailService";

export interface SendCotizacionEmailCommand {
  cotizacionId: number;
  userId: number;
  email: string;
  asunto?: string;
  mensaje?: string;
  nombrePDF?: string;
  destinatarios?: DestinatarioEmail[];
}

export class SendCotizacionEmailUseCase {
  constructor(
    private readonly cotizacionDocumentDataService: CotizacionDocumentDataService,
    private readonly cotizacionEmailService: CotizacionEmailService,
  ) {}

  async execute(command: SendCotizacionEmailCommand) {
    const data = await this.cotizacionDocumentDataService.getCotizacionDocumentData(command.cotizacionId);
    if (!data) {
      return { type: "not_found" as const };
    }

    const html = await generarHTMLCotizacion(data.cotizacion, data.detalles);
    const pdfBuffer = await generarPDF(html);

    await this.cotizacionEmailService.sendCotizacionEmail({
      userId: command.userId,
      defaultEmail: command.email,
      asunto: command.asunto,
      mensaje: command.mensaje,
      nombrePDF: command.nombrePDF || "",
      codigoCotizacion: data.cotizacion.codigo_cotizacion,
      destinatarios: command.destinatarios,
      pdfBuffer,
    });

    return { type: "ok" as const };
  }
}
