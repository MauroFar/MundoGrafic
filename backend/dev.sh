#!/bin/bash

echo "🚀 Iniciando modo desarrollo..."

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró el archivo .env"
    echo "📝 Por favor, crea un archivo .env con las variables necesarias"
    exit 1
fi

# Inicializar la base de datos
echo "🗄️  Inicializando base de datos..."
node init-db.js

# Verificar si hay archivos TypeScript
if find src -name "*.ts" -type f | grep -q .; then
    echo "📝 Detectados archivos TypeScript, usando ts-node-dev..."
    npm run start:dev
else
    echo "📝 Solo archivos JavaScript, usando nodemon..."
    npm run dev:js
fi
