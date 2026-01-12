import express from "express";
const router = express.Router();
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";

const createCliente = (client: any) => {
  // Agregar un middleware de logging
  router.use((req: any, res: any, next: any) => {
    console.log(`[Clientes API] ${req.method} ${req.url}`);
    next();
  });

  // Ruta de prueba simple
  router.get("/test", (req: any, res: any) => {
    console.log('🧪 [Clientes API] Endpoint de prueba llamado');
    res.json({ message: "Endpoint de clientes funcionando", timestamp: new Date().toISOString() });
  });

  // ✅ Ruta para obtener todos los clientes
  router.get("/", authRequired(), checkPermission(client, 'clientes', 'leer'), async (req: any, res: any) => {
    try {
      console.log('🔍 [Clientes API] Iniciando consulta de clientes...');
      const query = `
        SELECT 
          c.id,
          c.codigo_cliente,
          c.nombre_cliente as nombre, 
          COALESCE(c.empresa_cliente, c.nombre_cliente) as empresa,
          c.email_cliente as email, 
          c.telefono_cliente as telefono,
          c.direccion_cliente as direccion,
          c.ruc_cedula_cliente as ruc_cedula,
          c.estado_cliente as estado,
          c.notas_cliente as notas,
          c.fecha_registro,
          c.created_at,
          c.created_by,
          c.updated_by,
          c.updated_at,
          u1.nombre as created_by_nombre,
          u2.nombre as updated_by_nombre
        FROM clientes c
        LEFT JOIN usuarios u1 ON c.created_by = u1.id
        LEFT JOIN usuarios u2 ON c.updated_by = u2.id
        ORDER BY c.id ASC
      `;
      const result = await client.query(query);
      
      // Formatear los datos para el frontend
      const clientesFormateados = result.rows.map((cliente: any) => ({
        id: cliente.id,
        codigo: cliente.codigo_cliente,
        nombre: cliente.nombre,
        empresa: cliente.empresa,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        ruc_cedula: cliente.ruc_cedula || 'N/A',
        estado: cliente.estado || 'activo',
        notas: cliente.notas || '',
        fechaRegistro: cliente.fecha_registro || cliente.created_at,
        createdBy: cliente.created_by_nombre || 'Sistema',
        createdAt: cliente.created_at || cliente.fecha_registro,
        updatedBy: cliente.updated_by_nombre || null,
        updatedAt: cliente.updated_at || null
      }));
      
      console.log(`✅ [Clientes API] Consulta exitosa. Encontrados ${clientesFormateados.length} clientes`);
      
      // Agregar headers CORS explícitos
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      res.json(clientesFormateados);
      console.log('📤 [Clientes API] Respuesta enviada exitosamente');
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al obtener clientes:', error);
      res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
    }
  });

  // Ruta para obtener un cliente por ID
  router.get("/:id", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      console.log(`🔍 [Clientes API] Obteniendo cliente con ID: ${id}`);
      const query = `
        SELECT 
          c.id,
          c.codigo_cliente,
          c.nombre_cliente as nombre, 
          COALESCE(c.empresa_cliente, c.nombre_cliente) as empresa,
          c.email_cliente as email, 
          c.telefono_cliente as telefono,
          c.direccion_cliente as direccion,
          c.ruc_cedula_cliente as ruc_cedula,
          c.estado_cliente as estado,
          c.notas_cliente as notas,
          c.fecha_registro,
          c.created_at,
          c.created_by,
          c.updated_by,
          c.updated_at,
          u1.nombre as created_by_nombre,
          u2.nombre as updated_by_nombre
        FROM clientes c
        LEFT JOIN usuarios u1 ON c.created_by = u1.id
        LEFT JOIN usuarios u2 ON c.updated_by = u2.id
        WHERE c.id = $1
      `;
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const cliente = result.rows[0];
      const clienteFormateado = {
        id: cliente.id,
        codigo: cliente.codigo_cliente,
        nombre: cliente.nombre,
        empresa: cliente.empresa,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        ruc_cedula: cliente.ruc_cedula || 'N/A',
        estado: cliente.estado || 'activo',
        notas: cliente.notas || '',
        fechaRegistro: cliente.fecha_registro || cliente.created_at,
        createdBy: cliente.created_by_nombre || 'Sistema',
        createdAt: cliente.created_at || cliente.fecha_registro,
        updatedBy: cliente.updated_by_nombre || null,
        updatedAt: cliente.updated_at || null
      };
      
      console.log('✅ [Clientes API] Cliente encontrado:', clienteFormateado);
      res.json(clienteFormateado);
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al obtener cliente:', error);
      res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
    }
  });

  // Ruta para buscar clientes
  router.get("/buscar", authRequired(), async (req: any, res: any) => {
    const { q } = req.query;
    console.log('🔍 [Clientes API] Búsqueda de clientes con término:', q);
    
    // Validar: al menos 2 caracteres y al menos una letra
    if (!q || q.trim().length < 2 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(q)) {
      console.log('⚠️ [Clientes API] Término de búsqueda no válido');
      return res.json([]); // No sugerencias si no cumple
    }
    
    try {
      const query = `
        SELECT 
          id, 
          nombre_cliente, 
          email_cliente,
          telefono_cliente as telefono
        FROM clientes
        WHERE 
          nombre_cliente ILIKE $1 
          OR email_cliente ILIKE $1
          OR empresa_cliente ILIKE $1
        ORDER BY nombre_cliente ASC
        LIMIT 10
      `;
      const result = await client.query(query, [`%${q}%`]);
      console.log(`✅ [Clientes API] Búsqueda exitosa. Encontrados ${result.rows.length} clientes`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al buscar clientes:', error);
      res.status(500).json({ error: 'Error al buscar clientes', details: error.message });
    }
  });

  // Ruta para crear un cliente
  router.post("/", authRequired(), checkPermission(client, 'clientes', 'crear'), async (req: any, res: any) => {
    const { nombre, empresa, direccion, telefono, email, ruc_cedula, estado, notas } = req.body;
    const userId = req.user?.id; // Usuario de la sesión
    
    // Validaciones
    if (!nombre || !empresa || !email || !telefono || !direccion || !ruc_cedula) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos',
        details: 'Nombre, empresa, email, teléfono, dirección y RUC/Cédula son obligatorios'
      });
    }

    try {
      console.log('📝 [Clientes API] Creando nuevo cliente:', { nombre, empresa, email, userId });
      
      // Verificar si el cliente ya existe por email o RUC/Cédula
      const checkQuery = `
        SELECT id FROM clientes 
        WHERE email_cliente = $1 OR ruc_cedula_cliente = $2
      `;
      const checkResult = await client.query(checkQuery, [email, ruc_cedula]);
      
      if (checkResult.rows.length > 0) {
        return res.status(409).json({ 
          error: 'El cliente ya existe',
          details: 'Ya existe un cliente con ese email o RUC/Cédula',
          clienteId: checkResult.rows[0].id 
        });
      }
      
      // Crear el cliente (sin codigo_cliente primero)
      const insertQuery = `
        INSERT INTO clientes (
          nombre_cliente, 
          empresa_cliente,
          direccion_cliente, 
          telefono_cliente, 
          email_cliente,
          ruc_cedula_cliente,
          estado_cliente,
          notas_cliente,
          fecha_registro,
          created_at,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
        RETURNING id
      `;
      
      const result = await client.query(insertQuery, [
        nombre, 
        empresa,
        direccion, 
        telefono, 
        email,
        ruc_cedula,
        estado || 'activo',
        notas || null,
        userId
      ]);
      
      const clienteId = result.rows[0].id;
      
      // Generar código basado en el ID
      const codigoCliente = `CL${String(clienteId).padStart(5, '0')}`;
      
      // Actualizar el código del cliente
      await client.query(
        'UPDATE clientes SET codigo_cliente = $1 WHERE id = $2',
        [codigoCliente, clienteId]
      );
      
      console.log('✅ [Clientes API] Cliente creado exitosamente:', { id: clienteId, codigo: codigoCliente });
      res.status(201).json({ 
        message: 'Cliente creado exitosamente',
        cliente: {
          id: clienteId,
          codigo_cliente: codigoCliente,
          nombre_cliente: nombre,
          email_cliente: email
        }
      });
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al crear cliente:', error);
      res.status(500).json({ 
        error: 'Error al crear cliente',
        details: error.message 
      });
    }
  });

  // Ruta para actualizar un cliente
  router.put("/:id", authRequired(), checkPermission(client, 'clientes', 'editar'), async (req: any, res: any) => {
    const { id } = req.params;
    const { nombre, empresa, direccion, telefono, email, ruc_cedula, estado, notas } = req.body;
    const userId = req.user?.id; // Usuario de la sesión
    
    // Validaciones
    if (!nombre || !empresa || !email || !telefono || !direccion || !ruc_cedula) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos',
        details: 'Nombre, empresa, email, teléfono, dirección y RUC/Cédula son obligatorios'
      });
    }

    try {
      console.log(`📝 [Clientes API] Actualizando cliente ID: ${id}, Usuario: ${userId}`);
      
      // Verificar si existe otro cliente con el mismo email o RUC/Cédula
      const checkQuery = `
        SELECT id FROM clientes 
        WHERE (email_cliente = $1 OR ruc_cedula_cliente = $2) AND id != $3
      `;
      const checkResult = await client.query(checkQuery, [email, ruc_cedula, id]);
      
      if (checkResult.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Conflicto de datos',
          details: 'Ya existe otro cliente con ese email o RUC/Cédula'
        });
      }
      
      // Actualizar el cliente
      const updateQuery = `
        UPDATE clientes 
        SET 
          nombre_cliente = $1,
          empresa_cliente = $2,
          direccion_cliente = $3,
          telefono_cliente = $4,
          email_cliente = $5,
          ruc_cedula_cliente = $6,
          estado_cliente = $7,
          notas_cliente = $8,
          updated_by = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING id, nombre_cliente, email_cliente
      `;
      
      const result = await client.query(updateQuery, [
        nombre,
        empresa,
        direccion,
        telefono,
        email,
        ruc_cedula,
        estado || 'activo',
        notas || null,
        userId,
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      console.log('✅ [Clientes API] Cliente actualizado exitosamente:', result.rows[0]);
      res.json({ 
        message: 'Cliente actualizado exitosamente',
        cliente: result.rows[0]
      });
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al actualizar cliente:', error);
      res.status(500).json({ 
        error: 'Error al actualizar cliente',
        details: error.message 
      });
    }
  });

  // Ruta para eliminar un cliente
  router.delete("/:id", authRequired(), checkPermission(client, 'clientes', 'eliminar'), async (req: any, res: any) => {
    const { id } = req.params;
    
    try {
      console.log(`🗑️ [Clientes API] Eliminando cliente ID: ${id}`);
      
      // Verificar si el cliente tiene cotizaciones u órdenes asociadas
      const checkQuery = `
        SELECT 
          (SELECT COUNT(*) FROM cotizaciones WHERE cliente_id = $1) as cotizaciones,
          (SELECT COUNT(*) FROM orden_trabajo ot 
           JOIN cotizaciones c ON ot.id_cotizacion = c.id 
           WHERE c.cliente_id = $1) as ordenes
      `;
      const checkResult = await client.query(checkQuery, [id]);
      
      const cotizaciones = parseInt(checkResult.rows[0].cotizaciones) || 0;
      const ordenes = parseInt(checkResult.rows[0].ordenes) || 0;
      
      if (cotizaciones > 0 || ordenes > 0) {
        return res.status(409).json({ 
          error: 'No se puede eliminar el cliente',
          message: 'El cliente tiene registros asociados',
          detalles: {
            cotizaciones,
            ordenes
          }
        });
      }
      
      // Eliminar el cliente
      const deleteQuery = `
        DELETE FROM clientes 
        WHERE id = $1
        RETURNING id, nombre_cliente
      `;
      
      const result = await client.query(deleteQuery, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      console.log('✅ [Clientes API] Cliente eliminado exitosamente:', result.rows[0]);
      res.json({ 
        message: 'Cliente eliminado exitosamente',
        cliente: result.rows[0]
      });
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al eliminar cliente:', error);
      res.status(500).json({ 
        error: 'Error al eliminar cliente',
        details: error.message 
      });
    }
  });

  return router;
};

export default createCliente;
