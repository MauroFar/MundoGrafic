# Green/Blue deployment - guía rápida

Este repositorio incluye scripts y plantillas para implementar un despliegue Blue/Green en el servidor Debian.

Componentes añadidos:
- `scripts/control-green.sh` : script interactivo para desplegar, arrancar, promocionar y restaurar DB de staging.
- `scripts/db-staging-setup.sh` : copia la BD de producción a `sistema_mg_staging` (ajustar nombres si hace falta).
- `backend/deploy/mundografic@.service` : plantilla systemd (instancia por `blue` o `green`).
- `backend/deploy/nginx_mundografic_upstream.conf.template` : plantilla para upstream nginx.

Resumen del flujo recomendado:

1) Preparación en servidor (una vez):
   - Crear carpetas: `/opt/mundografic/blue` y `/opt/mundografic/green`.
   - Copiar tu código en ambas (o hacer `git clone` en cada una).
   - Crear archivos de entorno por instancia: `/etc/mundografic/blue.env` y `/etc/mundografic/green.env`. En el `.env` incluir al menos `PORT=4000` (por ejemplo) y `DATABASE_URL` apuntando a `sistema_mg_staging` para la instancia green.
   - Copiar la plantilla systemd a `/etc/systemd/system/mundografic@.service` y ajustar `ExecStart` si tu app usa otro comando (por ejemplo `node dist/server.js`).
   - Crear el archivo nginx upstream en `/etc/nginx/conf.d/mundografic_upstream.conf` apuntando a blue inicialmente y configurar tu site para hacer `proxy_pass http://mundografic_backends;`.

2) Uso normal (en servidor):
   - Ejecutar `./control-green.sh` y elegir `3) Deploy to green` para actualizar la copia green.
   - Probar la instancia green (acceder al puerto local o usar un subdominio directo).
   - Si todo está OK, elegir `4) Switch nginx to green` (promote) para que nginx apunte al puerto de green y recargar nginx.
   - Si hay problemas, elegir `5) Switch nginx to blue`.

3) Base de datos:
   - Para pruebas, usar la BD `sistema_mg_staging`. Ejecuta `sudo ./scripts/db-staging-setup.sh` para clonar prod -> staging.
   - Asegúrate de que el `.env` de la instancia green apunte a `sistema_mg_staging`.

Notas y seguridad:
- Los scripts asumen que tienes `systemd`, `nginx` y `postgres` instalados y que la app puede ejecutarse desde `/opt/mundografic/<instance>`.
- Las operaciones con DB usan el usuario postgres local (`sudo -u postgres`). Ajusta si usas otro usuario.
- Antes de usar los scripts en producción, revisa y adapta rutas, puertos y comandos de start.

Si quieres, puedo:
- Ajustar el `systemd` `ExecStart` a tu comando real (dime `npm run start` o `node dist/server.js`).
- Generar un `nginx` site example listo para copiar a `/etc/nginx/sites-available/`.
- Añadir pasos para manejar backups automáticos antes de restaurar staging.

