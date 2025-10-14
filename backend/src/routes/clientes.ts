import express from "express";
const router = express.Router();
import authRequired from "../middleware/auth";

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
  router.get("/", authRequired(), async (req: any, res: any) => {
    try {
      console.log('🔍 [Clientes API] Iniciando consulta de clientes...');
      const query = `
        SELECT id, nombre_cliente, email_cliente, telefono_cliente
        FROM clientes
        ORDER BY nombre_cliente ASC
      `;
      const result = await client.query(query);
      console.log(`✅ [Clientes API] Consulta exitosa. Encontrados ${result.rows.length} clientes`);
      console.log('📋 [Clientes API] Datos:', result.rows);
      
      // Agregar headers CORS explícitos
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      res.json(result.rows);
      console.log('📤 [Clientes API] Respuesta enviada exitosamente');
    } catch (error: any) {
      console.error('❌ [Clientes API] Error al obtener clientes:', error);
      res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
    }
  });

  // Ruta para buscar clientes
  router.get("/buscar", authRequired(), async (req: any, res: any) => {
    const { q } = req.query;
    // Validar: al menos 2 caracteres y al menos una letra
    if (!q || q.trim().length < 2 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(q)) {
      return res.json([]); // No sugerencias si no cumple
    }
    try {
      const query = `
        SELECT id, nombre_cliente, email_cliente
        FROM clientes
        WHERE nombre_cliente ILIKE $1 OR email_cliente ILIKE $1
        ORDER BY nombre_cliente ASC
        LIMIT 10
      `;
      const result = await client.query(query, [`%${q}%`]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al buscar clientes', details: error.message });
    }
  });

  // Ruta para crear un cliente
  router.post("/", authRequired(), async (req: any, res: any) => {
    const { nombre, direccion, telefono, email } = req.body;
    try {
      // Verificar si el cliente ya existe
      const checkQuery = `
        SELECT id FROM clientes 
        WHERE nombre_cliente = $1
      `;
      const checkResult = await client.query(checkQuery, [nombre]);
      if (checkResult.rows.length > 0) {
        // Si el cliente ya existe, devolver su ID
        return res.json({ clienteId: checkResult.rows[0].id });
      }
      // Si el cliente no existe, crearlo con los datos adicionales
      const insertQuery = `
        INSERT INTO clientes (nombre_cliente, direccion_cliente, telefono_cliente, email_cliente)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const result = await client.query(insertQuery, [nombre, direccion, telefono, email]);
      res.json({ clienteId: result.rows[0].id });
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      res.status(500).json({ 
        error: 'Error al crear cliente',
        details: error.message 
      });
    }
  });

  return router;
};

export default createCliente;
