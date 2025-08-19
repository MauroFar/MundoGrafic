#!/bin/bash

echo "🚀 Iniciando migración completa a TypeScript..."

# Crear directorio de backup
echo "📦 Creando backup..."
mkdir -p backup-js-files
cp -r src backup-js-files/

# Renombrar archivos .js a .ts
echo "🔄 Renombrando archivos .js a .ts..."

# Renombrar archivos en src/
find src -name "*.js" -type f | while read file; do
    newfile="${file%.js}.ts"
    echo "Renombrando: $file → $newfile"
    mv "$file" "$newfile"
done

# Actualizar package.json para TypeScript puro
echo "📝 Actualizando package.json..."
cat > package.json << 'EOF'
{
  "name": "mundografic-backend",
  "version": "1.0.0",
  "description": "Backend para el sistema de MundoGrafic",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "watch": "tsc --watch",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.1",
    "pg": "^8.10.0",
    "puppeteer": "^19.7.0",
    "sharp": "^0.34.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^24.0.8",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "@types/pg": "^8.10.9",
    "nodemon": "^2.0.22",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.8.3"
  }
}
EOF

# Actualizar tsconfig.json para configuración más estricta
echo "📝 Actualizando tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "rootDir": "./src",
    "outDir": "./dist",
    "allowJs": false,
    "checkJs": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "removeComments": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "backup-js-files"]
}
EOF

# Actualizar scripts de inicio
echo "📝 Actualizando scripts de inicio..."

cat > start.sh << 'EOF'
#!/bin/bash

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró el archivo .env"
    echo "📝 Por favor, crea un archivo .env con las variables necesarias"
    exit 1
fi

# Inicializar la base de datos
echo "🗄️  Inicializando base de datos..."
node init-db.js

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

# Iniciar el servidor
echo "🚀 Iniciando servidor..."
npm start
EOF

cat > dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando modo desarrollo con TypeScript..."

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró el archivo .env"
    echo "📝 Por favor, crea un archivo .env con las variables necesarias"
    exit 1
fi

# Inicializar la base de datos
echo "🗄️  Inicializando base de datos..."
node init-db.js

# Iniciar en modo desarrollo
echo "🚀 Iniciando servidor en modo desarrollo..."
npm run dev
EOF

# Dar permisos de ejecución
chmod +x start.sh dev.sh

echo "✅ Migración completada!"
echo "📝 Archivos JavaScript originales guardados en: backup-js-files/"
echo ""
echo "🚀 Próximos pasos:"
echo "1. Instalar nuevas dependencias: npm install"
echo "2. Revisar y corregir errores de TypeScript: npm run build"
echo "3. Iniciar en desarrollo: npm run dev"
echo "4. Para producción: npm run build && npm start"
