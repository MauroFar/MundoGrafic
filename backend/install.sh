#!/bin/bash

echo "🔧 Instalando MundoGrafic Backend..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js ya está instalado: $(node --version)"
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Instalando..."
    sudo apt-get install -y npm
else
    echo "✅ npm ya está instalado: $(npm --version)"
fi

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "📦 Instalando PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "✅ PostgreSQL ya está instalado"
fi

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p storage/uploads
chmod 755 storage/uploads

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró el archivo .env"
    echo "📝 Creando archivo .env de ejemplo..."
    cat > .env << EOF
# Configuración de la base de datos PostgreSQL
DB_USER=mundografic_user
DB_HOST=localhost
DB_NAME=mundografic
DB_PASSWORD=tu_password_seguro
DB_PORT=5432

# Configuración del servidor
PORT=5000
NODE_ENV=production

# Configuración JWT
JWT_SECRET=tu_secreto_jwt_super_seguro_cambiar_esto

# Configuración de email
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_email
SMTP_FROM=no-reply@mundografic.com

# URL de la API
API_URL=http://localhost:5000
EOF
    echo "📝 Por favor, edita el archivo .env con tus credenciales reales"
    echo "🔧 Variables importantes a configurar:"
    echo "   - DB_USER, DB_PASSWORD: Credenciales de PostgreSQL"
    echo "   - JWT_SECRET: Un secreto único y seguro"
    echo "   - EMAIL_USER, EMAIL_PASSWORD: Credenciales de email"
fi

echo "✅ Instalación completada!"
echo "🚀 Para iniciar el servidor, ejecuta: ./start.sh"
echo "📝 Recuerda configurar el archivo .env con tus credenciales"
