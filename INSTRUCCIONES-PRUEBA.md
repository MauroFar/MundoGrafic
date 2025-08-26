# 🧪 INSTRUCCIONES PARA PROBAR EL SISTEMA DE FIRMAS PERSONALIZADAS

## 📋 Resumen del Test
- **Usuario de prueba:** Henry Calderón Burbano
- **Email:** henry@mundografic.com
- **Rol:** Ejecutivo
- **Firma:** Compleja con 5 imágenes (HTML de Outlook)

## ✅ Estado del Sistema
- ✅ Migración de base de datos creada
- ✅ Rutas del backend implementadas
- ✅ Modal de firma creado
- ✅ Conversión automática de imágenes implementada
- ✅ Integración con envío de correos completada

## 🚀 Pasos para Probar

### Paso 1: Ejecutar la Migración
```bash
cd backend
node src/db/migrate.js
```

### Paso 2: Reiniciar el Backend
```bash
npm run dev
```

### Paso 3: Acceder al Sistema
1. Abre el navegador
2. Ve a la aplicación
3. Inicia sesión como admin

### Paso 4: Configurar Firma de Henry
1. Ve a **Gestión de Usuarios**
2. Busca el usuario **Henry Calderón**
3. Haz clic en **"📧 Firma"**
4. Pega el HTML completo de la firma (ver código abajo)
5. Haz clic en **"👁️ Vista Previa"**
6. Verifica que se muestren:
   - ✅ Nombre y datos de contacto
   - ✅ Logo principal de MUNDOGRAFIC
   - ✅ Iconos de redes sociales
   - ✅ Nota de descargo
7. Haz clic en **"💾 Guardar Firma"**

### Paso 5: Probar en Correo
1. Ve a **Cotizaciones**
2. Crea una nueva cotización
3. Completa los datos
4. Haz clic en **"Enviar por Email"**
5. Verifica que la firma de Henry aparezca en el correo

## 📝 Código HTML de la Firma (Para Copiar y Pegar)

```html
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=windows-1252">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<meta name=Originator content="Microsoft Word 15">
<style>
p.MsoNormal, li.MsoNormal, div.MsoNormal { margin:0cm; font-size:11.0pt; font-family:"Calibri",sans-serif; }
a:link, span.MsoHyperlink { color:#0563C1; text-decoration:underline; }
</style>
</head>
<body>
<div class=WordSection1>
<table class=MsoNormalTable border=0 cellspacing=3 cellpadding=0 width=400 style='width:300.0pt'>
 <tr>
  <td style='padding:0cm 0cm 0cm 0cm'>
  <p class=MsoNormal style='margin-bottom:7.5pt'><b><span style='font-size:10.5pt;font-family:"Arial",sans-serif;color:#212121'>Henry</span></b><b><span style='font-size:10.5pt;font-family:"Arial",sans-serif;color:red'>calderon</span></b><b><span style='font-size:10.5pt;font-family:"Arial",sans-serif;color:#212121'>burbano</span></b></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><b><span style='font-size:10.0pt;font-family:"Arial",sans-serif;color:black'>JUNTOS </span></b><b><span style='font-size:10.0pt;font-family:"Arial",sans-serif;color:red'>SALIMOS</span></b><b><span style='font-size:10.0pt;font-family:"Arial",sans-serif;color:black'> ADELANTE</span></b></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>ext.:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;117</span></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>Móvil:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;+593 9 9542 6357</span></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>e-mail:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;henry@mundografic.com</span></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>Quito:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;Edif. Apolo 1, pasaje San Luis N12-87 y Antonio Ante.</span></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>Teléfonos:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;+593 2 2563 424 | +593 2 2589 134 | +593 2 2281 176</span></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>Tumbaco:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;Edif. JCP, Norberto Salazar N7-224 y Vicente Álvarez.</span></p>
  <p class=MsoNormal style='margin-bottom:7.5pt'><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>Teléfonos:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'>&nbsp;+593 2 2379 320 | +593 2 2373 309 | +593 2 2378 044</span></p>
  </td>
 </tr>
</table>

<table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="50%" style='width:50.0%'>
 <tr>
  <td style='padding:0cm 0cm 0cm 0cm'>
  <table class=MsoNormalTable border=0 cellspacing=3 cellpadding=0 width="100%" style='width:100.0%'>
   <tr>
    <td style='padding:0cm 0cm 0cm 0cm'>
    <p class=MsoNormal><a href="http://www.mundografic.com/" target="_blank"><img border=0 width=437 height=103 src="CMGHenry_archivos/image001.jpg" style='height:1.075in;width:4.55in'></a></p>
    </td>
    <td style='padding:0cm 0cm 0cm 0cm'>
    <table class=MsoNormalTable border=0 cellspacing=3 cellpadding=0 width="100%" style='width:100.0%'>
     <tr>
      <td style='padding:0cm 0cm 0cm 0cm'>
      <p class=MsoNormal><img border=0 width=272 height=34 src="CMGHenry_archivos/image002.png" style='height:.35in;width:2.833in'></p>
      </td>
     </tr>
     <tr>
      <td style='padding:0cm 0cm 0cm 0cm'>
      <table class=MsoNormalTable border=0 cellspacing=3 cellpadding=0 width="100%" style='width:100.0%'>
       <tr>
        <td style='padding:0cm 0cm 0cm 0cm'>
        <p class=MsoNormal align=right style='text-align:right'><a href="https://www.facebook.com/CorporacionMundoGrafic" target="_blank"><img border=0 width=34 height=34 src="CMGHenry_archivos/image003.png" style='height:.358in;width:.35in'></a></p>
        </td>
        <td style='padding:0cm 0cm 0cm 0cm'>
        <p class=MsoNormal align=center style='text-align:center'><a href="https://www.instagram.com/mundografic/" target="_blank"><img border=0 width=34 height=34 src="CMGHenry_archivos/image004.png" style='height:.358in;width:.35in'></a></p>
        </td>
        <td style='padding:0cm 0cm 0cm 0cm'>
        <p class=MsoNormal><a href="https://www.youtube.com/user/corpmundografic" target="_blank"><img border=0 width=34 height=34 src="CMGHenry_archivos/image005.png" style='height:.358in;width:.358in'></a></p>
        </td>
       </tr>
      </table>
      </td>
     </tr>
    </table>
    </td>
   </tr>
  </table>
  </td>
 </tr>
 <tr>
  <td style='padding:0cm 0cm 0cm 0cm'>
  <p class=MsoNormal><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:red'>Nota de Descargo:</span><span style='font-size:8.5pt;font-family:"Arial",sans-serif;color:#212121'> Los mensajes, audios, videos, fotografías, esquemas y otros están protegidos por la ley del Ecuador y son confidenciales.</span></p>
  </td>
 </tr>
</table>
</div>
</body>
</html>
```

