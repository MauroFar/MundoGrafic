const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Endpoint para enviar correo con PDF adjunto
router.post('/:id/enviar-correo', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, asunto, mensaje } = req.body;

    // Verificar que el correo fue proporcionado
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido'
      });
    }

    // Construir la ruta al archivo PDF
    const pdfFileName = `cotizacion-${id}.pdf`;
    const pdfPath = path.join(__dirname, '..', 'pdfs', pdfFileName);

    // Verificar si el archivo existe
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo PDF no existe'
      });
    }

    // Configurar el correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: asunto,
      text: mensaje,
      attachments: [{
        filename: pdfFileName,
        path: pdfPath
      }]
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    // Responder al cliente
    res.json({
      success: true,
      message: 'Correo enviado exitosamente'
    });

  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el correo: ' + error.message
    });
  }
});

module.exports = router; 