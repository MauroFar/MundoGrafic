# Manual de Usuario - Modulo de Cotizaciones

## 1. Informacion del documento
- Nombre: Manual de Usuario del Modulo de Cotizaciones
- Sistema: MundoGrafic
- Version: 1.0
- Fecha: 28/04/2026
- Alcance: Uso funcional de la interfaz de Cotizaciones (creacion, consulta, edicion y gestion)

## 2. Objetivo
Este manual explica como usar el modulo de Cotizaciones para:
- Crear cotizaciones
- Editar cotizaciones existentes
- Consultar detalles
- Descargar y enviar cotizaciones
- Aprobar cotizaciones
- Generar ordenes de trabajo desde cotizaciones aprobadas

## 3. Perfil de usuario
Este modulo esta orientado a:
- Ejecutivos comerciales
- Personal de ventas
- Usuarios administrativos con permisos sobre cotizaciones

Nota: Algunas acciones como editar y eliminar dependen de permisos del usuario.

## 4. Acceso al modulo
1. Iniciar sesion en el sistema.
2. Ir al menu de Cotizaciones.
3. Elegir una opcion:
- Nueva Cotizacion
- Ver Cotizaciones

## 5. Pantalla Ver Cotizaciones
En esta pantalla se visualiza el listado general y se realizan acciones de gestion.

### 5.1 Filtros disponibles
- Buscar por N° o Cliente
- Fecha Desde
- Fecha Hasta
- Buscar en toda la base de datos
- Limpiar Filtros
- Buscar

### 5.2 Columnas del listado
- Numero
- Cliente
- Descripcion
- Fecha
- Total
- Estado
- Acciones

### 5.3 Estados de cotizacion
- pendiente
- aprobada
- rechazada

### 5.4 Acciones por cada cotizacion
- Vista previa PDF
- Editar
- Eliminar
- Descargar PDF
- Enviar Correo
- Aprobar (solo si estado = pendiente)
- Orden (solo si estado = aprobada)

## 6. Crear una nueva cotizacion
Desde Nueva Cotizacion, completar la informacion en el siguiente orden:

### 6.1 Encabezado
1. Verificar el numero de cotizacion sugerido.
2. Seleccionar RUC.

### 6.2 Datos del cliente
1. Ingresar Empresa Cliente.
2. Seleccionar cliente desde sugerencias o desde el boton Ver Clientes.
3. Registrar Contacto (opcional, activando el checkbox).
4. Definir Fecha.
5. Completar Ejecutivo de Cuenta.
6. Registrar Celular (opcional).

### 6.3 Productos o items
1. Clic en Agregar Producto.
2. Completar Cantidad.
3. Completar Detalle del item.
4. Ingresar Valor Unitario.
5. Verificar Total por linea.
6. Usar Calcular para abrir el modal de procesos de produccion cuando se requiera.
7. Eliminar item si no corresponde.

### 6.4 Imagenes por item (opcional)
Puede agregar imagenes por cada item mediante:
- Subida de archivo
- Pegar imagen con Ctrl+V
- Arrastrar y soltar

Adicionalmente puede:
- Ajustar tamano de imagen
- Definir posicion (debajo o derecha)
- Definir alineacion de imagenes (horizontal o vertical)

### 6.5 Condiciones comerciales
Completar los campos:
- Tiempo de Entrega
- Forma de Pago
- Validez de Proforma
- Observaciones

### 6.6 Totales
Puede gestionar:
- Subtotal
- IVA 15%
- Descuento
- Total

Si desea ocultar montos, activar la opcion Desactivar Totales.

### 6.7 Guardado
- Guardar Cotizacion: crea un nuevo registro.
- Actualizar Cotizacion: guarda cambios de una cotizacion existente.
- Guardar como Nueva: duplica informacion y crea una nueva cotizacion con nuevo codigo.

## 7. Flujo cuando el cliente no existe
Si la empresa ingresada no existe:
1. El sistema muestra una confirmacion.
2. Seleccionar crear cliente.
3. Completar datos del nuevo cliente.
4. Guardar y continuar.
5. El sistema retoma el guardado de la cotizacion.

## 8. Edicion de cotizaciones
1. Ir a Ver Cotizaciones.
2. Clic en Editar.
3. Modificar datos requeridos.
4. Guardar con Actualizar Cotizacion.

## 9. Vista de detalle de cotizacion
Al hacer clic sobre una cotizacion del listado, se abre un modal de detalle con:
- Datos de cliente
- Datos comerciales (fecha, RUC, entrega, pago, validez)
- Productos y valores
- Resumen de totales
- Observaciones
- Auditoria (creado por, fecha de creacion, ultima modificacion)

## 10. Descargar PDF
1. En Ver Cotizaciones, seleccionar Descargar PDF.
2. El sistema genera el archivo de la cotizacion.
3. Segun el navegador, permite elegir ubicacion o descargar automaticamente.

## 11. Enviar cotizacion por correo
1. Seleccionar Enviar Correo.
2. Agregar destinatarios principales (To).
3. Opcional: agregar CC y BCC.
4. Definir asunto y mensaje.
5. Confirmar envio.

Reglas:
- Debe existir al menos un destinatario principal.
- Todos los correos deben tener formato valido.

## 12. Aprobacion de cotizacion
1. Si la cotizacion esta pendiente, seleccionar Aprobar.
2. Confirmar la accion en el modal.
3. El estado cambia a aprobada.
4. Se habilita la opcion de generar orden de trabajo.

## 13. Generar Orden de Trabajo desde cotizacion aprobada
1. Seleccionar Orden en una cotizacion aprobada.
2. Elegir tipo de orden:
- Offset
- Digital
3. Si la cotizacion tiene un solo producto, el sistema continua automaticamente.
4. Si tiene varios productos, seleccionar uno o varios y continuar.

## 14. Validaciones funcionales importantes
Para guardar una cotizacion correctamente:
- Debe seleccionar RUC.
- Debe ingresar Empresa Cliente.
- Debe existir al menos un item valido con:
  - Detalle
  - Cantidad mayor a 0
  - Valor unitario mayor a 0

Para enviar correo:
- Debe existir al menos un destinatario principal.
- Todos los correos deben ser validos.

## 15. Buenas practicas de uso
- Revisar datos del cliente antes de guardar.
- Validar ortografia y formato del detalle de items.
- Usar Vista previa PDF antes de enviar.
- Confirmar que la cotizacion este aprobada antes de generar orden.
- Documentar condiciones especiales en Observaciones.

## 16. Problemas frecuentes y solucion
### 16.1 No se puede guardar cotizacion
Verificar:
- RUC seleccionado
- Empresa cliente ingresada
- Al menos un item completo y valido

### 16.2 No aparece la opcion Orden
Causa probable: la cotizacion aun esta pendiente.
Solucion: aprobar la cotizacion.

### 16.3 Error al enviar correo
Verificar:
- Formato de emails
- Que exista al menos un destinatario principal
- Configuracion de correo del usuario

### 16.4 PDF no se visualiza o descarga
Intentar:
- Reintentar la vista previa
- Descargar nuevamente
- Probar con otro navegador

## 17. Control de cambios
- v1.0 (28/04/2026): Documento inicial del modulo de Cotizaciones.
