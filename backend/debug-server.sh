#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL SERVIDOR DEBIAN"
echo "=================================="

echo ""
echo "1. 📦 Verificando Node.js y npm..."
node --version
npm --version

echo ""
echo "2. 🔧 Verificando archivo .env..."
if [ -f ".env" ]; then
    echo "✅ .env existe"
    echo "Contenido (sin valores sensibles):"
    grep -E "^(DB_|PORT=|NODE_ENV=)" .env | sed 's/=.*/=***/'
else
    echo "❌ .env NO existe"
fi

echo ""
echo "3. 🗄️ Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL instalado"
    echo "Estado del servicio:"
    sudo systemctl status postgresql --no-pager -l
else
    echo "❌ PostgreSQL NO está instalado"
fi

echo ""
echo "4. 🔌 Verificando puerto 3000..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep :3000; then
        echo "⚠️ Puerto 3000 está en uso"
    else
        echo "✅ Puerto 3000 está libre"
    fi
else
    echo "ℹ️ netstat no disponible, verificando con ss..."
    if ss -tuln | grep :3000; then
        echo "⚠️ Puerto 3000 está en uso"
    else
        echo "✅ Puerto 3000 está libre"
    fi
fi

echo ""
echo "5. 📁 Verificando estructura de archivos..."
if [ -f "src/server.ts" ]; then
    echo "✅ server.ts existe"
else
    echo "❌ server.ts NO existe"
fi

if [ -f "package.json" ]; then
    echo "✅ package.json existe"
else
    echo "❌ package.json NO existe"
fi

echo ""
echo "6. 🔐 Verificando permisos..."
ls -la .env
ls -la src/server.ts

echo ""
echo "7. 🧪 Probando conexión a base de datos..."
if [ -f ".env" ]; then
    source .env 2>/dev/null
    echo "Intentando conectar a PostgreSQL..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Conexión a BD exitosa"
    else
        echo "❌ Error conectando a BD"
    fi
fi

echo ""
echo "8. 🔍 Verificando dependencias TypeScript..."
if [ -f "node_modules/typescript/package.json" ]; then
    echo "✅ TypeScript instalado"
else
    echo "❌ TypeScript NO instalado"
fi

if [ -f "node_modules/ts-node-dev/package.json" ]; then
    echo "✅ ts-node-dev instalado"
else
    echo "❌ ts-node-dev NO instalado"
fi

echo ""
echo "9. 🧪 Compilando TypeScript..."
echo "Ejecutando: npm run build"
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Compilación exitosa"
else
    echo "❌ Error en compilación"
    exit 1
fi

echo ""
echo "10. 🚀 Probando servidor compilado..."
echo "Ejecutando: npm start (por 5 segundos)"
timeout 5s npm start || echo "Servidor compilado se detuvo"

echo ""
echo "11. 🐛 Probando servidor en modo debug..."
echo "Ejecutando: npm run dev (por 10 segundos)"
echo "Si se queda colgado, presiona Ctrl+C"
timeout 10s npm run dev 2>&1 || echo "Servidor dev se detuvo o hubo error"
