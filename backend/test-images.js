const fs = require('fs');
const path = require('path');

console.log('🧪 PRUEBA DE LECTURA DE IMÁGENES');
console.log('================================');

// Verificar que existe la carpeta storage/uploads
const storageDir = path.join(process.cwd(), 'storage');
const uploadsDir = path.join(storageDir, 'uploads');

console.log('📁 Directorio actual:', process.cwd());
console.log('📁 Storage:', storageDir);
console.log('📁 Uploads:', uploadsDir);

if (!fs.existsSync(storageDir)) {
  console.log('❌ No existe el directorio storage');
  process.exit(1);
}

if (!fs.existsSync(uploadsDir)) {
  console.log('❌ No existe el directorio uploads');
  process.exit(1);
}

// Listar archivos en uploads
console.log('\n📋 Archivos en uploads:');
try {
  const files = fs.readdirSync(uploadsDir);
  if (files.length === 0) {
    console.log('   (No hay archivos)');
  } else {
    files.forEach((file, index) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  }
} catch (error) {
  console.log('❌ Error al leer directorio:', error.message);
}

// Probar lectura de un archivo si existe
if (files && files.length > 0) {
  const testFile = files[0];
  const testFilePath = path.join(uploadsDir, testFile);
  
  console.log(`\n🧪 Probando lectura de: ${testFile}`);
  try {
    const buffer = fs.readFileSync(testFilePath);
    console.log(`✅ Archivo leído exitosamente`);
    console.log(`   Tamaño: ${buffer.length} bytes`);
    console.log(`   Base64: ${buffer.toString('base64').substring(0, 50)}...`);
    
    // Verificar que sea una imagen válida
    const extension = path.extname(testFile).toLowerCase();
    console.log(`   Extensión: ${extension}`);
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      console.log(`✅ Extensión de imagen válida`);
    } else {
      console.log(`⚠️  Extensión no reconocida como imagen`);
    }
    
  } catch (error) {
    console.log(`❌ Error al leer archivo:`, error.message);
  }
}

console.log('\n✅ Prueba completada');
