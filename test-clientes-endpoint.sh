#!/bin/bash

echo "🧪 PROBANDO ENDPOINT DE CLIENTES"
echo "================================"
echo ""

# Obtener la IP del servidor desde el error
SERVER_IP="192.168.130.149"

echo "1. Probando conectividad básica..."
echo "   Servidor: $SERVER_IP"
echo ""

# Probar diferentes puertos
for PORT in 3002 3003; do
    echo "2. Probando puerto $PORT..."
    echo "   -------------------------"
    
    # Test básico
    echo "   📡 GET /api/test"
    if curl -s --connect-timeout 5 "http://$SERVER_IP:$PORT/api/test"; then
        echo ""
        echo "   ✅ Backend responde en puerto $PORT"
        
        # Test endpoint de clientes
        echo ""
        echo "   📡 GET /api/clientes"
        RESPONSE=$(curl -s --connect-timeout 5 "http://$SERVER_IP:$PORT/api/clientes")
        if [ $? -eq 0 ]; then
            echo "   ✅ Endpoint /api/clientes responde"
            echo "   📋 Respuesta:"
            echo "$RESPONSE" | head -5
            if [ ${#RESPONSE} -gt 100 ]; then
                echo "   ... (respuesta truncada)"
            fi
        else
            echo "   ❌ Endpoint /api/clientes NO responde"
        fi
        
        # Test con autenticación (simulando token)
        echo ""
        echo "   📡 GET /api/clientes (con token dummy)"
        RESPONSE_AUTH=$(curl -s --connect-timeout 5 -H "Authorization: Bearer dummy-token" "http://$SERVER_IP:$PORT/api/clientes")
        if [ $? -eq 0 ]; then
            echo "   ✅ Endpoint con auth responde"
            echo "   📋 Respuesta:"
            echo "$RESPONSE_AUTH" | head -3
        else
            echo "   ❌ Endpoint con auth NO responde"
        fi
        
    else
        echo "   ❌ Backend NO responde en puerto $PORT"
    fi
    echo ""
done

echo "3. Verificando estructura de respuesta..."
echo "   -------------------------------------"
echo "   Si el endpoint responde pero está vacío, puede ser:"
echo "   - La tabla 'clientes' no existe"
echo "   - La tabla está vacía"
echo "   - Error en la consulta SQL"
echo "   - Problema de permisos en la base de datos"
echo ""

echo "4. Comandos para verificar en el servidor:"
echo "   ---------------------------------------"
echo "   # Ver logs del backend:"
echo "   pm2 logs"
echo "   # o"
echo "   tail -f /var/log/mundografic.log"
echo ""
echo "   # Verificar base de datos:"
echo "   psql -h localhost -U postgres -d sistema_mg_staging -c \"SELECT COUNT(*) FROM clientes;\""
echo "   psql -h localhost -U postgres -d sistema_mg_staging -c \"\\d clientes;\""
echo ""
