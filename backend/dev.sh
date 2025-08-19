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

# Iniciar en modo desarrollo
echo "🚀 Iniciando servidor en modo desarrollo..."
npm run dev
