export type CrudAction = 'crear' | 'leer' | 'editar' | 'eliminar';

export interface CrudPermissionModule {
  id: string;
  nombre: string;
  descripcion: string;
}

// Catalogo centralizado de modulos con permisos CRUD.
// Para agregar una nueva interfaz administrable por permisos,
// basta con registrarla aqui y usar checkPermission en sus rutas.
export const CRUD_PERMISSION_MODULES: CrudPermissionModule[] = [
  { id: 'clientes', nombre: 'Clientes', descripcion: 'Gestion de clientes' },
  { id: 'cotizaciones', nombre: 'Cotizaciones', descripcion: 'Crear y gestionar cotizaciones' },
  { id: 'ordenes_trabajo', nombre: 'Ordenes de Trabajo', descripcion: 'Gestion de ordenes de trabajo' },
  { id: 'produccion', nombre: 'Produccion', descripcion: 'Modulos de produccion' },
  { id: 'inventario', nombre: 'Inventario', descripcion: 'Control de inventario' },
  { id: 'usuarios', nombre: 'Usuarios', descripcion: 'Gestion de usuarios' },
  { id: 'reportes', nombre: 'Reportes', descripcion: 'Ver y generar reportes' },
  { id: 'certificados', nombre: 'Certificados', descripcion: 'Gestion de certificados de calidad' },
];

export const ADMIN_PANEL_MODULES = [
  'usuarios',
  'roles',
  'areas',
  'catalogo-procesos',
  'tipos-trabajo',
  'certificados',
  'gestion-reportes',
];

export const CRUD_MODULE_ID_SET = new Set(CRUD_PERMISSION_MODULES.map((m) => m.id));

export const getCrudModuleIds = () => CRUD_PERMISSION_MODULES.map((m) => m.id);

export const getCrudModules = () => CRUD_PERMISSION_MODULES;

export const isValidCrudModule = (moduleId: string) => CRUD_MODULE_ID_SET.has(moduleId);
