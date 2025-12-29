#!/bin/bash

##############################################################################
# Script de Rollback para Sistema MundoGrafic
# Descripción: Revierte migraciones y restaura backup de BD
##############################################################################

set -e

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}   ⚠️  ROLLBACK Sistema MundoGrafic${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

BACKEND_DIR="/var/www/sistema-mg/backend"
BACKUP_DIR="/var/backups/sistema-mg"

# Listar backups disponibles
echo -e "${YELLOW}Backups disponibles:${NC}"
ls -lh $BACKUP_DIR/backup_*.sql
echo ""

# Solicitar confirmación
read -p "¿Desea restaurar el último backup? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Obtener último backup
    LAST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql | head -1)
    
    echo -e "${YELLOW}Restaurando: $LAST_BACKUP${NC}"
    
    # Detener servicios
    pm2 stop backend
    
    # Restaurar BD
    cd $BACKEND_DIR
    DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
    DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)
    
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER $DB_NAME < $LAST_BACKUP
    
    # Revertir última migración (opcional)
    echo -e "${YELLOW}¿Desea revertir la última migración? (s/n):${NC}"
    read -p "" -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        npx knex migrate:rollback --env production
    fi
    
    # Reiniciar servicios
    pm2 restart backend
    
    echo -e "${GREEN}✅ Rollback completado${NC}"
else
    echo -e "${YELLOW}Operación cancelada${NC}"
fi
