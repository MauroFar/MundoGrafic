#!/bin/bash

# Script para configurar firewall y puertos para staging
# Sistema: MundoGrafic
# Puertos diferentes para evitar conflictos con producción

set -e

echo "🔥 Configurando firewall y puertos para staging..."

# Verificar si ufw está instalado
if ! command -v ufw &> /dev/null; then
    echo "📥 Instalando ufw..."
    sudo apt update
    sudo apt install -y ufw
fi

# Verificar si ufw está activo
if ! sudo ufw status | grep -q "Status: active"; then
    echo "🔄 Activando ufw..."
    sudo ufw --force enable
fi

# Configurar reglas para staging
echo "🔒 Configurando reglas de firewall para staging..."

# Permitir SSH (puerto 22)
sudo ufw allow 22/tcp

# Permitir HTTP (puerto 80) para producción
sudo ufw allow 80/tcp

# Permitir HTTPS (puerto 443) para producción
sudo ufw allow 443/tcp

# Permitir puerto de staging (8080)
sudo ufw allow 8080/tcp

# Permitir puerto del frontend de staging (3001) - DIFERENTE de producción (3000)
sudo ufw allow 3001/tcp

# Permitir puerto del backend de staging (3003) - DIFERENTE de producción (3002)
sudo ufw allow 3003/tcp

# Permitir PostgreSQL (puerto 5432) solo desde localhost
sudo ufw allow from 127.0.0.1 to any port 5432

# Mostrar estado del firewall
echo "📊 Estado del firewall:"
sudo ufw status numbered

# Verificar puertos abiertos
echo "🔍 Verificando puertos abiertos..."
sudo netstat -tlnp | grep -E ':(22|80|443|3001|3003|5432|8080)'

echo "✅ Firewall configurado para staging"
echo ""
echo "🌐 Puertos abiertos:"
echo "   - SSH: 22"
echo "   - HTTP: 80"
echo "   - HTTPS: 443"
echo "   - Frontend Staging: 3001 (diferente de producción 3000)"
echo "   - Backend Staging: 3003 (diferente de producción 3002)"
echo "   - Nginx Staging: 8080"
echo "   - PostgreSQL: 5432 (solo localhost)"
echo ""
echo "🔒 Reglas de seguridad aplicadas:"
echo "   - Solo SSH, HTTP, HTTPS y puertos de staging están abiertos"
echo "   - PostgreSQL solo acepta conexiones locales"
echo "   - Puerto 3001 para frontend staging (sin conflictos)"
echo "   - Puerto 3003 para backend staging (sin conflictos)"
echo "   - Sistema de producción (puertos 3000 y 3002) no se ve afectado"
echo "   - Resto de puertos están bloqueados por defecto"
