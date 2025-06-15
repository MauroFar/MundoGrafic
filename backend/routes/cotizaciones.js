const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar la conexión al iniciar
transporter.verify(function(error, success) {
  if (error) {
    console.log('Error en la configuración del correo:', error);
  } else {
    console.log('Servidor de correo listo para enviar mensajes');
  }
});

// Ruta para enviar correo con PDF adjunto
router.post('/:id/enviar-correo', async (req, res) => {
  try {
    const { id } = req.params;
    const { to, subject, message } = req.body;

    // Validar los datos requeridos
    if (!to || !subject || !message) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: correo destino, asunto o mensaje' 
      });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ 
        message: 'El formato del correo electrónico no es válido' 
      });
    }

    // Obtener la cotización
    const cotizacion = await pool.query(
      'SELECT * FROM cotizaciones WHERE id = $1',
      [id]
    );

    if (cotizacion.rows.length === 0) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Crear directorio temp si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Generar el PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(tempDir, `cotizacion-${id}.pdf`);
    doc.pipe(fs.createWriteStream(pdfPath));

    // Agregar contenido al PDF
    doc.fontSize(25).text('Cotización MUNDOGRAFIC', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Número: ${cotizacion.rows[0].numero_cotizacion}`);
    doc.text(`Cliente: ${cotizacion.rows[0].nombre_cliente}`);
    doc.text(`Fecha: ${new Date(cotizacion.rows[0].fecha).toLocaleDateString()}`);
    // ... agregar más detalles de la cotización ...

    doc.end();

    // Esperar a que el PDF se genere
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    // Enviar el correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: message,
      attachments: [{
        filename: `Cotizacion-${cotizacion.rows[0].numero_cotizacion}.pdf`,
        path: pdfPath
      }]
    };

    await transporter.sendMail(mailOptions);

    // Eliminar el archivo PDF temporal
    fs.unlinkSync(pdfPath);

    res.json({ message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    
    // Manejar errores específicos
    if (error.code === 'EAUTH') {
      return res.status(500).json({ 
        message: 'Error de autenticación del servidor de correo. Verifique las credenciales.' 
      });
    }
    
    if (error.code === 'ESOCKET') {
      return res.status(500).json({ 
        message: 'Error de conexión con el servidor de correo.' 
      });
    }

    res.status(500).json({ 
      message: 'Error al enviar el correo: ' + error.message 
    });
  }
});

module.exports = router; 