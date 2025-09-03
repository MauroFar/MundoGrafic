echo ""
echo "🔌 Verificando puertos..."
PORTS_TO_CHECK=(
    "3000:Frontend Producción (BLUE)"
    "3001:Frontend Staging (GREEN) - SIN CONFLICTOS"
    "3002:Backend Producción (BLUE)"
    "3003:Backend Staging (GREEN) - SIN CONFLICTOS"
    "8080:Nginx Staging"
    "5432:PostgreSQL"
)

for port_info in "${PORTS_TO_CHECK[@]}"; do
    port=$(echo "$port_info" | cut -d: -f1)
    service=$(echo "$port_info" | cut -d: -f2)
    
    if netstat -tlnp | grep ":$port " > /dev/null; then
        log "Puerto $port ($service): ABIERTO"
    else
        warning "Puerto $port ($service): CERRADO"
    fi
done
