require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    console.log("🔌 Conectando a PostgreSQL...");
    await client.connect();
    console.log("✅ Conectado a PostgreSQL");

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, "src", "db", "migrations", "20250101_fix_cotizaciones_table_structure.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📋 Ejecutando migración para corregir estructura de tabla cotizaciones...");
    
    // Ejecutar la migración
    await client.query(migrationSQL);
    
    console.log("✅ Migración ejecutada exitosamente");
    
    // Verificar que la estructura esté correcta
    console.log("🔍 Verificando estructura de tabla cotizaciones...");
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'cotizaciones'
      ORDER BY ordinal_position;
    `);
    
    console.log("📊 Estructura actual de la tabla cotizaciones:");
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    // Verificar la secuencia
    console.log("🔍 Verificando secuencia numero_cotizacion...");
    const seqResult = await client.query(`
      SELECT last_value, increment_by 
      FROM cotizaciones_numero_cotizacion_seq;
    `);
    
    if (seqResult.rows.length > 0) {
      console.log(`✅ Secuencia encontrada - último valor: ${seqResult.rows[0].last_value}, incremento: ${seqResult.rows[0].increment_by}`);
    } else {
      console.log("❌ Secuencia no encontrada");
    }
    
  } catch (error) {
    console.error("❌ Error ejecutando migración:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
