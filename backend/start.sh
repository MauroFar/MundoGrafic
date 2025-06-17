#!/bin/bash

# Crear directorios necesarios
mkdir -p storage/uploads

# Dar permisos
chmod 755 storage/uploads

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    npm install
fi

# Compilar el proyecto
npm run build

# Iniciar el servidor
npm start 