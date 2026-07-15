# Guía Blue/Green Deployment — MundoGrafic

## Conceptos

| Instancia | Servicio systemd         | Puerto | Base de datos       | Rol            |
|-----------|--------------------------|--------|---------------------|----------------|
| **Blue**  | `mundografic-backend`    | `3002` | `sistema_mg`        | Producción     |
| **Green** | `mundografic@green`      | `4001` | `sistema_mg_staging`| Staging/Pruebas|

El frontend de producción está en `/var/www/mundografic` (compilado con `npm run build`).  
Nginx sirve el frontend y hace proxy de `/api/` al upstream activo (`blue` o `green`).

---

## Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `scripts/control-green.sh` | Script interactivo de control (deploy, promover, rollback, etc.) |
| `scripts/db-staging-setup.sh` | Copia rápida de la BD de producción a staging (standalone) |
| `backend/deploy/setup-green-server.sh` | **Setup inicial** en el servidor (ejecutar una vez) |
| `backend/deploy/mundografic@.service` | Plantilla systemd para instancias blue/green |
| `backend/deploy/green.env.template` | Plantilla `.env` para la instancia green |
| `backend/deploy/nginx_mundografic_site.conf` | Configuración completa de nginx |
| `backend/deploy/nginx_mundografic_upstream.conf.template` | Template del upstream (generado automáticamente) |

---

## Instalación en el servidor (primera vez)

### Prerrequisitos en el servidor Debian
```bash
# Node.js 20+, npm, nginx, postgresql, git
sudo apt update && sudo apt install -y git nginx postgresql
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash
sudo apt install -y nodejs
```

### Ejecutar el setup automático
```bash
# Desde el directorio de producción (/opt/mundografic):
sudo bash backend/deploy/setup-green-server.sh
```

Esto hace todo automáticamente:
1. Clona el repo en `/opt/mundografic/green`
2. Crea el `.env` de green (PORT=4001, DB=sistema_mg_staging)
3. Instala el servicio systemd `mundografic@.service`
4. Copia la BD de producción → `sistema_mg_staging`
5. Compila el backend de green
6. Inicia el servicio `mundografic@green`
7. Abre el puerto 4001 en ufw

### Configurar nginx (si aún no está)
```bash
sudo cp backend/deploy/nginx_mundografic_site.conf /etc/nginx/sites-available/mundografic
sudo ln -s /etc/nginx/sites-available/mundografic /etc/nginx/sites-enabled/mundografic

# Crear el upstream inicial apuntando a blue (producción)
sudo tee /etc/nginx/conf.d/mundografic_upstream.conf > /dev/null <<EOF
upstream mundografic_backends {
  server 127.0.0.1:3002 max_fails=3 fail_timeout=5s;
}
EOF

sudo nginx -t && sudo systemctl reload nginx
```

---

## Flujo normal de trabajo

```
Desarrollas en local
       ↓
git push origin main
       ↓
En el servidor: sudo bash scripts/control-green.sh
       ↓
Opción 3 → Deploy a green (pull + build + restart)
       ↓
Pruebas en http://<servidor>:4001
       ↓
¿Todo OK?
  ├── SÍ → Opción 4 (Promover green → producción)
  └── NO → Corrige, repite desde opción 3
               Si ya la promoviste → Opción 5 (Rollback a blue)
```

---

## Comandos útiles en el servidor

```bash
# Script de control interactivo (menú completo)
sudo bash scripts/control-green.sh

# Ver logs de green en tiempo real
sudo journalctl -u mundografic@green -f

# Ver logs de producción (blue)
sudo journalctl -u mundografic-backend -f

# Estado de ambas instancias
sudo systemctl status mundografic-backend mundografic@green

# Refrescar BD staging manualmente
sudo bash scripts/db-staging-setup.sh
```

---

## ¿Qué hace cada opción del menú de control?

| Opción | Acción |
|--------|--------|
| 1 | Iniciar servicio green |
| 2 | Detener servicio green |
| 3 | Deploy a green: `git pull` → `npm ci` → `build` → `restart` |
| 4 | **Promover**: nginx apunta a green (`:4001`) — green pasa a producción |
| 5 | **Rollback**: nginx vuelve a blue (`:3002`) |
| 6 | Copiar BD producción → staging (sobreescribe `sistema_mg_staging`) |
| 7 | Ver estado de servicios, nginx y puertos |
| 8 | Setup inicial green (primera vez) |

---

## Notas
- El archivo `/etc/nginx/conf.d/mundografic_upstream.conf` es **generado automáticamente** por el script. No lo edites a mano.
- El `.env` de green vive en `/opt/mundografic/green/backend/.env`. Nunca contiene credenciales de producción en la BD (apunta a `sistema_mg_staging`).
- Para averiguar el nombre actual del servicio de producción: `sudo systemctl list-units | grep mundografic`
