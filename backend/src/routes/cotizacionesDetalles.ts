import express from "express";
const router = express.Router();

const parseCantidadEntera = (valor: any) => {
  if (valor === null || valor === undefined || valor === '') return 0;

  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? Math.trunc(valor) : 0;
  }

  const texto = String(valor).trim();
  if (!texto) return 0;

  // Cantidad solo acepta enteros: removemos separadores y dejamos solo dígitos.
  const soloDigitos = texto.replace(/\D/g, '');
  if (!soloDigitos) return 0;

  const parsed = Number.parseInt(soloDigitos, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizarDimensionImagen = (valor: any, fallback: number) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return fallback;

  const entero = Math.round(numero);
  return entero > 0 ? entero : fallback;
};

const normalizarDecimal = (valor: any) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
};

const normalizarEscalas = (escalas: any[] = []) => {
  if (!Array.isArray(escalas)) return [];

  return escalas.map((escala, index) => {
    const cantidad = parseCantidadEntera(escala?.cantidad);
    const valorUnitario = normalizarDecimal(escala?.valor_unitario);
    const valorTotal = normalizarDecimal(escala?.valor_total);

    return {
      cantidad,
      valor_unitario: valorUnitario,
      valor_total: valorTotal || Number((cantidad * valorUnitario).toFixed(2)),
      orden: Number.isFinite(Number(escala?.orden)) ? Number(escala.orden) : index,
    };
  }).filter((escala) => escala.cantidad > 0 || escala.valor_unitario > 0 || escala.valor_total > 0);
};

const obtenerEscalasDetalle = async (client: any, detalleId: number) => {
  const escalasQuery = `
    SELECT id, detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden
    FROM detalle_cotizacion_escalas
    WHERE detalle_cotizacion_id = $1
    ORDER BY orden ASC, id ASC
  `;

  const escalasResult = await client.query(escalasQuery, [detalleId]);
  return escalasResult.rows;
};

