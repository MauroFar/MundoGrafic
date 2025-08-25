#!/usr/bin/env node

// Script para diagnosticar las rutas del servidor
// Uso: node debug-routes.js

const express = require('express');
const path = require('path');

console.log('🔍 Diagnóstico de rutas del servidor');
console.log('=====================================');

// Verificar que el archivo server.ts existe
const serverPath = path.join(__dirname, 'backend/src/server.ts');
console.log('📁 Archivo server.ts:', serverPath);

try {
  const fs = require('fs');
  if (fs.existsSync(serverPath)) {
    console.log('✅ Archivo server.ts encontrado');
    
    // Leer el contenido del archivo
    const content = fs.readFileSync(serverPath, 'utf8');
    
    // Verificar importaciones
    if (content.includes('cotizacionesRoutes')) {
      console.log('✅ Importación de cotizacionesRoutes encontrada');
    } else {
      console.log('❌ Importación de cotizacionesRoutes NO encontrada');
    }
    
    if (content.includes('app.use("/api/cotizaciones"')) {
      console.log('✅ Registro de rutas de cotizaciones encontrado');
    } else {
      console.log('❌ Registro de rutas de cotizaciones NO encontrado');
    }
    
    // Mostrar las líneas relevantes
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('cotizaciones') || line.includes('cotizacionesRoutes')) {
        console.log(`📝 Línea ${index + 1}: ${line.trim()}`);
      }
    });
    
  } else {
    console.log('❌ Archivo server.ts NO encontrado');
  }
} catch (error) {
  console.error('❌ Error al leer el archivo:', error.message);
}

console.log('\n🔧 Verificando archivo de rutas de cotizaciones...');
const cotizacionesPath = path.join(__dirname, 'backend/src/routes/cotizaciones.ts');

try {
  const fs = require('fs');
  if (fs.existsSync(cotizacionesPath)) {
    console.log('✅ Archivo cotizaciones.ts encontrado');
    
    const content = fs.readFileSync(cotizacionesPath, 'utf8');
    
    if (content.includes('router.delete')) {
      console.log('✅ Endpoint DELETE encontrado en cotizaciones.ts');
    } else {
      console.log('❌ Endpoint DELETE NO encontrado en cotizaciones.ts');
    }
    
  } else {
    console.log('❌ Archivo cotizaciones.ts NO encontrado');
  }
} catch (error) {
  console.error('❌ Error al leer el archivo de cotizaciones:', error.message);
}

console.log('\n📋 Comandos para solucionar:');
console.log('1. git add . && git commit -m "Fix routes" && git push');
console.log('2. En el servidor: cd /opt/myapp && sudo bash update.sh');
console.log('3. sudo systemctl restart myapp');
console.log('4. sudo systemctl status myapp');
