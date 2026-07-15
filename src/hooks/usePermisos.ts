import { useState, useEffect } from "react";
import { usePermisosContext } from "../context/PermisosContext";

type Accion = "crear" | "leer" | "editar" | "eliminar";

interface ModuloPermiso {
  puede_crear: boolean;
  puede_leer: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

interface PermisosMap {
  [modulo: string]: ModuloPermiso;
}

interface PermisoRaw {
  modulo: string;
  puede_crear: boolean;
  puede_leer: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export const usePermisos = () => {
  const [permisos, setPermisos] = useState<PermisosMap>({});
  const [loading, setLoading] = useState(true);
  const { mostrarModalSinPermiso, cerrarModal } = usePermisosContext();

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const token = localStorage.getItem("token");

  useEffect(() => {
    void cargarPermisos();
  }, []);

  const cargarPermisos = async (): Promise<void> => {
    try {
      const response = await fetch(`${apiUrl}/api/permisos/mis-permisos/actual`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: PermisoRaw[] = await response.json();
        const permisosMap: PermisosMap = {};
        data.forEach((p) => {
          permisosMap[p.modulo] = {
            puede_crear: p.puede_crear,
            puede_leer: p.puede_leer,
            puede_editar: p.puede_editar,
            puede_eliminar: p.puede_eliminar,
          };
        });
        setPermisos(permisosMap);
      }
    } catch (error) {
      console.error("Error al cargar permisos:", error);
    } finally {
      setLoading(false);
    }
  };

  const tienePermiso = (modulo: string, accion: Accion): boolean => {
    const rol = localStorage.getItem("rol");
    const user = JSON.parse(localStorage.getItem("user") ?? "{}") as { rol?: string };
    if (rol === "admin" || user.rol === "admin") return true;

    const permisoModulo = permisos[modulo];
    if (!permisoModulo) return false;
    return permisoModulo[`puede_${accion}`] ?? false;
  };

  const puedeCrear    = (modulo: string) => tienePermiso(modulo, "crear");
  const puedeLeer     = (modulo: string) => tienePermiso(modulo, "leer");
  const puedeEditar   = (modulo: string) => tienePermiso(modulo, "editar");
  const puedeEliminar = (modulo: string) => tienePermiso(modulo, "eliminar");

  const verificarYMostrarError = (
    modulo: string,
    accion: Accion,
    nombreAccion?: string,
  ): boolean => {
    if (!tienePermiso(modulo, accion)) {
      mostrarModalSinPermiso(accion, modulo, "", nombreAccion ?? "realizar esta accion");
      return false;
    }
    return true;
  };

  return {
    permisos,
    loading,
    tienePermiso,
    puedeCrear,
    puedeLeer,
    puedeEditar,
    puedeEliminar,
    recargarPermisos: cargarPermisos,
    cerrarModal,
    verificarYMostrarError,
  };
};