const createCotizacionDetalles = (client: any) => {
  // Obtener detalles de una cotización por ID
  router.get("/:id", async (req: any, res: any) => {
    const { id } = req.params;
    try {
      // Obtener los detalles
      const query = `
        SELECT 
          id, 
          cotizacion_id, 
          cantidad, 
          detalle, 
          valor_unitario, 
          valor_total,
          usa_escalas,
          alineacion_imagenes,
          posicion_imagen,
          texto_negrita
        FROM detalle_cotizacion
        WHERE cotizacion_id = $1
        ORDER BY id ASC
      `;
      const result = await client.query(query, [id]);
      
      // Para cada detalle, obtener sus imágenes
      const detallesConImagenes = await Promise.all(
        result.rows.map(async (detalle) => {
          const imagenesQuery = `
            SELECT id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion
            FROM detalle_cotizacion_imagenes
            WHERE detalle_cotizacion_id = $1
            ORDER BY orden ASC
          `;
          const imagenesResult = await client.query(imagenesQuery, [detalle.id]);
          const escalas = await obtenerEscalasDetalle(client, detalle.id);
          
          return {
            ...detalle,
            imagenes: imagenesResult.rows,
            escalas
          };
        })
      );
      
      console.log("Detalles encontrados con imágenes:", detallesConImagenes); // Para debugging
      res.json(detallesConImagenes);
    } catch (error: any) {
      console.error("Error al obtener detalles de la cotización:", error);
      res.status(500).json({ error: "Error al obtener los detalles de la cotización" });
    }
  });

  // Ruta para crear detalles de cotización
  router.post("/", async (req: any, res: any) => {
    console.log("Recibiendo datos para crear detalle:", req.body);
    const { cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagenes, alineacion_imagenes, posicion_imagen, texto_negrita, usa_escalas, escalas } = req.body;
    const cantidadNormalizada = parseCantidadEntera(cantidad);
    const usaEscalas = Boolean(usa_escalas);
    const escalasNormalizadas = normalizarEscalas(escalas);

    if (!cotizacion_id || !detalle) {
      console.error("Validación fallida:", { cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usaEscalas });
      return res.status(400).json({ error: "Faltan datos requeridos o son inválidos" });
    }

    if (usaEscalas && escalasNormalizadas.length === 0) {
      return res.status(400).json({ error: "Debe agregar al menos una escala válida" });
    }

    if (!usaEscalas && (cantidad === undefined || cantidad === null || valor_unitario === undefined || valor_unitario === null || valor_total === undefined || valor_total === null)) {
      return res.status(400).json({ error: "Faltan datos requeridos para un detalle sin escalas" });
    }

    try {
      // Insertar el detalle sin imágenes (las columnas de imagen están deprecated)
      const query = `
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita
      `;
      
      const result = await client.query(query, [
        cotizacion_id,
        usaEscalas ? 0 : cantidadNormalizada,
        detalle,
        usaEscalas ? 0 : normalizarDecimal(valor_unitario),
        usaEscalas ? 0 : normalizarDecimal(valor_total),
        usaEscalas,
        alineacion_imagenes || 'horizontal',
        posicion_imagen || 'abajo',
        texto_negrita || false
      ]);

      const detalleId = result.rows[0].id;

      if (usaEscalas && escalasNormalizadas.length > 0) {
        const escalaQuery = `
          INSERT INTO detalle_cotizacion_escalas (detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden)
          VALUES ($1, $2, $3, $4, $5)
        `;

        for (const escala of escalasNormalizadas) {
          await client.query(escalaQuery, [
            detalleId,
            escala.cantidad,
            escala.valor_unitario,
            escala.valor_total,
            escala.orden,
          ]);
        }
      }

      // Si hay imágenes, insertarlas en la tabla de imágenes
      if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
        const imageQuery = `
          INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        for (let i = 0; i < imagenes.length; i++) {
          const img = imagenes[i];
          await client.query(imageQuery, [
            detalleId,
            img.imagen_ruta,
            i,
            normalizarDimensionImagen(img.imagen_width, 200),
            normalizarDimensionImagen(img.imagen_height, 150),
            Number.isFinite(Number(img.imagen_rotacion)) ? Number(img.imagen_rotacion) : 0
          ]);
        }
      }

      // Retornar el detalle con sus imágenes
      const imagenesQuery = `
        SELECT id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion
        FROM detalle_cotizacion_imagenes
        WHERE detalle_cotizacion_id = $1
        ORDER BY orden ASC
      `;
      const imagenesResult = await client.query(imagenesQuery, [detalleId]);
      const escalasDetalle = await obtenerEscalasDetalle(client, detalleId);

      res.json({
        ...result.rows[0],
        imagenes: imagenesResult.rows,
        escalas: escalasDetalle
      });
    } catch (error: any) {
      console.error("Error al insertar detalle de cotización:", error);
      res.status(500).json({ error: "Error al insertar detalle de cotización" });
    }
  });

  // Actualizar detalles de una cotización
  router.put("/:id", async (req: any, res: any) => {
    const { id } = req.params;
    const { detalles } = req.body;

    console.log("Detalles recibidos:", detalles); // Para debugging

    if (!detalles || !Array.isArray(detalles)) {
      return res.status(400).json({ error: "Se requiere un array de detalles válido" });
    }

    try {
      // Primero eliminamos los detalles existentes (esto también eliminará las imágenes por CASCADE)
      await client.query("DELETE FROM detalle_cotizacion WHERE cotizacion_id = $1", [id]);

      // Luego insertamos los nuevos detalles sin imágenes
      const query = `
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, usa_escalas, alineacion_imagenes, posicion_imagen, texto_negrita
      `;

      const resultadosDetalles = [];
      for (const detalle of detalles) {
        const { cantidad, detalle: descripcion, valor_unitario, valor_total, imagenes, alineacion_imagenes, posicion_imagen, texto_negrita, usa_escalas, escalas } = detalle;
        const cantidadNormalizada = parseCantidadEntera(cantidad);
        const usaEscalas = Boolean(usa_escalas);
        const escalasNormalizadas = normalizarEscalas(escalas);
        
        if (descripcion === undefined) {
          throw new Error("Falta la descripción del detalle");
        }

        if (usaEscalas && escalasNormalizadas.length === 0) {
          throw new Error("Cada detalle con escalas debe tener al menos una escala válida");
        }

        if (!usaEscalas && (cantidad === undefined || valor_unitario === undefined || valor_total === undefined)) {
          throw new Error("Faltan campos requeridos en los detalles");
        }

        const result = await client.query(query, [
          id,
          usaEscalas ? 0 : cantidadNormalizada,
          descripcion,
          usaEscalas ? 0 : normalizarDecimal(valor_unitario),
          usaEscalas ? 0 : normalizarDecimal(valor_total),
          usaEscalas,
          alineacion_imagenes || 'horizontal',
          posicion_imagen || 'abajo',
          texto_negrita || false
        ]);
        
        const detalleId = result.rows[0].id;

        if (usaEscalas && escalasNormalizadas.length > 0) {
          const escalaQuery = `
            INSERT INTO detalle_cotizacion_escalas (detalle_cotizacion_id, cantidad, valor_unitario, valor_total, orden)
            VALUES ($1, $2, $3, $4, $5)
          `;

          for (const escala of escalasNormalizadas) {
            await client.query(escalaQuery, [
              detalleId,
              escala.cantidad,
              escala.valor_unitario,
              escala.valor_total,
              escala.orden,
            ]);
          }
        }

        // Insertar las imágenes si existen
        if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
          const imageQuery = `
            INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
          
          for (let i = 0; i < imagenes.length; i++) {
            const img = imagenes[i];
            await client.query(imageQuery, [
              detalleId,
              img.imagen_ruta,
              i,
              normalizarDimensionImagen(img.imagen_width, 200),
              normalizarDimensionImagen(img.imagen_height, 150),
              Number.isFinite(Number(img.imagen_rotacion)) ? Number(img.imagen_rotacion) : 0
            ]);
          }
        }

        // Obtener las imágenes insertadas
        const imagenesQuery = `
          SELECT id, imagen_ruta, orden, imagen_width, imagen_height, imagen_rotacion
          FROM detalle_cotizacion_imagenes
          WHERE detalle_cotizacion_id = $1
          ORDER BY orden ASC
        `;
        const imagenesResult = await client.query(imagenesQuery, [detalleId]);
        const escalasDetalle = await obtenerEscalasDetalle(client, detalleId);

        resultadosDetalles.push({
          ...result.rows[0],
          imagenes: imagenesResult.rows,
          escalas: escalasDetalle
        });
      }

      res.json(resultadosDetalles);
    } catch (error: any) {
      console.error("Error al actualizar los detalles de la cotización:", error);
      res.status(500).json({ error: error.message || "Error al actualizar los detalles de la cotización" });
    }
  });

  return router;
};

export default createCotizacionDetalles;
