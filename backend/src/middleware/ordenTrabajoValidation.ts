import { Request, Response, NextFunction } from 'express';

interface ValidationError {
  field: string;
  message: string;
}

export const validateOrdenTrabajo = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 VALIDACIÓN - Datos recibidos:', JSON.stringify(req.body, null, 2));

  // Función para asegurar que los valores sean strings
  const asegurarString = (valor: any): string => {
    if (valor === null || valor === undefined) return '';
    if (typeof valor === 'string') return valor;
    return String(valor);
  };

  const errors: ValidationError[] = [];
  const {
    nombre_cliente,
    concepto,
    cantidad,
    fecha_creacion,
    fecha_entrega,
    telefono,
    email,
    // Nuevos campos de trabajo - extraer del objeto detalle
    detalle
  } = req.body;

  console.log('🔍 VALIDACIÓN - Detalle extraído:', JSON.stringify(detalle, null, 2));

  // Extraer campos del detalle si existe
  const material = detalle?.material;
  const corteMaterial = detalle?.corte_material;
  const cantidadPliegosCompra = detalle?.cantidad_pliegos_compra;
  const exceso = detalle?.exceso;
  const tamanoAbierto1 = detalle?.tamano_abierto_1;
  const tamanoCerrado1 = detalle?.tamano_cerrado_1;
  const impresion = detalle?.impresion;
  const instruccionesImpresion = detalle?.instrucciones_impresion;
  const instruccionesAcabados = detalle?.instrucciones_acabados;
  const instruccionesEmpacado = detalle?.instrucciones_empacado;
  const prensaSeleccionada = detalle?.prensa_seleccionada;

  console.log('🔍 VALIDACIÓN - Campos extraídos:', {
    material, corteMaterial, cantidadPliegosCompra, exceso,
    tamanoAbierto1, tamanoCerrado1, impresion, instruccionesImpresion,
    instruccionesAcabados, instruccionesEmpacado, prensaSeleccionada
  });

  // Validaciones generales (solo campos esenciales son obligatorios)
  const nombreClienteStr = asegurarString(nombre_cliente);
  const conceptoSrt = asegurarString(concepto);
  const cantidadStr = asegurarString(cantidad);
  const fechaCreacionStr = asegurarString(fecha_creacion);
  const fechaEntregaStr = asegurarString(fecha_entrega);
  const telefonoStr = asegurarString(telefono);
  const emailStr = asegurarString(email);

  if (!nombreClienteStr.trim()) {
    errors.push({ field: 'nombre_cliente', message: 'El campo Cliente es obligatorio' });
  }

  if (!conceptoSrt.trim()) {
    errors.push({ field: 'concepto', message: 'El campo Concepto es obligatorio' });
  }

  if (!cantidadStr.trim() || isNaN(Number(cantidadStr))) {
    errors.push({ field: 'cantidad', message: 'La Cantidad debe ser un número válido' });
  }

  // Fechas opcionales pero si se proporcionan deben ser válidas
  if (fechaCreacionStr && !fechaCreacionStr.trim()) {
    errors.push({ field: 'fecha_creacion', message: 'La Fecha de Creación no puede estar vacía si se proporciona' });
  }

  if (fechaEntregaStr && !fechaEntregaStr.trim()) {
    errors.push({ field: 'fecha_entrega', message: 'La Fecha de Entrega no puede estar vacía si se proporciona' });
  }

  // Teléfono y email opcionales pero si se proporcionan deben ser válidos
  if (telefonoStr && !telefonoStr.trim()) {
    errors.push({ field: 'telefono', message: 'El campo Teléfono no puede estar vacío si se proporciona' });
  }

  if (emailStr && !emailStr.trim()) {
    errors.push({ field: 'email', message: 'El campo Email no puede estar vacío si se proporciona' });
  } else if (emailStr && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailStr)) {
    errors.push({ field: 'email', message: 'El Email no es válido' });
  }

  // Validaciones de nuevos campos de trabajo (solo validar formato si están presentes)
  const materialStr = asegurarString(material);
  const corteMaterialStr = asegurarString(corteMaterial);
  const cantidadPliegosCompraStr = asegurarString(cantidadPliegosCompra);
  const excesoStr = asegurarString(exceso);
  const tamanoAbierto1Str = asegurarString(tamanoAbierto1);
  const tamanoCerrado1Str = asegurarString(tamanoCerrado1);
  const impresionStr = asegurarString(impresion);
  const instruccionesImpresionStr = asegurarString(instruccionesImpresion);
  const instruccionesAcabadosStr = asegurarString(instruccionesAcabados);
  const instruccionesEmpacadoStr = asegurarString(instruccionesEmpacado);
  const prensaSeleccionadaStr = asegurarString(prensaSeleccionada);

  if (materialStr && !materialStr.trim()) {
    errors.push({ field: 'material', message: 'El campo Material no puede estar vacío si se proporciona' });
  }

  if (corteMaterialStr && !corteMaterialStr.trim()) {
    errors.push({ field: 'corteMaterial', message: 'El campo Corte de Material no puede estar vacío si se proporciona' });
  }

  if (cantidadPliegosCompraStr && (!cantidadPliegosCompraStr.trim() || isNaN(Number(cantidadPliegosCompraStr)))) {
    errors.push({ field: 'cantidadPliegosCompra', message: 'La Cantidad de Pliegos de Compra debe ser un número válido' });
  }

  if (excesoStr && (!excesoStr.trim() || isNaN(Number(excesoStr)))) {
    errors.push({ field: 'exceso', message: 'El Exceso debe ser un número válido' });
  }

  if (tamanoAbierto1Str && !tamanoAbierto1Str.trim()) {
    errors.push({ field: 'tamanoAbierto1', message: 'El campo Tamaño Abierto no puede estar vacío si se proporciona' });
  }

  if (tamanoCerrado1Str && !tamanoCerrado1Str.trim()) {
    errors.push({ field: 'tamanoCerrado1', message: 'El campo Tamaño Cerrado no puede estar vacío si se proporciona' });
  }

  if (impresionStr && !impresionStr.trim()) {
    errors.push({ field: 'impresion', message: 'El campo Impresión no puede estar vacío si se proporciona' });
  }

  if (instruccionesImpresionStr && !instruccionesImpresionStr.trim()) {
    errors.push({ field: 'instruccionesImpresion', message: 'El campo Instrucciones de Impresión no puede estar vacío si se proporciona' });
  }

  if (instruccionesAcabadosStr && !instruccionesAcabadosStr.trim()) {
    errors.push({ field: 'instruccionesAcabados', message: 'El campo Instrucciones de Acabados no puede estar vacío si se proporciona' });
  }

  if (instruccionesEmpacadoStr && !instruccionesEmpacadoStr.trim()) {
    errors.push({ field: 'instruccionesEmpacado', message: 'El campo Instrucciones de Empacado no puede estar vacío si se proporciona' });
  }

  if (prensaSeleccionadaStr && !prensaSeleccionadaStr.trim()) {
    errors.push({ field: 'prensaSeleccionada', message: 'El campo Prensa no puede estar vacío si se proporciona' });
  }

  // Validaciones adicionales de formato
  if (cantidadPliegosCompraStr && Number(cantidadPliegosCompraStr) < 0) {
    errors.push({ field: 'cantidadPliegosCompra', message: 'La Cantidad de Pliegos de Compra no puede ser negativa' });
  }

  if (excesoStr && Number(excesoStr) < 0) {
    errors.push({ field: 'exceso', message: 'El Exceso no puede ser negativo' });
  }

  if (cantidadStr && Number(cantidadStr) <= 0) {
    errors.push({ field: 'cantidad', message: 'La Cantidad debe ser mayor a 0' });
  }

  // Validación de fechas
  if (fechaCreacionStr && fechaEntregaStr) {
    const fechaCreacion = new Date(fechaCreacionStr);
    const fechaEntrega = new Date(fechaEntregaStr);
    
    if (fechaEntrega < fechaCreacion) {
      errors.push({ field: 'fecha_entrega', message: 'La Fecha de Entrega no puede ser anterior a la Fecha de Creación' });
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDACIÓN FALLÓ - Errores encontrados:', errors);
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors
    });
  }

  console.log('✅ VALIDACIÓN EXITOSA - Todos los campos son válidos');
  next();
};

