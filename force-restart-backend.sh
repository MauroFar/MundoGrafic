#!/bin/bash

echo "🔄 FORZANDO REINICIO COMPLETO DEL BACKEND"
echo "=========================================="

# 1. Matar todos los procesos relacionados
echo "1. Matando procesos existentes..."
pkill -f "node.*staging" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "serve.*3001" 2>/dev/null || true
sleep 2

# 2. Verificar que no hay procesos en los puertos
echo "2. Verificando puertos..."
if netstat -tlnp 2>/dev/null | grep -q ":3003 "; then
    echo "   ⚠️  Puerto 3003 aún en uso, forzando..."
    fuser -k 3003/tcp 2>/dev/null || true
    sleep 2
fi

if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
    echo "   ⚠️  Puerto 3001 aún en uso, forzando..."
    fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
fi

# 3. Limpiar archivos de PID
echo "3. Limpiando archivos de PID..."
rm -f staging/logs/backend.pid
rm -f staging/logs/frontend.pid

# 4. Verificar que existe el archivo .env
echo "4. Verificando configuración..."
if [ ! -f "staging/backend/.env" ]; then
    echo "   📋 Copiando configuración..."
    cp staging.env staging/backend/.env
fi

# 5. Compilar TypeScript si es necesario
echo "5. Compilando TypeScript..."
cd staging/backend
if [ -f "tsconfig.json" ]; then
    npm run build
fi

# 6. Iniciar backend
echo "6. Iniciando backend..."
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

# 7. Esperar y verificar
echo "7. Esperando que el backend inicie..."
sleep 5

if netstat -tlnp 2>/dev/null | grep -q ":3003 "; then
    echo "✅ Backend iniciado correctamente (PID: $BACKEND_PID)"
    echo "📋 Logs disponibles en: staging/logs/backend.log"
    echo ""
    echo "🧪 Pruebas:"
    echo "   curl http://localhost:3003/api/test"
    echo "   curl http://localhost:3003/api/clientes/direct"
    echo ""
    echo "📝 Para ver logs en tiempo real:"
    echo "   tail -f staging/logs/backend.log"
else
    echo "❌ Backend no pudo iniciar"
    echo "📋 Revisar logs: tail -20 staging/logs/backend.log"
fi

cd ../..
