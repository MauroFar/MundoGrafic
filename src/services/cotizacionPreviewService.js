// Servicio centralizado para manejar la vista previa de cotizaciones
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3002";

/**
 * Genera la vista previa del PDF de una cotización
 * @param {number|null} cotizacionId - ID de la cotización (null si es nueva)
 * @param {Object} cotizacionData - Datos de la cotización
 * @param {Array} detallesData - Array de detalles de la cotización
 * @returns {Promise<string>} - URL del PDF en base64
 */
export const generarVistaPreviaPDF = async (cotizacionId, cotizacionData, detallesData) => {
  try {
    console.log("🔍 Generando vista previa PDF...");
    console.log("   Cotización ID:", cotizacionId || "Nueva");
    console.log("   Datos cotización:", cotizacionData);
    console.log("   Detalles:", detallesData);

    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("No hay sesión activa");
    }

    // Si hay ID de cotización, cargar datos del backend
    let cotizacion = cotizacionData;
    let detalles = detallesData;

    if (cotizacionId) {
      console.log("📡 Cargando datos existentes de cotización ID:", cotizacionId);

      // Obtener cabecera de la cotización
      const respCot = await fetch(`${apiUrl}/api/cotizacionesEditar/${cotizacionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!respCot.ok) {
        throw new Error('No se pudo obtener la cotización');
      }
      
      const cotData = await respCot.json();
      console.log("✅ Datos de cotización obtenidos:", cotData);

      // Obtener detalles
      const respDet = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!respDet.ok) {
        throw new Error('No se pudieron obtener los detalles');
      }
      
      const detData = await respDet.json();
      console.log("✅ Detalles obtenidos:", detData);

      // Formatear datos para el preview
      cotizacion = {
        codigo_cotizacion: cotData.codigo_cotizacion,
        fecha: cotData.fecha,
        nombre_cliente: cotData.empresa_cliente || cotData.nombre_cliente,
        contacto: cotData.contacto || null,
        celuar: cotData.celuar || null,
        ruc: cotData.ruc,
        subtotal: cotData.subtotal,
        iva: cotData.iva,
        descuento: cotData.descuento,
        total: cotData.total,
        tiempo_entrega: cotData.tiempo_entrega,
        forma_pago: cotData.forma_pago,
        validez_proforma: cotData.validez_proforma,
        observaciones: cotData.observaciones,
        nombre_ejecutivo: cotData.nombre_ejecutivo,
      };

      detalles = Array.isArray(detData) ? detData.map((d) => ({
        cantidad: d.cantidad,
        detalle: d.detalle,
        valor_unitario: d.valor_unitario,
        valor_total: d.valor_total,
        alineacion_imagenes: d.alineacion_imagenes || 'horizontal',
        posicion_imagen: d.posicion_imagen || 'abajo',
        texto_negrita: d.texto_negrita || false,
        imagenes: (d.imagenes && Array.isArray(d.imagenes)) 
          ? d.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              orden: img.orden || 0,
              imagen_width: img.imagen_width || 200,
              imagen_height: img.imagen_height || 150
            }))
          : []
      })) : [];
    }

    console.log("📤 Enviando datos al backend para preview:");
    console.log("   Cotización:", cotizacion);
    console.log("   Detalles:", JSON.stringify(detalles, null, 2));

    // Generar vista previa
    console.log("📡 Solicitando generación de PDF...");
    const respPrev = await fetch(`${apiUrl}/api/cotizaciones/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cotizacion, detalles }),
    });

    if (!respPrev.ok) {
      const errData = await respPrev.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al generar la vista previa');
    }

    const dataPrev = await respPrev.json();
    console.log("✅ Respuesta de vista previa:", dataPrev);

    if (!dataPrev.success || !dataPrev.pdf) {
      throw new Error('Respuesta inválida al generar vista previa');
    }

    console.log("🎉 Vista previa generada exitosamente");
    return dataPrev.pdf;

  } catch (error) {
    console.error('❌ Error en generarVistaPreviaPDF:', error);
    throw error;
  }
};

/**
 * Hook personalizado para manejar la vista previa de cotizaciones
 * @returns {Object} - Objeto con funciones y estados para la vista previa
 */
export const useCotizacionPreview = () => {
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState(null);

  const generarPreview = async (cotizacionId, cotizacionData, detallesData) => {
    try {
      setPreviewUrl(null);
      setShowPreview(true);
      setPreviewLoading(true);

      const pdfUrl = await generarVistaPreviaPDF(cotizacionId, cotizacionData, detallesData);
      setPreviewUrl(pdfUrl);
      
    } catch (error) {
      console.error('Error al generar preview:', error);
      setShowPreview(false);
      throw error;
    } finally {
      setPreviewLoading(false);
    }
  };

  const cerrarPreview = () => {
    setShowPreview(false);
    setPreviewUrl(null);
  };

  return {
    showPreview,
    previewLoading,
    previewUrl,
    generarPreview,
    cerrarPreview,
  };
};
