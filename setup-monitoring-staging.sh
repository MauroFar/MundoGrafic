# Verificar puertos
echo ""
echo "🔌 Estado de los puertos:"

PORTS=("3000" "3002" "8080" "5432")
for port in "${PORTS[@]}"; do
    if netstat -tlnp | grep ":$port " > /dev/null; then
        echo "✅ Puerto $port: ABIERTO"
    else
        echo "❌ Puerto $port: CERRADO"
    fi
done
