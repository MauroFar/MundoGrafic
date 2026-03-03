#!/usr/bin/env bash
# db-staging-setup.sh
# Copia la BD de producción a la BD de staging en el mismo servidor PostgreSQL.
# Personaliza los nombres de BD según tu entorno.

set -euo pipefail

PROD_DB="sistema_mg"        # nombre real de la BD de producción
STAGING_DB="sistema_mg_staging"  # BD de staging para la instancia green
DUMP_FILE="/tmp/prod_dump_$(date +%Y%m%d%H%M%S).dump"

echo "Dumping production DB: $PROD_DB -> $DUMP_FILE"
sudo -u postgres pg_dump -Fc "$PROD_DB" -f "$DUMP_FILE"

echo "Dropping and recreating staging DB: $STAGING_DB"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS \"$STAGING_DB\";"
sudo -u postgres psql -c "CREATE DATABASE \"$STAGING_DB\";"

echo "Restoring dump into $STAGING_DB"
sudo -u postgres pg_restore -d "$STAGING_DB" "$DUMP_FILE"

echo "Done. Remember to update connection strings/environment files for the green instance to point to $STAGING_DB when testing."