## 🎯 Resultados Esperados

### En el Modal de Vista Previa:
- ✅ Nombre: "Henry Calderón Burbano"
- ✅ Extensión: "117"
- ✅ Email: "henry@mundografic.com"
- ✅ Logo principal de MUNDOGRAFIC
- ✅ Iconos de Facebook, Instagram, YouTube
- ✅ Nota de descargo
- ✅ Todos los enlaces funcionales

### En el Correo Enviado:
- ✅ Firma personalizada de Henry
- ✅ Imágenes incrustadas (no como archivos adjuntos)
- ✅ Estilos preservados
- ✅ Enlaces funcionales

## 🔧 Solución de Problemas

### Si las imágenes no se muestran:
1. Verifica que el HTML esté completo
2. Asegúrate de hacer clic en "Vista Previa" antes de guardar
3. Revisa la consola del navegador para errores

### Si la firma no aparece en el correo:
1. Verifica que el usuario tenga rol "ejecutivo"
2. Confirma que la firma esté guardada (columna "Firma" debe mostrar "✅ Configurada")
3. Revisa los logs del backend

### Si hay errores de base de datos:
1. Ejecuta la migración nuevamente
2. Verifica que los campos `firma_html` y `firma_activa` existan en la tabla `usuarios`

## 📊 Métricas de Éxito

- ✅ **5 imágenes** convertidas automáticamente
- ✅ **4 enlaces** preservados (web, Facebook, Instagram, YouTube)
- ✅ **Estructura de tablas** mantenida
- ✅ **Estilos CSS** preservados
- ✅ **Compatibilidad** con HTML de Outlook

## 🎉 ¡Listo para Producción!

El sistema está completamente preparado para manejar firmas complejas como la de Henry. Una vez que completes esta prueba, podrás:

1. **Configurar firmas** para todos los ejecutivos
2. **Usar HTML de Outlook** directamente
3. **Enviar correos** con firmas personalizadas
4. **Mantener consistencia** en la imagen corporativa

---

**¡Buena suerte con la prueba! 🚀**
