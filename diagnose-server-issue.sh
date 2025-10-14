#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL SERVIDOR - MundoGrafic"
echo "=========================================="
echo ""

# 1. Verificar qué puertos están en uso
echo "1. PUERTOS EN USO:"
echo "------------------"
netstat -tlnp | grep -E ":(3001|3002|3003)" || echo "   No se encontraron puertos 3001, 3002 o 3003 en uso"
echo ""

# 2. Verificar procesos de Node.js
echo "2. PROCESOS DE NODE.JS:"
echo "-----------------------"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "   No se encontraron procesos de Node.js"
echo ""

# 3. Verificar si el backend responde en diferentes puertos
echo "3. PRUEBAS DE CONECTIVIDAD:"
echo "---------------------------"

# Puerto 3002 (por defecto)
echo "   Probando puerto 3002 (por defecto)..."
if curl -s --connect-timeout 5 http://192.168.130.149:3002/api/test > /dev/null 2>&1; then
    echo "   ✅ Backend responde en puerto 3002"
    echo "   📡 Probando endpoint de clientes en 3002..."
    if curl -s --connect-timeout 5 http://192.168.130.149:3002/api/clientes > /dev/null 2>&1; then
        echo "   ✅ /api/clientes disponible en puerto 3002"
    else
        echo "   ❌ /api/clientes NO disponible en puerto 3002"
    fi
else
    echo "   ❌ Backend NO responde en puerto 3002"
fi

# Puerto 3003 (staging)
echo "   Probando puerto 3003 (staging)..."
if curl -s --connect-timeout 5 http://192.168.130.149:3003/api/test > /dev/null 2>&1; then
    echo "   ✅ Backend responde en puerto 3003"
    echo "   📡 Probando endpoint de clientes en 3003..."
    if curl -s --connect-timeout 5 http://192.168.130.149:3003/api/clientes > /dev/null 2>&1; then
        echo "   ✅ /api/clientes disponible en puerto 3003"
    else
        echo "   ❌ /api/clientes NO disponible en puerto 3003"
    fi
else
    echo "   ❌ Backend NO responde en puerto 3003"
fi

echo ""

# 4. Verificar archivos de configuración
echo "4. ARCHIVOS DE CONFIGURACIÓN:"
echo "-----------------------------"
if [ -f "staging.env" ]; then
    echo "   ✅ staging.env existe"
    echo "   📋 Contenido de staging.env:"
    cat staging.env | grep -E "(PORT|VITE_API_URL)" | sed 's/^/      /'
else
    echo "   ❌ staging.env NO existe"
fi

if [ -f ".env" ]; then
    echo "   ✅ .env existe"
    echo "   📋 Contenido de .env:"
    cat .env | grep -E "(PORT|VITE_API_URL)" | sed 's/^/      /'
else
    echo "   ❌ .env NO existe"
fi

echo ""

# 5. Verificar base de datos
echo "5. BASE DE DATOS:"
echo "-----------------"
if command -v psql > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL disponible"
    # Intentar conectar (esto puede fallar si no hay credenciales)
    echo "   🔍 Intentando conectar a la base de datos..."
else
    echo "   ❌ PostgreSQL NO disponible o no está en PATH"
fi

echo ""
echo "=========================================="
echo "📋 RESUMEN Y RECOMENDACIONES:"
echo "=========================================="
echo ""
echo "Si el backend responde en puerto 3002 pero no en 3003:"
echo "   → El problema es que el servidor no está usando staging.env"
echo "   → Solución: Asegúrate de que el backend se inicie con staging.env"
echo ""
echo "Si el backend no responde en ningún puerto:"
echo "   → El backend no está corriendo"
echo "   → Solución: Iniciar el backend con 'npm run dev' o 'npm start'"
echo ""
echo "Si el backend responde pero /api/clientes da 404:"
echo "   → El endpoint no está registrado correctamente"
echo "   → Solución: Verificar que las rutas estén importadas en server.ts"
echo ""
