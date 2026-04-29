const ACTION_TEXT = {
  crear: 'crear',
  leer: 'ver',
  editar: 'editar',
  eliminar: 'eliminar',
};

const MODULE_TEXT = {
  clientes: 'clientes',
  cotizaciones: 'cotizaciones',
  ordenes_trabajo: 'ordenes de trabajo',
  produccion: 'produccion',
  inventario: 'inventario',
  usuarios: 'usuarios',
  reportes: 'reportes',
  certificados: 'certificados',
  roles: 'roles',
  areas: 'areas',
  'catalogo-procesos': 'catalogo de procesos',
  'tipos-trabajo': 'tipos de trabajo',
};

const normalizeModuleText = (modulo) => {
  if (!modulo) return '';
  return MODULE_TEXT[modulo] || modulo.replace(/[_-]+/g, ' ');
};

export const buildPermissionDeniedMessage = ({
  accion,
  modulo,
  customActionText,
  fallbackMessage,
} = {}) => {
  if (fallbackMessage) return fallbackMessage;

  const actionText = customActionText || ACTION_TEXT[accion] || 'realizar esta accion';
  const moduleText = normalizeModuleText(modulo);
  const targetText = moduleText ? ` en ${moduleText}` : '';

  return `Este usuario no tiene permisos para ${actionText}${targetText}. Contacte a su administrador.`;
};
