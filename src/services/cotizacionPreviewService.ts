import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3002";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface EscalaPreview {
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  orden: number;
}

export interface ImagenPreview {
  imagen_ruta: string;
  orden: number;
  imagen_width: number;
  imagen_height: number;
  imagen_rotacion: number;
}

export interface DetallePreview {
  cantidad: number;
  detalle: string;
  valor_unitario: number;
  valor_total: number;
  usa_escalas: boolean;
  escalas: EscalaPreview[];
  alineacion_imagenes: "horizontal" | "vertical";
  posicion_imagen: "abajo" | "arriba" | "izquierda" | "derecha";
  texto_negrita: boolean;
  imagenes: ImagenPreview[];
}

export interface CotizacionPreview {
  codigo_cotizacion?: string;
  fecha?: string;
  nombre_cliente?: string;
  contacto?: string | null;
  celuar?: string | null;
  ruc?: string;
  subtotal?: number;
  iva?: number;
  descuento?: number;
  total?: number;
  tiempo_entrega?: string;
  forma_pago?: string;
  validez_proforma?: string;
  observaciones?: string;
  nombre_ejecutivo?: string;
}

// ── Servicio principal ────────────────────────────────────────────────────────

/**
 * Genera la vista previa del PDF de una cotización.
 * Si se proporciona `cotizacionId`, los datos se cargan desde el backend.
 */
export const generarVistaPreviaPDF = async (
  cotizacionId: number | null,
  cotizacionData: CotizacionPreview,
  detallesData: DetallePreview[],
): Promise<string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay sesión activa");

  let cotizacion: CotizacionPreview = cotizacionData;
  let detalles: DetallePreview[] = detallesData;

  if (cotizacionId) {
    // Cabecera
    const respCot = await fetch(`${apiUrl}/api/cotizacionesEditar/${cotizacionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!respCot.ok) throw new Error("No se pudo obtener la cotización");
    const cotData = await respCot.json();

    // Detalles
    const respDet = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!respDet.ok) throw new Error("No se pudieron obtener los detalles");
    const detData = await respDet.json();

    cotizacion = {
      codigo_cotizacion: cotData.codigo_cotizacion,
      fecha: cotData.fecha,
      nombre_cliente: cotData.empresa_cliente ?? cotData.nombre_cliente,
      contacto: cotData.contacto ?? null,
      celuar: cotData.celuar ?? null,
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

    detalles = Array.isArray(detData)
      ? detData.map(
          (d): DetallePreview => ({
            cantidad: d.cantidad,
            detalle: d.detalle,
            valor_unitario: d.valor_unitario,
            valor_total: d.valor_total,
            usa_escalas: d.usa_escalas ?? false,
            escalas: Array.isArray(d.escalas)
              ? d.escalas.map(
                  (e: EscalaPreview): EscalaPreview => ({
                    cantidad: e.cantidad,
                    valor_unitario: e.valor_unitario,
                    valor_total: e.valor_total,
                    orden: e.orden ?? 0,
                  }),
                )
              : [],
            alineacion_imagenes: d.alineacion_imagenes ?? "horizontal",
            posicion_imagen: d.posicion_imagen ?? "abajo",
            texto_negrita: d.texto_negrita ?? false,
            imagenes: Array.isArray(d.imagenes)
              ? d.imagenes.map(
                  (img: ImagenPreview): ImagenPreview => ({
                    imagen_ruta: img.imagen_ruta,
                    orden: img.orden ?? 0,
                    imagen_width: img.imagen_width ?? 200,
                    imagen_height: img.imagen_height ?? 150,
                    imagen_rotacion: img.imagen_rotacion ?? 0,
                  }),
                )
              : [],
          }),
        )
      : [];
  }

  const respPrev = await fetch(`${apiUrl}/api/cotizaciones/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cotizacion, detalles }),
  });

  if (!respPrev.ok) {
    const errData = await respPrev.json().catch(() => ({}));
    throw new Error((errData as { error?: string }).error ?? "Error al generar la vista previa");
  }

  const dataPrev = await respPrev.json();
  if (!dataPrev.success || !dataPrev.pdf) {
    throw new Error("Respuesta inválida al generar vista previa");
  }

  return dataPrev.pdf as string;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseCotizacionPreviewReturn {
  showPreview: boolean;
  previewLoading: boolean;
  previewUrl: string | null;
  generarPreview: (
    cotizacionId: number | null,
    cotizacionData: CotizacionPreview,
    detallesData: DetallePreview[],
  ) => Promise<void>;
  cerrarPreview: () => void;
}

export const useCotizacionPreview = (): UseCotizacionPreviewReturn => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generarPreview = async (
    cotizacionId: number | null,
    cotizacionData: CotizacionPreview,
    detallesData: DetallePreview[],
  ): Promise<void> => {
    setPreviewUrl(null);
    setShowPreview(true);
    setPreviewLoading(true);
    try {
      const pdf = await generarVistaPreviaPDF(cotizacionId, cotizacionData, detallesData);
      setPreviewUrl(pdf);
    } catch (error) {
      setShowPreview(false);
      throw error;
    } finally {
      setPreviewLoading(false);
    }
  };

  const cerrarPreview = (): void => {
    setShowPreview(false);
    setPreviewUrl(null);
  };

  return { showPreview, previewLoading, previewUrl, generarPreview, cerrarPreview };
};
