#!/bin/bash

echo "🔍 Verificando conexión del sistema MundoGrafic en staging..."
echo "=================================================="

# Verificar que el backend esté corriendo
echo "1. Verificando backend en puerto 3003..."
if curl -s http://192.168.130.149:3003/api/test > /dev/null; then
    echo "✅ Backend respondiendo en puerto 3003"
else
    echo "❌ Backend NO responde en puerto 3003"
    echo "   Verifica que el servidor esté corriendo con:"
    echo "   cd backend && npm run dev"
fi

# Verificar endpoint de clientes específicamente
echo ""
echo "2. Verificando endpoint de clientes..."
if curl -s http://192.168.130.149:3003/api/clientes > /dev/null; then
    echo "✅ Endpoint /api/clientes disponible"
else
    echo "❌ Endpoint /api/clientes NO disponible"
    echo "   Error 404 - La ruta no existe o no está registrada"
fi

# Verificar frontend
echo ""
echo "3. Verificando frontend en puerto 3001..."
if curl -s http://192.168.130.149:3001 > /dev/null; then
    echo "✅ Frontend respondiendo en puerto 3001"
else
    echo "❌ Frontend NO responde en puerto 3001"
fi

echo ""
echo "=================================================="
echo "📋 Resumen de configuración esperada:"
echo "   Backend:  http://192.168.130.149:3003"
echo "   Frontend: http://192.168.130.149:3001"
echo "   API URL:  http://192.168.130.149:3003 (VITE_API_URL)"
echo "=================================================="
