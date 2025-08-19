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
if netstat -tuln | grep :3000; then
    echo "⚠️ Puerto 3000 está en uso"
else
    echo "✅ Puerto 3000 está libre"
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
    source .env
    echo "Intentando conectar a PostgreSQL..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Conexión a BD exitosa"
    else
        echo "❌ Error conectando a BD"
    fi
fi

echo ""
echo "8. 🚀 Intentando iniciar servidor en modo debug..."
echo "Presiona Ctrl+C para detener después de 10 segundos..."
timeout 10s npm run dev || echo "Servidor se detuvo o hubo error"
