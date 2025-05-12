const puppeteer = require("puppeteer");

async function generatePDF(htmlContent) {
  try {
    console.log("Contenido HTML recibido en el backend:\n", htmlContent);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Escuchar mensajes de consola del navegador
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("error", (err) => console.log("PAGE ERROR:", err));

    // Establecer el contenido HTML
    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded", // Asegura que el DOM esté completamente cargado
    });

    // Esperar a que el <h1> esté presente en la página
    await page.waitForSelector("h1");

    console.log("Contenido HTML cargado correctamente.");

    // Generar el PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    // Verificar si el pdfBuffer tiene contenido válido
    console.log("PDF generado correctamente, tamaño del buffer:", pdfBuffer.length);

    // Asegurarse de que el buffer tenga un tamaño
    if (pdfBuffer.length === 0) {
      throw new Error("El buffer del PDF está vacío.");
    }

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("Error generando PDF:", error.message);
    throw new Error("Error generando PDF");
  }
}

module.exports = generatePDF;
