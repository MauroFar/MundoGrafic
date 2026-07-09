import nodemailer from "nodemailer";
import { Client } from "pg";

export interface DestinatarioEmail {
  email: string;
  tipo: "to" | "cc" | "bcc";
  nombre?: string;
}

export interface SendCotizacionEmailInput {
  userId: number;
  defaultEmail: string;
  asunto?: string;
  mensaje?: string;
  nombrePDF: string;
  codigoCotizacion: string;
  destinatarios?: DestinatarioEmail[];
  pdfBuffer: Buffer;
}

export class CotizacionEmailService {
  constructor(private readonly client: Client) {}

  private async getSignature(userId: number) {
    let signatureHtml = "";

    try {
      const senderFirmaQuery = `
        SELECT id, nombre, firma_html, firma_activa
        FROM usuarios
        WHERE id = $1
      `;
      const senderFirmaResult = await this.client.query(senderFirmaQuery, [userId]);

      if (senderFirmaResult.rows.length > 0) {
        const sender = senderFirmaResult.rows[0];
        if (sender.firma_activa && sender.firma_html) {
          signatureHtml = sender.firma_html;
        }
      }
    } catch (_) {
      signatureHtml = "";
    }

    if (!signatureHtml) {
      signatureHtml = '<p style="margin-top: 20px;">Saludos cordiales</p>';
    }

    return signatureHtml;
  }

  private async getSenderCredentials(userId: number) {
    const senderQuery = `
      SELECT id, nombre, email_config, email_personal
      FROM usuarios
      WHERE id = $1
    `;
    const senderResult = await this.client.query(senderQuery, [userId]);

    if (senderResult.rows.length === 0) {
      throw new Error("No se encontró el usuario con sesión activa");
    }

    const sender = senderResult.rows[0];
    if (!sender.email_config) {
      throw new Error(`El usuario ${sender.nombre} no tiene configurado su email_config. Por favor contacte al administrador.`);
    }

    const emailConfig = String(sender.email_config).toUpperCase();
    const emailUser = process.env[`EMAIL_USER_${emailConfig}`];
    const emailPassword = process.env[`EMAIL_PASSWORD_${emailConfig}`];

    if (!emailUser || !emailPassword) {
      throw new Error(`No se encontraron credenciales de email para ${sender.nombre} (${emailConfig}). Por favor contacte al administrador.`);
    }

    return {
      emailUser,
      emailPassword,
    };
  }

  async sendCotizacionEmail(input: SendCotizacionEmailInput) {
    const signatureHtml = await this.getSignature(input.userId);
    const { emailUser, emailPassword } = await this.getSenderCredentials(input.userId);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    await transporter.verify();

    const toEmails: string[] = [];
    const ccEmails: string[] = [];
    const bccEmails: string[] = [];

    if (input.destinatarios && Array.isArray(input.destinatarios)) {
      input.destinatarios.forEach((dest) => {
        if (dest.tipo === "to") {
          toEmails.push(dest.email);
        } else if (dest.tipo === "cc") {
          ccEmails.push(dest.email);
        } else if (dest.tipo === "bcc") {
          bccEmails.push(dest.email);
        }
      });
    }

    if (toEmails.length === 0) {
      toEmails.push(input.defaultEmail);
    }

    const mailOptions: any = {
      from: emailUser,
      to: toEmails.join(", "),
      subject: input.asunto || `Cotización MUNDOGRAFIC ${input.codigoCotizacion}`,
      text: input.mensaje || "Adjunto encontrará la cotización solicitada.",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>${(input.mensaje || "Adjunto encontrará la cotización solicitada.").replace(/\n/g, "<br>")}</p>
          ${signatureHtml || ""}
        </div>
      `,
      attachments: [
        {
          filename: `${input.nombrePDF || `cotizacion_${input.codigoCotizacion}`}.pdf`,
          content: input.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    if (ccEmails.length > 0) {
      mailOptions.cc = ccEmails.join(", ");
    }

    if (bccEmails.length > 0) {
      mailOptions.bcc = bccEmails.join(", ");
    }

    await transporter.sendMail(mailOptions);
  }
}
