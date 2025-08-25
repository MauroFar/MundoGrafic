#!/usr/bin/env node

// Script para verificar las rutas registradas en el servidor
// Uso: node check-routes.js

console.log('🔍 Verificando rutas del servidor...');

// Verificar que el archivo compilado existe
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'backend/dist/server.js');
console.log('📁 Archivo compilado:', distPath);

if (fs.existsSync(distPath)) {
  console.log('✅ Archivo compilado encontrado');
  
  // Leer el archivo compilado
  const content = fs.readFileSync(distPath, 'utf8');
  
  // Buscar patrones que indiquen que las rutas están registradas
  if (content.includes('cotizacionesRoutes')) {
    console.log('✅ cotizacionesRoutes encontrado en el archivo compilado');
  } else {
    console.log('❌ cotizacionesRoutes NO encontrado en el archivo compilado');
  }
  
  if (content.includes('/api/cotizaciones')) {
    console.log('✅ /api/cotizaciones encontrado en el archivo compilado');
  } else {
    console.log('❌ /api/cotizaciones NO encontrado en el archivo compilado');
  }
  
} else {
  console.log('❌ Archivo compilado NO encontrado');
}

console.log('\n🔧 Verificando archivo TypeScript original...');
const tsPath = path.join(__dirname, 'backend/src/server.ts');

if (fs.existsSync(tsPath)) {
  console.log('✅ Archivo TypeScript encontrado');
  
  const content = fs.readFileSync(tsPath, 'utf8');
  
  if (content.includes('import cotizacionesRoutes')) {
    console.log('✅ Importación de cotizacionesRoutes encontrada');
  } else {
    console.log('❌ Importación de cotizacionesRoutes NO encontrada');
  }
  
  if (content.includes('app.use("/api/cotizaciones"')) {
    console.log('✅ Registro de rutas de cotizaciones encontrado');
  } else {
    console.log('❌ Registro de rutas de cotizaciones NO encontrado');
  }
  
} else {
  console.log('❌ Archivo TypeScript NO encontrado');
}

console.log('\n📋 Solución:');
console.log('1. Recompilar el backend: cd backend && npm run build');
console.log('2. Reiniciar el servicio: sudo systemctl restart myapp-backend');
console.log('3. Verificar logs: sudo journalctl -u myapp-backend -f');
