#!/bin/bash

echo "🔍 Verificando configuración del backend..."

# Verificar Node.js
echo "📦 Verificando Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar npm
echo "📦 Verificando npm..."
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm no está instalado"
    exit 1
fi

# Verificar PostgreSQL
echo "🗄️ Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL está instalado"
    if sudo systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL está corriendo"
    else
        echo "⚠️ PostgreSQL no está corriendo"
        echo "💡 Ejecuta: sudo systemctl start postgresql"
    fi
else
    echo "❌ PostgreSQL no está instalado"
    exit 1
fi

# Verificar archivo .env
echo "📄 Verificando archivo .env..."
if [ -f ".env" ]; then
    echo "✅ Archivo .env existe"
    
    # Verificar variables críticas
    if grep -q "DB_USER=" .env; then
        echo "✅ DB_USER configurado"
    else
        echo "❌ DB_USER no configurado"
    fi
    
    if grep -q "DB_PASSWORD=" .env; then
        echo "✅ DB_PASSWORD configurado"
    else
        echo "❌ DB_PASSWORD no configurado"
    fi
    
    if grep -q "DB_NAME=" .env; then
        echo "✅ DB_NAME configurado"
    else
        echo "❌ DB_NAME no configurado"
    fi
    
    if grep -q "JWT_SECRET=" .env; then
        echo "✅ JWT_SECRET configurado"
    else
        echo "❌ JWT_SECRET no configurado"
    fi
else
    echo "❌ Archivo .env no existe"
    exit 1
fi

# Verificar dependencias
echo "📦 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe"
else
    echo "❌ node_modules no existe"
    echo "💡 Ejecuta: npm install"
    exit 1
fi

# Verificar directorios
echo "📁 Verificando directorios..."
if [ -d "storage/uploads" ]; then
    echo "✅ storage/uploads existe"
else
    echo "⚠️ storage/uploads no existe"
    echo "💡 Ejecuta: mkdir -p storage/uploads"
fi

# Verificar conexión a la base de datos
echo "🔌 Verificando conexión a la base de datos..."
if [ -f ".env" ]; then
    # Cargar variables del .env
    export $(cat .env | grep -v '^#' | xargs)
    
    # Intentar conectar
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Conexión a la base de datos exitosa"
    else
        echo "❌ No se puede conectar a la base de datos"
        echo "💡 Verifica las credenciales en .env"
        echo "💡 Asegúrate de que PostgreSQL esté corriendo"
    fi
fi

echo "✅ Verificación completada"
