#!/bin/bash

echo "🚀 Iniciando despliegue en servidor..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    echo "Ejecuta este script desde el directorio backend"
    exit 1
fi

# Actualizar código desde GitHub
echo "📦 Obteniendo últimos cambios..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Error al hacer git pull"
    exit 1
fi

# Instalar/actualizar dependencias
echo "📚 Actualizando dependencias..."
npm install

# Ejecutar migraciones
echo "🗃️ Ejecutando migraciones de base de datos..."
npm run migrate

if [ $? -ne 0 ]; then
    echo "❌ Error en las migraciones"
    echo "🔄 Revirtiendo última migración..."
    npm run migrate:rollback
    exit 1
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación"
    exit 1
fi

# Reiniciar aplicación (si usas PM2)
echo "🔄 Reiniciando aplicación..."
if command -v pm2 &> /dev/null; then
    pm2 restart mundografic-backend
    echo "✅ Aplicación reiniciada con PM2"
else
    echo "⚠️ PM2 no encontrado, reinicia manualmente"
fi

echo "✅ Despliegue completado exitosamente"
echo "📋 Revisa los logs para confirmar que todo funciona"

# Mostrar estado de migraciones
echo "📊 Estado actual de migraciones:"
npm run migrate:status
