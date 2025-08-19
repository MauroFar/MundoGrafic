#!/bin/bash

echo "🔍 Diagnosticando problemas con TypeScript..."

# Verificar si TypeScript está instalado
echo "📦 Verificando TypeScript..."
if npx tsc --version > /dev/null 2>&1; then
    echo "✅ TypeScript está instalado"
else
    echo "❌ TypeScript no está instalado"
    exit 1
fi

# Verificar errores de TypeScript
echo "🔍 Verificando errores de TypeScript..."
npx tsc --noEmit

# Verificar si el archivo server.js existe
echo "📄 Verificando archivo server.js..."
if [ -f "src/server.js" ]; then
    echo "✅ src/server.js existe"
else
    echo "❌ src/server.js no existe"
    exit 1
fi

# Intentar ejecutar con node directamente para ver errores
echo "🚀 Intentando ejecutar con node directamente..."
node src/server.js

echo "✅ Diagnóstico completado"
