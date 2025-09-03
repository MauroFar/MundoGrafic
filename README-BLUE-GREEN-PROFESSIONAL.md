# 🟢🔵 Sistema Blue-Green Deployment Profesional - MundoGrafic

## 📋 Descripción

Este documento describe la implementación profesional del sistema **Blue-Green Deployment** para MundoGrafic, siguiendo las mejores prácticas de la industria.

## 🎯 Arquitectura

### **Sistema BLUE (Producción)**
- **Frontend**: Puerto 3000
- **Backend**: Puerto 3002
- **Base de datos**: `sistema_mg_production`
- **Estado**: Siempre activo
- **Acceso**: Público

### **Sistema GREEN (Staging)**
- **Frontend**: Puerto 3001
- **Backend**: Puerto 3003
- **Base de datos**: `sistema_mg_staging`
- **Estado**: Solo cuando se necesita
- **Acceso**: Red local

## 🏗️ Estructura del Proyecto

```
MundoGrafic/
├── backend/                    # Backend principal (BLUE)
├── src/                        # Frontend principal (BLUE)
├── staging/                    # Sistema GREEN
│   ├── backend/               # Backend GREEN (puerto 3003)
│   └── logs/                  # Logs del sistema GREEN
├── .env.staging               # Configuración frontend GREEN
├── staging.env                # Configuración backend GREEN
├── control-green.sh           # Script de control profesional
└── vite.config.js             # Configuración Vite para staging
```

## 🚀 Uso del Sistema

### **1. Levantar Sistema GREEN**

```bash
# Ejecutar script de control
./control-green.sh

# Seleccionar opción 1: Levantar sistema GREEN completo
```

### **2. Probar Cambios**

```bash
# Acceder al sistema GREEN
# Frontend: http://192.168.130.149:3001
# Backend:  http://192.168.130.149:3003

# Probar funcionalidades
curl http://localhost:3003/api/health
```

### **3. Bajar Sistema GREEN**

```bash
# Ejecutar script de control
./control-green.sh

# Seleccionar opción 2: Bajar sistema GREEN
```

## 🔧 Configuración

### **Variables de Entorno**

#### **Frontend GREEN (.env.staging)**
```bash
VITE_API_URL=http://localhost:3003
VITE_ENV=staging
VITE_APP_NAME=MundoGrafic Staging
```

#### **Backend GREEN (staging.env)**
```bash
NODE_ENV=staging
PORT=3003
FRONTEND_PORT=3001
DB_NAME=sistema_mg_staging
DB_USER=postgres
DB_PASSWORD=2024Asdaspro@
```

### **Vite Configuration**

El archivo `vite.config.js` está configurado para soportar múltiples modos:

```javascript
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'staging',
    },
    server: {
      host: mode === 'staging' ? '0.0.0.0' : 'localhost',
      port: mode === 'staging' ? 3001 : 3000,
    },
  }
})
```

## 🎮 Script de Control

### **Opciones Disponibles**

1. **🚀 Levantar sistema GREEN completo**
   - Build del frontend para staging
   - Inicio del backend GREEN
   - Servir frontend desde build optimizado

2. **🛑 Bajar sistema GREEN**
   - Detener backend GREEN
   - Detener frontend GREEN
   - Limpiar procesos

3. **📊 Ver estado**
   - Verificar puertos abiertos
   - Verificar procesos activos
   - Pruebas de conectividad

4. **📝 Ver logs**
   - Logs del backend GREEN
   - Logs del frontend GREEN
   - Instrucciones para logs en tiempo real

5. **🌐 Acceso local y red**
   - URLs de acceso local
   - URLs de acceso de red
   - Comandos de prueba

6. **🔄 Actualizar sistema GREEN**
   - Obtener cambios del repositorio
   - Reinstalar dependencias si es necesario
   - Reiniciar sistema actualizado

7. **🧪 Pruebas rápidas**
   - Verificación de puertos
   - Health check del backend
   - Prueba del frontend
   - Verificación de base de datos

## 🔄 Flujo de Trabajo

### **1. Desarrollo**
```bash
# Hacer cambios en tu máquina local
git add .
git commit -m "Nueva funcionalidad"
git push origin main
```

### **2. En el Servidor**
```bash
# Obtener cambios
cd ~/MundoGrafic
git pull origin main

# Levantar GREEN para probar
./control-green.sh
# Seleccionar opción 1
```

### **3. Pruebas**
- Acceder a http://192.168.130.149:3001
- Verificar que los cambios funcionen
- Probar todas las funcionalidades

### **4. Limpieza**
```bash
# Bajar GREEN después de las pruebas
./control-green.sh
# Seleccionar opción 2
```

## 🛡️ Seguridad

### **Firewall**
- **Puerto 3000**: Frontend BLUE (público)
- **Puerto 3002**: Backend BLUE (público)
- **Puerto 3001**: Frontend GREEN (solo red local)
- **Puerto 3003**: Backend GREEN (solo red local)

### **Base de Datos**
- **BLUE**: `sistema_mg_production` (datos reales)
- **GREEN**: `sistema_mg_staging` (datos de prueba)

## 📊 Monitoreo

### **Logs**
```bash
# Ver logs del backend GREEN
tail -f staging/logs/backend.log

# Ver logs del frontend GREEN
tail -f staging/logs/frontend.log
```

### **Estado de Servicios**
```bash
# Verificar puertos
sudo netstat -tlnp | grep -E ':(3000|3001|3002|3003)'

# Verificar procesos
ps aux | grep -E "(staging|serve)"
```

## 🚨 Troubleshooting

### **Problemas Comunes**

#### **1. Puerto en uso**
```bash
# Verificar qué está usando el puerto
sudo netstat -tlnp | grep :3001

# Matar proceso si es necesario
sudo kill -9 <PID>
```

#### **2. Backend no responde**
```bash
# Verificar logs
tail -f staging/logs/backend.log

# Verificar configuración
cat staging/backend/.env
```

#### **3. Frontend no carga**
```bash
# Verificar build
ls -la dist/

# Rebuild si es necesario
npm run build -- --mode staging
```

#### **4. Base de datos no conecta**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar base de datos
psql -U postgres -d sistema_mg_staging
```

## ✅ Ventajas del Sistema

### **Profesional**
- ✅ **Un solo código base**: Mantenimiento simple
- ✅ **Builds optimizados**: Diferentes configuraciones
- ✅ **Eficiente**: No duplicación de código
- ✅ **Configurable**: Variables de entorno
- ✅ **Estándar**: Práctica profesional

### **Seguro**
- ✅ **Aislamiento**: Sistemas completamente separados
- ✅ **Datos protegidos**: Base de datos de prueba
- ✅ **Acceso controlado**: Solo red local para staging

### **Eficiente**
- ✅ **Recursos optimizados**: Solo levantar cuando se necesita
- ✅ **Despliegue rápido**: Builds optimizados
- ✅ **Fácil mantenimiento**: Script de control automatizado

## 🎯 Próximos Pasos

1. **Automatización**: Integrar con CI/CD
2. **Monitoreo**: Agregar métricas y alertas
3. **Backup**: Automatizar respaldos de staging
4. **Testing**: Integrar tests automatizados

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs: `./control-green.sh` → opción 4
2. Verificar estado: `./control-green.sh` → opción 3
3. Ejecutar pruebas: `./control-green.sh` → opción 7

---

**🎉 ¡Sistema Blue-Green Deployment Profesional implementado exitosamente!**
