# 📧 Configuración de Emails por Usuario

## 🎯 Sistema Implementado

Cada usuario puede enviar correos desde su propia cuenta de Gmail usando credenciales personalizadas.

---

## 📋 Paso 1: Configurar usuario en la Base de Datos

### Campos necesarios en tabla `usuarios`:
- `email` → Email del usuario (puede ser corporativo o personal)
- `email_config` → Identificador único para buscar credenciales en .env

### SQL para actualizar usuarios:

```sql
-- Ver usuarios actuales
SELECT id, nombre, email, email_config FROM usuarios;

-- Actualizar email_config de cada usuario con un identificador único
-- Formato recomendado: NOMBRE o INICIALES en MAYÚSCULAS

-- Ejemplo para un usuario llamado "Mauro":
UPDATE usuarios 
SET email_config = 'MAURO' 
WHERE id = 8;

-- Ejemplo para más usuarios:
UPDATE usuarios SET email_config = 'HENRY' WHERE nombre = 'Henry';
UPDATE usuarios SET email_config = 'JUAN' WHERE nombre = 'Juan Pérez';
UPDATE usuarios SET email_config = 'MARIA' WHERE nombre = 'María López';
```

**⚠️ IMPORTANTE:** 
- El `email_config` debe ser ÚNICO por usuario
- Debe estar en MAYÚSCULAS
- Sin espacios (usa guiones si necesitas: `MARIA_LOPEZ`)

---

## 📋 Paso 2: Configurar credenciales en el .env

Para cada usuario, agrega DOS líneas en el archivo `backend/.env`:

### Formato:
```env
EMAIL_USER_[IDENTIFICADOR]=correo@gmail.com
EMAIL_PASSWORD_[IDENTIFICADOR]=contraseña_de_aplicacion_gmail
```

### Ejemplos reales:

```env
# Usuario: Mauro (email_config = 'MAURO')
EMAIL_USER_MAURO=maurohbdiezc@gmail.com
EMAIL_PASSWORD_MAURO=hgle zgbx mdqo pkxp

# Usuario: Henry (email_config = 'HENRY')
EMAIL_USER_HENRY=henry@gmail.com
EMAIL_PASSWORD_HENRY=xxxx xxxx xxxx xxxx

# Usuario: Juan (email_config = 'JUAN')
EMAIL_USER_JUAN=juanperez@gmail.com
EMAIL_PASSWORD_JUAN=yyyy yyyy yyyy yyyy
```

**⚠️ IMPORTANTE:**
- El identificador después de `EMAIL_USER_` debe coincidir EXACTAMENTE con `email_config` en la BD
- La contraseña NO es la contraseña normal de Gmail
- Debes generar una "Contraseña de Aplicación" en Gmail

---

## 📋 Paso 3: Generar Contraseña de Aplicación en Gmail

Para cada cuenta de Gmail que quieras usar:

1. **Ir a tu Cuenta de Google:**
   - https://myaccount.google.com/

2. **Seguridad → Verificación en dos pasos**
   - Debes tener activada la verificación en dos pasos primero

3. **Contraseñas de aplicaciones:**
   - Busca "Contraseñas de aplicaciones" en la barra de búsqueda
   - Selecciona "Correo" como aplicación
   - Selecciona "Otro" como dispositivo y escribe "Sistema MundoGrafic"
   - Copia la contraseña generada (16 caracteres con espacios)

4. **Pegar en .env:**
   ```env
   EMAIL_PASSWORD_MAURO=abcd efgh ijkl mnop
   ```

---

## 📋 Paso 4: Verificar la Configuración

### SQL para verificar usuarios:
```sql
SELECT 
    id,
    nombre,
    email,
    email_config,
    firma_activa
FROM usuarios
ORDER BY id;
```

### Checklist:
- [ ] Cada usuario tiene `email_config` único
- [ ] `email_config` está en MAYÚSCULAS
- [ ] En `.env` existe `EMAIL_USER_[CONFIG]` para cada usuario
- [ ] En `.env` existe `EMAIL_PASSWORD_[CONFIG]` para cada usuario
- [ ] Las contraseñas son de 16 caracteres (contraseñas de aplicación)
- [ ] Backend reiniciado después de modificar `.env`

