#!/bin/bash

##############################################################################
# Script de Deploy para Sistema MundoGrafic
# Fecha: 2025-12-29
# Descripción: Despliega cambios de código y ejecuta migraciones de BD
##############################################################################

set -e  # Detener si hay errores

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 Deploy Sistema MundoGrafic${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Variables de configuración
PROJECT_DIR="/var/www/sistema-mg"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKUP_DIR="/var/backups/sistema-mg"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

##############################################################################
# 1. BACKUP DE BASE DE DATOS
##############################################################################
echo -e "${YELLOW}📦 Paso 1: Creando backup de base de datos...${NC}"
cd $BACKEND_DIR
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)

PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
echo -e "${GREEN}✅ Backup creado: backup_$TIMESTAMP.sql${NC}"
echo ""

##############################################################################
# 2. DETENER SERVICIOS
##############################################################################
echo -e "${YELLOW}🛑 Paso 2: Deteniendo servicios...${NC}"
pm2 stop backend || echo "Backend no estaba corriendo"
pm2 stop frontend || echo "Frontend no estaba corriendo"
echo -e "${GREEN}✅ Servicios detenidos${NC}"
echo ""

##############################################################################
# 3. ACTUALIZAR CÓDIGO DESDE GIT
##############################################################################
echo -e "${YELLOW}📥 Paso 3: Actualizando código desde repositorio...${NC}"
cd $PROJECT_DIR

# Guardar cambios locales si los hay
git stash

# Obtener última versión
git fetch origin
git pull origin main

echo -e "${GREEN}✅ Código actualizado${NC}"
echo ""

##############################################################################
# 4. INSTALAR DEPENDENCIAS
##############################################################################
echo -e "${YELLOW}📦 Paso 4: Instalando dependencias...${NC}"

# Backend
cd $BACKEND_DIR
npm install --production
echo -e "${GREEN}✅ Dependencias backend instaladas${NC}"

# Frontend
cd $PROJECT_DIR
npm install
echo -e "${GREEN}✅ Dependencias frontend instaladas${NC}"
echo ""

##############################################################################
# 5. EJECUTAR MIGRACIONES DE BASE DE DATOS
##############################################################################
echo -e "${YELLOW}🗄️  Paso 5: Ejecutando migraciones de base de datos...${NC}"
cd $BACKEND_DIR

# Ejecutar migraciones
npx knex migrate:latest --env production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones ejecutadas exitosamente${NC}"
else
    echo -e "${RED}❌ Error en migraciones. Restaurando backup...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER $DB_NAME < "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    echo -e "${YELLOW}⚠️  Base de datos restaurada. Revise los errores.${NC}"
    exit 1
fi
echo ""

##############################################################################
# 6. BUILD DEL FRONTEND
##############################################################################
echo -e "${YELLOW}🏗️  Paso 6: Compilando frontend...${NC}"
cd $PROJECT_DIR
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend compilado${NC}"
else
    echo -e "${RED}❌ Error al compilar frontend${NC}"
    exit 1
fi
echo ""

##############################################################################
# 7. INICIAR SERVICIOS
##############################################################################
echo -e "${YELLOW}▶️  Paso 7: Iniciando servicios...${NC}"

# Backend
cd $BACKEND_DIR
pm2 restart backend || pm2 start npm --name backend -- run start

# Frontend (si usas pm2 para servir)
# cd $PROJECT_DIR
# pm2 restart frontend || pm2 start npm --name frontend -- run preview

echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

##############################################################################
# 8. VERIFICAR ESTADO
##############################################################################
echo -e "${YELLOW}🔍 Paso 8: Verificando estado de servicios...${NC}"
pm2 status
echo ""

##############################################################################
# 9. LIMPIEZA
##############################################################################
echo -e "${YELLOW}🧹 Paso 9: Limpieza...${NC}"

# Eliminar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
echo -e "${GREEN}✅ Backups antiguos eliminados${NC}"
echo ""

##############################################################################
# RESUMEN
##############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy completado exitosamente${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo -e "   📦 Backup: $BACKUP_DIR/backup_$TIMESTAMP.sql"
echo -e "   🗄️  Migraciones ejecutadas: $(npx knex migrate:list --env production 2>/dev/null | grep -c '✅' || echo 'N/A')"
echo -e "   ⏰ Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${YELLOW}🔗 Accesos:${NC}"
echo -e "   Backend:  http://localhost:3002"
echo -e "   Frontend: http://localhost:5173 (o tu dominio)"
echo ""
echo -e "${GREEN}¡Sistema actualizado y operativo! 🎉${NC}"
