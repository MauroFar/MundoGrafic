require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initDatabase() {
  try {
    console.log("🔌 Conectando a PostgreSQL...");
    await client.connect();
    console.log("✅ Conectado a PostgreSQL");

    // Crear tabla rucs primero (si no existe)
    console.log("📋 Creando tabla rucs...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS rucs (
        id SERIAL PRIMARY KEY,
        ruc VARCHAR(20) UNIQUE NOT NULL,
        razon_social VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear tabla clientes
    console.log("📋 Creando tabla clientes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre_cliente VARCHAR(255) NOT NULL,
        ruc_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ruc_id) REFERENCES rucs(id)
      );
    `);

    // Crear tabla usuarios
    console.log("📋 Creando tabla usuarios...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'usuario',
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear tabla areas
    console.log("📋 Creando tabla areas...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear tabla cotizaciones
    console.log("📋 Creando tabla cotizaciones...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS cotizaciones (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    // Crear tabla ordenes_trabajo
    console.log("📋 Creando tabla ordenes_trabajo...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ordenes_trabajo (
        id SERIAL PRIMARY KEY,
        cotizacion_id INTEGER,
        cliente_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        estado VARCHAR(50) DEFAULT 'pendiente',
        fecha_inicio DATE,
        fecha_fin DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    // Insertar datos de ejemplo si las tablas están vacías
    console.log("📝 Verificando datos de ejemplo...");
    
    // Verificar si hay usuarios
    const usuariosCount = await client.query("SELECT COUNT(*) FROM usuarios");
    if (usuariosCount.rows[0].count === '0') {
      console.log("👤 Creando usuario administrador...");
      await client.query(`
        INSERT INTO usuarios (nombre, email, password, rol) 
        VALUES ('Administrador', 'admin@mundografic.com', '$2a$10$rQZ8K9vX2mN3pL4qR5sT6u', 'admin')
      `);
    }

    // Verificar si hay áreas
    const areasCount = await client.query("SELECT COUNT(*) FROM areas");
    if (areasCount.rows[0].count === '0') {
      console.log("🏢 Creando áreas por defecto...");
      await client.query(`
        INSERT INTO areas (nombre, descripcion) VALUES 
        ('Impresión', 'Área de impresión digital y offset'),
        ('Diseño', 'Área de diseño gráfico'),
        ('Acabados', 'Área de acabados y post-producción')
      `);
    }

    console.log("✅ Base de datos inicializada correctamente");
    
  } catch (error) {
    console.error("❌ Error inicializando la base de datos:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
