#!/bin/bash

# Crear directorios necesarios
mkdir -p storage/uploads

# Dar permisos
chmod 755 storage/uploads

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    npm install
fi

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró el archivo .env"
    echo "📝 Por favor, crea un archivo .env basado en .env.example"
    echo "🔧 Variables requeridas:"
    echo "   - DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT"
    echo "   - JWT_SECRET"
    echo "   - EMAIL_USER, EMAIL_PASSWORD"
    echo "   - PORT (opcional, por defecto 5000)"
    exit 1
fi

# Inicializar la base de datos
echo "🗄️  Inicializando base de datos..."
node init-db.js

# Verificar si hay archivos TypeScript
if find src -name "*.ts" -type f | grep -q .; then
    echo "📝 Detectados archivos TypeScript, usando ts-node-dev..."
    # Iniciar el servidor con TypeScript
    echo "🚀 Iniciando servidor con TypeScript..."
    npm run start:dev
else
    echo "📝 Solo archivos JavaScript, compilando y ejecutando..."
    # Compilar TypeScript (si hay archivos .ts)
    echo "🔨 Compilando TypeScript..."
    npm run build
    # Iniciar el servidor
    echo "🚀 Iniciando servidor..."
    npm start
fi 