---

## 🔧 Ejemplo Completo

### Base de Datos:
| id | nombre | email | email_config |
|----|--------|-------|-------------|
| 8 | Mauro Díaz | maurohbdiezc@gmail.com | MAURO |
| 9 | Henry García | henry@mundografic.com | HENRY |
| 10 | Juan Pérez | juanperez@gmail.com | JUAN |

### Archivo .env:
```env
# === CONFIGURACIÓN DE EMAILS POR USUARIO ===

# Mauro Díaz (ID: 8)
EMAIL_USER_MAURO=maurohbdiezc@gmail.com
EMAIL_PASSWORD_MAURO=hgle zgbx mdqo pkxp

# Henry García (ID: 9)
EMAIL_USER_HENRY=henry@mundografic.com
EMAIL_PASSWORD_HENRY=abcd efgh ijkl mnop

# Juan Pérez (ID: 10)
EMAIL_USER_JUAN=juanperez@gmail.com
EMAIL_PASSWORD_JUAN=wxyz abcd efgh ijkl
```

---

## 🚨 Troubleshooting

### Error: "No se encontraron credenciales de email"
**Causa:** El `email_config` en BD no coincide con el `.env`

**Solución:**
```sql
-- Ver qué tiene el usuario en BD
SELECT email_config FROM usuarios WHERE id = 8;

-- Si dice 'mauro' (minúsculas), cambiarlo a MAYÚSCULAS:
UPDATE usuarios SET email_config = 'MAURO' WHERE id = 8;

-- Verificar que .env tenga:
EMAIL_USER_MAURO=...
EMAIL_PASSWORD_MAURO=...
```

### Error: "Error de autenticación SMTP"
**Causa:** Contraseña incorrecta o no es contraseña de aplicación

**Solución:**
1. Verifica que la contraseña en `.env` sea de 16 caracteres
2. Genera una nueva contraseña de aplicación en Gmail
3. Verifica que Gmail tenga verificación en dos pasos activa

### Error: "Usuario no tiene email_config configurado"
**Causa:** El campo `email_config` está vacío o es NULL

**Solución:**
```sql
UPDATE usuarios 
SET email_config = 'NOMBREUSUARIO' 
WHERE id = [ID_DEL_USUARIO];
```

---

## 📊 Logs del Sistema

Cuando envías un correo, deberías ver en la consola del backend:

```
🔍 Buscando usuario con ID: 8
🔍 Email config: MAURO
🔑 EMAIL_USER_MAURO: ✅ Configurado
🔑 EMAIL_PASSWORD_MAURO: ✅ Configurado
✅ Usando credenciales de MAURO: maurohbdiezc@gmail.com
✅ Transporter verificado correctamente
📧 Correo enviado exitosamente
```

Si ves algún ❌, revisa la configuración correspondiente.

---

## 🔄 Agregar Nuevos Usuarios

Cuando crees un nuevo usuario en el panel de administración:

1. **Asignar email_config único:**
   ```sql
   UPDATE usuarios 
   SET email_config = 'NUEVOUSUARIO' 
   WHERE id = [ID_NUEVO_USUARIO];
   ```

2. **Agregar credenciales al .env:**
   ```env
   EMAIL_USER_NUEVOUSUARIO=nuevousuario@gmail.com
   EMAIL_PASSWORD_NUEVOUSUARIO=xxxx xxxx xxxx xxxx
   ```

3. **Reiniciar el backend:**
   ```bash
   # Detener y volver a iniciar el servidor
   ```

---

## ✅ Ventajas del Sistema

- ✅ Cada ejecutivo envía desde su propia cuenta
- ✅ Firmas personalizadas por usuario
- ✅ Trazabilidad de quién envió qué cotización
- ✅ Escalable: fácil agregar nuevos usuarios
- ✅ Seguro: credenciales separadas por usuario
- ✅ No expone contraseñas reales de Gmail

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del backend (consola)
2. Verifica la configuración con los SQL de este documento
3. Asegúrate de que el backend se haya reiniciado después de cambios en `.env`
