import express from "express";
const router = express.Router();

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
            SELECT id, imagen_ruta, orden, imagen_width, imagen_height
            FROM detalle_cotizacion_imagenes
            WHERE detalle_cotizacion_id = $1
            ORDER BY orden ASC
          `;
          const imagenesResult = await client.query(imagenesQuery, [detalle.id]);
          
          return {
            ...detalle,
            imagenes: imagenesResult.rows
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
    const { cotizacion_id, cantidad, detalle, valor_unitario, valor_total, imagenes, alineacion_imagenes, posicion_imagen, texto_negrita } = req.body;

    if (!cotizacion_id || cantidad === undefined || cantidad === null || !detalle || valor_unitario === undefined || valor_unitario === null || valor_total === undefined || valor_total === null) {
      console.error("Validación fallida:", { cotizacion_id, cantidad, detalle, valor_unitario, valor_total });
      return res.status(400).json({ error: "Faltan datos requeridos o son inválidos" });
    }

    try {
      // Insertar el detalle sin imágenes (las columnas de imagen están deprecated)
      const query = `
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, alineacion_imagenes, posicion_imagen, texto_negrita)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, alineacion_imagenes, posicion_imagen, texto_negrita
      `;
      
      const result = await client.query(query, [
        cotizacion_id,
        cantidad,
        detalle,
        valor_unitario,
        valor_total,
        alineacion_imagenes || 'horizontal',
        posicion_imagen || 'abajo',
        texto_negrita || false
      ]);

      const detalleId = result.rows[0].id;

      // Si hay imágenes, insertarlas en la tabla de imágenes
      if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
        const imageQuery = `
          INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        for (let i = 0; i < imagenes.length; i++) {
          const img = imagenes[i];
          await client.query(imageQuery, [
            detalleId,
            img.imagen_ruta,
            i,
            img.imagen_width || 200,
            img.imagen_height || 150
          ]);
        }
      }

      // Retornar el detalle con sus imágenes
      const imagenesQuery = `
        SELECT id, imagen_ruta, orden, imagen_width, imagen_height
        FROM detalle_cotizacion_imagenes
        WHERE detalle_cotizacion_id = $1
        ORDER BY orden ASC
      `;
      const imagenesResult = await client.query(imagenesQuery, [detalleId]);

      res.json({
        ...result.rows[0],
        imagenes: imagenesResult.rows
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
        INSERT INTO detalle_cotizacion (cotizacion_id, cantidad, detalle, valor_unitario, valor_total, alineacion_imagenes, posicion_imagen, texto_negrita)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, cotizacion_id, cantidad, detalle, valor_unitario, valor_total, alineacion_imagenes, posicion_imagen, texto_negrita
      `;

      const resultadosDetalles = [];
      for (const detalle of detalles) {
        const { cantidad, detalle: descripcion, valor_unitario, valor_total, imagenes, alineacion_imagenes, posicion_imagen, texto_negrita } = detalle;
        
        // Validar que todos los campos requeridos estén presentes y sean válidos
        if (cantidad === undefined || descripcion === undefined || 
            valor_unitario === undefined || valor_total === undefined) {
          throw new Error("Faltan campos requeridos en los detalles");
        }

        const result = await client.query(query, [
          id,
          parseFloat(cantidad),
          descripcion,
          parseFloat(valor_unitario),
          parseFloat(valor_total),
          alineacion_imagenes || 'horizontal',
          posicion_imagen || 'abajo',
          texto_negrita || false
        ]);
        
        const detalleId = result.rows[0].id;

        // Insertar las imágenes si existen
        if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
          const imageQuery = `
            INSERT INTO detalle_cotizacion_imagenes (detalle_cotizacion_id, imagen_ruta, orden, imagen_width, imagen_height)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          for (let i = 0; i < imagenes.length; i++) {
            const img = imagenes[i];
            await client.query(imageQuery, [
              detalleId,
              img.imagen_ruta,
              i,
              img.imagen_width || 200,
              img.imagen_height || 150
            ]);
          }
        }

        // Obtener las imágenes insertadas
        const imagenesQuery = `
          SELECT id, imagen_ruta, orden, imagen_width, imagen_height
          FROM detalle_cotizacion_imagenes
          WHERE detalle_cotizacion_id = $1
          ORDER BY orden ASC
        `;
        const imagenesResult = await client.query(imagenesQuery, [detalleId]);

        resultadosDetalles.push({
          ...result.rows[0],
          imagenes: imagenesResult.rows
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
