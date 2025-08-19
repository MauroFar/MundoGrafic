const fs = require('fs');
const path = require('path');

// Crear directorio storage/uploads si no existe
const storageDir = path.join(__dirname, 'storage');
const uploadsDir = path.join(storageDir, 'uploads');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir);
  console.log('✅ Directorio storage creado');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('✅ Directorio uploads creado');
}

console.log('✅ Estructura de directorios verificada');
console.log('📁 Storage:', storageDir);
console.log('📁 Uploads:', uploadsDir);
