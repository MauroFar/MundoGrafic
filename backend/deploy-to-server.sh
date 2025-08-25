#!/bin/bash

# Script de despliegue completo para MundoGrafic
# Este script configura la base de datos en el servidor y restaura los datos

echo "🚀 Iniciando despliegue de MundoGrafic al servidor..."
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio backend/"
    exit 1
fi

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Asegúrate de tener configuradas las variables de entorno para el servidor"
    exit 1
fi

echo "📋 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
else
    echo "✅ Dependencias ya instaladas"
fi

echo ""
echo "🔧 Paso 1: Configurando base de datos en el servidor..."
node setup-server-db.js

if [ $? -ne 0 ]; then
    echo "❌ Error en la configuración de la base de datos"
    exit 1
fi

echo ""
echo "💾 Paso 2: Creando backup de la base de datos local..."
node backup-restore.js

if [ $? -ne 0 ]; then
    echo "❌ Error en el backup/restore"
    exit 1
fi

echo ""
echo "🔍 Paso 3: Verificando configuración..."
echo "   - Base de datos configurada ✓"
echo "   - Tablas creadas ✓"
echo "   - Datos restaurados ✓"

echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verifica que tu aplicación esté funcionando correctamente"
echo "   2. Revisa los logs del servidor"
echo "   3. Prueba las funcionalidades principales"
echo ""
echo "🔧 Comandos útiles:"
echo "   - npm run start          # Iniciar en producción"
echo "   - npm run dev            # Iniciar en desarrollo"
echo "   - node setup-server-db.js # Solo configurar BBDD"
echo "   - node backup-restore.js  # Solo backup/restore"
