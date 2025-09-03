# 🔵🟢 Configuración de Puertos - Sistema Blue-Green

## 📋 Resumen de Configuración

### 🔵 Sistema BLUE (Producción) - NO TOCAR
- **Frontend**: Puerto 3000
- **Backend**: Puerto 3002
- **Base de datos**: sistema_mg (producción)
- **Estado**: FUNCIONANDO - NO INTERFERIR

### 🟢 Sistema GREEN (Staging) - NUEVO
- **Frontend**: Puerto 3001
- **Backend**: Puerto 3003
- **Base de datos**: sistema_mg_staging
- **Estado**: NUEVO - SIN CONFLICTOS

## 🚨 Por Qué Esta Configuración

### ❌ Problema Original:
```
Sistema Blue (Producción):   Puerto 3000 + 3002
Sistema Green (Staging):     Puerto 3000 + 3002  ← CONFLICTO!
```

### ✅ Solución Implementada:
```
Sistema Blue (Producción):   Puerto 3000 + 3002  ← FUNCIONANDO
Sistema Green (Staging):     Puerto 3001 + 3003  ← SIN CONFLICTOS
```

## 🌐 URLs de Acceso

### 🔵 Producción (BLUE):
- Frontend: http://localhost:3000
- Backend: http://localhost:3002

### 🟢 Staging (GREEN):
- Frontend: http://localhost:3001
- Backend: http://localhost:3003
- Nginx: http://localhost:8080

## 🔧 Archivos de Configuración

### 1. Tu `.env.green` (NO CAMBIAR):
```bash
NODE_ENV=staging
PORT=3002          # ← Este puerto NO se usará para staging
DB_NAME=sistema_mg_staging
DB_USER=postgres
DB_PASSWORD=2024Asdaspro@
```

### 2. Nuevo `staging.env` (PARA STAGING):
```bash
NODE_ENV=staging
PORT=3003          # ← Puerto diferente para evitar conflictos
FRONTEND_PORT=3001 # ← Puerto diferente para evitar conflictos
DB_NAME=sistema_mg_staging
DB_USER=postgres
DB_PASSWORD=2024Asdaspro@
```

## 🎯 Ventajas de Esta Configuración

1. **✅ Sin conflictos**: Ambos sistemas funcionan simultáneamente
2. **✅ Producción intacta**: Sistema blue no se ve afectado
3. **✅ Staging funcional**: Sistema green funciona independientemente
4. **✅ Base de datos separada**: sistema_mg_staging para pruebas
5. **✅ Testing completo**: Puedes probar todo sin riesgos

## 🚀 Cómo Usar

### 1. Verificar compatibilidad:
```bash
./setup-compatibility-green.sh
```

### 2. Instalar staging:
```bash
./install-staging-complete.sh
```

### 3. Acceder a staging:
- Frontend: http://localhost:3001
- Backend: http://localhost:3003
- Nginx: http://localhost:8080

## 🔍 Monitoreo de Puertos

### Verificar que no hay conflictos:
```bash
# Ver puertos en uso
sudo netstat -tlnp | grep -E ':(3000|3001|3002|3003|8080)'

# Resultado esperado:
# 3000: Frontend Producción (BLUE)
# 3001: Frontend Staging (GREEN)
# 3002: Backend Producción (BLUE)
# 3003: Backend Staging (GREEN)
# 8080: Nginx Staging
```

## ⚠️ Notas Importantes

1. **NO cambiar** los puertos de producción (3000, 3002)
2. **NO modificar** tu archivo `.env.green` existente
3. **El sistema de staging** usará `staging.env` con puertos diferentes
4. **Ambos sistemas** pueden funcionar simultáneamente
5. **Base de datos** `sistema_mg_staging` es independiente

## 🎉 Resultado Final

- **🔵 Sistema Blue**: Funciona en puertos 3000+3002 (producción)
- **🟢 Sistema Green**: Funciona en puertos 3001+3003 (staging)
- **✅ Sin conflictos**: Ambos sistemas operativos simultáneamente
- **✅ Testing completo**: Puedes probar todo en staging
- **✅ Producción segura**: Sistema blue no se ve afectado

---

**¡Configuración perfecta para desarrollo y testing sin riesgos!** 🚀