export const validateOrdenTrabajoUpdate = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 VALIDACIÓN UPDATE - Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  // Función para asegurar que los valores sean strings
  const asegurarString = (valor: any): string => {
    if (valor === null || valor === undefined) return '';
    if (typeof valor === 'string') return valor;
    return String(valor);
  };
  
  const errors: ValidationError[] = [];
  const {
    nombre_cliente,
    concepto,
    cantidad,
    fecha_creacion,
    fecha_entrega,
    telefono,
    email,
    // Nuevos campos de trabajo - extraer del objeto detalle
    detalle
  } = req.body;

  console.log('🔍 VALIDACIÓN UPDATE - Detalle extraído:', JSON.stringify(detalle, null, 2));

  // Extraer campos del detalle si existe
  const material = detalle?.material;
  const corteMaterial = detalle?.corte_material;
  const cantidadPliegosCompra = detalle?.cantidad_pliegos_compra;
  const exceso = detalle?.exceso;
  const tamanoAbierto1 = detalle?.tamano_abierto_1;
  const tamanoCerrado1 = detalle?.tamano_cerrado_1;
  const impresion = detalle?.impresion;
  const instruccionesImpresion = detalle?.instrucciones_impresion;
  const instruccionesAcabados = detalle?.instrucciones_acabados;
  const instruccionesEmpacado = detalle?.instrucciones_empacado;
  const prensaSeleccionada = detalle?.prensa_seleccionada;

  // Convertir todos los campos a strings para validación segura
  const nombreClienteStr = asegurarString(nombre_cliente);
  const conceptoSrt = asegurarString(concepto);
  const cantidadStr = asegurarString(cantidad);
  const telefonoStr = asegurarString(telefono);
  const emailStr = asegurarString(email);

  // Validaciones generales (más flexibles para actualización)
  if (nombre_cliente !== undefined && !nombreClienteStr.trim()) {
    errors.push({ field: 'nombre_cliente', message: 'El campo Cliente no puede estar vacío' });
  }

  if (concepto !== undefined && !conceptoSrt.trim()) {
    errors.push({ field: 'concepto', message: 'El campo Concepto no puede estar vacío' });
  }

  if (cantidad !== undefined && (!cantidadStr.trim() || isNaN(Number(cantidadStr)))) {
    errors.push({ field: 'cantidad', message: 'La Cantidad debe ser un número válido' });
  }

  if (telefono !== undefined && !telefonoStr.trim()) {
    errors.push({ field: 'telefono', message: 'El campo Teléfono no puede estar vacío' });
  }

  if (email !== undefined) {
    if (!emailStr.trim()) {
      errors.push({ field: 'email', message: 'El campo Email no puede estar vacío' });
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailStr)) {
      errors.push({ field: 'email', message: 'El Email no es válido' });
    }
  }

  // Convertir campos del detalle a strings para validación segura
  const materialStr = asegurarString(material);
  const corteMaterialStr = asegurarString(corteMaterial);
  const cantidadPliegosCompraStr = asegurarString(cantidadPliegosCompra);
  const excesoStr = asegurarString(exceso);
  const tamanoAbierto1Str = asegurarString(tamanoAbierto1);
  const tamanoCerrado1Str = asegurarString(tamanoCerrado1);
  const impresionStr = asegurarString(impresion);
  const instruccionesImpresionStr = asegurarString(instruccionesImpresion);
  const instruccionesAcabadosStr = asegurarString(instruccionesAcabados);
  const instruccionesEmpacadoStr = asegurarString(instruccionesEmpacado);
  const prensaSeleccionadaStr = asegurarString(prensaSeleccionada);

  // Validaciones de nuevos campos de trabajo (solo si se proporcionan)
  if (material !== undefined && !materialStr.trim()) {
    errors.push({ field: 'material', message: 'El campo Material no puede estar vacío' });
  }

  if (corteMaterial !== undefined && !corteMaterialStr.trim()) {
    errors.push({ field: 'corteMaterial', message: 'El campo Corte de Material no puede estar vacío' });
  }

  if (cantidadPliegosCompra !== undefined && (!cantidadPliegosCompraStr.trim() || isNaN(Number(cantidadPliegosCompraStr)))) {
    errors.push({ field: 'cantidadPliegosCompra', message: 'La Cantidad de Pliegos de Compra debe ser un número válido' });
  }

  if (exceso !== undefined && (!excesoStr.trim() || isNaN(Number(excesoStr)))) {
    errors.push({ field: 'exceso', message: 'El Exceso debe ser un número válido' });
  }

  if (tamanoAbierto1 !== undefined && !tamanoAbierto1Str.trim()) {
    errors.push({ field: 'tamanoAbierto1', message: 'El campo Tamaño Abierto no puede estar vacío' });
  }

  if (tamanoCerrado1 !== undefined && !tamanoCerrado1Str.trim()) {
    errors.push({ field: 'tamanoCerrado1', message: 'El campo Tamaño Cerrado no puede estar vacío' });
  }

  if (impresion !== undefined && !impresionStr.trim()) {
    errors.push({ field: 'impresion', message: 'El campo Impresión no puede estar vacío' });
  }

  if (instruccionesImpresion !== undefined && !instruccionesImpresionStr.trim()) {
    errors.push({ field: 'instruccionesImpresion', message: 'El campo Instrucciones de Impresión no puede estar vacío' });
  }

  if (instruccionesAcabados !== undefined && !instruccionesAcabadosStr.trim()) {
    errors.push({ field: 'instruccionesAcabados', message: 'El campo Instrucciones de Acabados no puede estar vacío' });
  }

  if (instruccionesEmpacado !== undefined && !instruccionesEmpacadoStr.trim()) {
    errors.push({ field: 'instruccionesEmpacado', message: 'El campo Instrucciones de Empacado no puede estar vacío' });
  }

  if (prensaSeleccionada !== undefined && !prensaSeleccionadaStr.trim()) {
    errors.push({ field: 'prensaSeleccionada', message: 'El campo Prensa no puede estar vacío' });
  }

  // Validaciones adicionales de formato (solo si se proporcionan)
  if (cantidadPliegosCompra !== undefined && Number(cantidadPliegosCompraStr) < 0) {
    errors.push({ field: 'cantidadPliegosCompra', message: 'La Cantidad de Pliegos de Compra no puede ser negativa' });
  }

  if (exceso !== undefined && Number(excesoStr) < 0) {
    errors.push({ field: 'exceso', message: 'El Exceso no puede ser negativo' });
  }

  if (cantidad !== undefined && Number(cantidadStr) <= 0) {
    errors.push({ field: 'cantidad', message: 'La Cantidad debe ser mayor a 0' });
  }

  // Validación de fechas (solo si ambas se proporcionan)
  if (fecha_creacion && fecha_entrega) {
    const fechaCreacion = new Date(fecha_creacion);
    const fechaEntrega = new Date(fecha_entrega);
    
    if (fechaEntrega < fechaCreacion) {
      errors.push({ field: 'fecha_entrega', message: 'La Fecha de Entrega no puede ser anterior a la Fecha de Creación' });
    }
  }

  if (errors.length > 0) {
    console.log('❌ VALIDACIÓN UPDATE FALLÓ - Errores encontrados:', errors);
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors
    });
  }

  console.log('✅ VALIDACIÓN UPDATE EXITOSA - Todos los campos son válidos');
  next();
};
