import { Request, Response } from "express";
import { GenerateCotizacionPdfUseCase } from "../../application/use-cases/GenerateCotizacionPdfUseCase";
import { SendCotizacionEmailUseCase } from "../../application/use-cases/SendCotizacionEmailUseCase";
import { PreviewCotizacionPdfUseCase } from "../../application/use-cases/PreviewCotizacionPdfUseCase";

export class CotizacionDocumentController {
  constructor(
    private readonly generateCotizacionPdfUseCase: GenerateCotizacionPdfUseCase,
    private readonly sendCotizacionEmailUseCase: SendCotizacionEmailUseCase,
    private readonly previewCotizacionPdfUseCase: PreviewCotizacionPdfUseCase,
  ) {}

  generarPdf = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const result = await this.generateCotizacionPdfUseCase.execute(id);
      if (result.type === "not_found") {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=cotizacion-${result.cotizacion.codigo_cotizacion}.pdf`);
      return res.send(result.pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ error: `Error al generar el PDF: ${error?.message || "desconocido"}` });
    }
  };

  enviarCorreo = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: "ID de cotización inválido" });
      }

      const { email, asunto, mensaje, nombrePDF, destinatarios } = req.body as any;
      if (!email) {
        return res.status(400).json({ success: false, message: "El correo electrónico es requerido" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = String(email)
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const invalidEmails = emails.filter((e) => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Los siguientes correos electrónicos no tienen formato válido: ${invalidEmails.join(", ")}`,
        });
      }

      const result = await this.sendCotizacionEmailUseCase.execute({
        cotizacionId: id,
        userId: (req as any).user?.id,
        email,
        asunto,
        mensaje,
        nombrePDF,
        destinatarios,
      });

      if (result.type === "not_found") {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      return res.json({
        success: true,
        message: "Correo enviado exitosamente",
      });
    } catch (error: any) {
      if (error?.code === "EAUTH") {
        return res.status(500).json({
          success: false,
          message: "Error de autenticación del servidor de correo. Verifique las credenciales.",
        });
      }

      if (error?.code === "ESOCKET") {
        return res.status(500).json({
          success: false,
          message: "Error de conexión con el servidor de correo.",
        });
      }

      return res.status(500).json({
        success: false,
        message: `Error al enviar el correo: ${error?.message || "desconocido"}`,
      });
    }
  };

  previewPdf = async (req: Request, res: Response) => {
    try {
      const { cotizacion, detalles } = req.body as any;
      const base64PDF = await this.previewCotizacionPdfUseCase.execute(cotizacion, detalles);
      return res.json({
        success: true,
        pdf: `data:application/pdf;base64,${base64PDF}`,
      });
    } catch (error: any) {
      console.error("[PREVIEW PDF ERROR]", error);
      return res.status(500).json({
        success: false,
        error: "Error al generar la vista previa del PDF",
      });
    }
  };
}
