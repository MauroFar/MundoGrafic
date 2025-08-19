# MundoGrafic Backend

Backend para el sistema de gestión de MundoGrafic.

## Requisitos Previos

- Node.js 18.x o superior
- npm
- PostgreSQL 12.x o superior
- Git

## Instalación Automática (Recomendado)

1. **Clonar el repositorio**:
   ```bash
   git clone <tu-repositorio>
   cd MundoGrafic/backend
   ```

2. **Ejecutar el script de instalación**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Configurar variables de entorno**:
   ```bash
   nano .env
   ```
   
   Edita las siguientes variables:
   - `DB_USER`: Usuario de PostgreSQL
   - `DB_PASSWORD`: Contraseña de PostgreSQL
   - `DB_NAME`: Nombre de la base de datos
   - `JWT_SECRET`: Secreto único para JWT
   - `EMAIL_USER`: Email para envío de correos
   - `EMAIL_PASSWORD`: Contraseña del email

4. **Configurar PostgreSQL**:
   ```bash
   sudo -u postgres psql
   ```
   
   En PostgreSQL:
   ```sql
   CREATE DATABASE mundografic;
   CREATE USER mundografic_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE mundografic TO mundografic_user;
   \q
   ```

5. **Iniciar el servidor**:
   ```bash
   ./start.sh
   ```

## Instalación Manual

### 1. Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalar PostgreSQL
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Configurar PostgreSQL
```bash
sudo -u postgres psql
```

Crear base de datos y usuario:
```sql
CREATE DATABASE mundografic;
CREATE USER mundografic_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE mundografic TO mundografic_user;
\q
```

### 4. Instalar dependencias
```bash
npm install
```

### 5. Configurar variables de entorno
Crear archivo `.env`:
```bash
cp .env.example .env
nano .env
```

### 6. Crear directorios necesarios
```bash
mkdir -p storage/uploads
chmod 755 storage/uploads
```

### 7. Iniciar el servidor
```bash
npm start
```

## Scripts Disponibles

- `npm start`: Inicia el servidor en producción
- `npm run dev`: Inicia el servidor en modo desarrollo con nodemon
- `./start.sh`: Script de inicio con verificaciones
- `./install.sh`: Script de instalación automática

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_USER` | Usuario de PostgreSQL | `mundografic_user` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_NAME` | Nombre de la base de datos | `mundografic` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `tu_password` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `PORT` | Puerto del servidor | `5000` |
| `JWT_SECRET` | Secreto para JWT | `secreto_super_seguro` |
| `EMAIL_USER` | Email para envío | `tu_email@gmail.com` |
| `EMAIL_PASSWORD` | Contraseña del email | `tu_password_email` |

## Solución de Problemas

### Error: "Cannot find module"
```bash
npm install
```

### Error: "ECONNREFUSED" (PostgreSQL)
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Error: "Permission denied"
```bash
chmod +x *.sh
```

### Error: "No .env file found"
```bash
cp .env.example .env
nano .env
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── server.js          # Servidor principal
│   ├── routes/            # Rutas de la API
│   └── middleware/        # Middleware
├── storage/               # Archivos subidos
├── public/                # Archivos estáticos
├── package.json           # Dependencias
├── .env                   # Variables de entorno
├── start.sh              # Script de inicio
└── install.sh            # Script de instalación
```

## Puertos

- **Backend**: 5000 (configurable en .env)
- **PostgreSQL**: 5432 (por defecto)

## Logs

Los logs del servidor se muestran en la consola. Para ver logs en producción:

```bash
npm start > server.log 2>&1 &
```

## Reiniciar Servidor

```bash
pkill -f "node src/server.js"
./start.sh
```
