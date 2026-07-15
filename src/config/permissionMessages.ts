type Accion = "crear" | "leer" | "editar" | "eliminar";

const ACTION_TEXT: Record<Accion, string> = {
  crear: "crear",
  leer: "ver",
  editar: "editar",
  eliminar: "eliminar",
};

const MODULE_TEXT: Record<string, string> = {
  clientes: "clientes",
  cotizaciones: "cotizaciones",
  ordenes_trabajo: "ordenes de trabajo",
  produccion: "produccion",
  inventario: "inventario",
  usuarios: "usuarios",
  reportes: "reportes",
  certificados: "certificados",
  roles: "roles",
  areas: "areas",
  "catalogo-procesos": "catalogo de procesos",
  "tipos-trabajo": "tipos de trabajo",
};

const normalizeModuleText = (modulo?: string): string => {
  if (!modulo) return "";
  return MODULE_TEXT[modulo] ?? modulo.replace(/[_-]+/g, " ");
};

interface PermissionMessageOptions {
  accion?: Accion;
  modulo?: string;
  customActionText?: string;
  fallbackMessage?: string;
}

export const buildPermissionDeniedMessage = ({
  accion,
  modulo,
  customActionText,
  fallbackMessage,
}: PermissionMessageOptions = {}): string => {
  if (fallbackMessage) return fallbackMessage;

  const actionText = customActionText ?? (accion ? ACTION_TEXT[accion] : undefined) ?? "realizar esta accion";
  const moduleText = normalizeModuleText(modulo);
  const targetText = moduleText ? ` en ${moduleText}` : "";

  return `Este usuario no tiene permisos para ${actionText}${targetText}. Contacte a su administrador.`;
};
