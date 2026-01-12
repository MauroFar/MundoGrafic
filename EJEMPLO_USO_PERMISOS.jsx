// ============================================================================
// EJEMPLO: Cómo usar el sistema de permisos reutilizable en cualquier interfaz
// ============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import BotonConPermiso from "../../components/BotonConPermiso";
import { ProtegidoPorPermiso, useAccionConPermiso } from "../../components/PermisosHelpers";
import { usePermisos } from "../../hooks/usePermisos";
import ModalSinPermisos from "../../components/ModalSinPermisos";

const EjemploUsoPermisos = () => {
  const navigate = useNavigate();
  const { modalData, cerrarModal } = usePermisos();
  
  // Hook para ejecutar acciones con validación de permisos
  const eliminarConPermiso = useAccionConPermiso('clientes', 'eliminar', 'eliminar este cliente');

  // ============================================================================
  // MÉTODO 1: Usar BotonConPermiso (Más simple - Recomendado)
  // ============================================================================
  // El botón solo aparece si tiene permiso, y valida antes de ejecutar la acción
  
  const Metodo1_BotonSimple = () => (
    <BotonConPermiso
      modulo="clientes"
      accion="crear"
      onClick={() => navigate("/clientes/crear")}
      className="bg-blue-600 text-white px-4 py-2 rounded"
      textoError="crear un nuevo cliente"
    >
      <FaPlus /> Nuevo Cliente
    </BotonConPermiso>
  );

  // ============================================================================
  // MÉTODO 2: Usar ProtegidoPorPermiso (Para secciones completas)
  // ============================================================================
  // Oculta toda una sección si no tiene permiso
  
  const Metodo2_SeccionProtegida = () => (
    <ProtegidoPorPermiso modulo="clientes" accion="editar">
      <div className="bg-yellow-50 p-4 rounded">
        <h3>Panel de Edición</h3>
        <p>Esta sección completa solo se muestra si tiene permiso de editar</p>
        <button className="bg-yellow-600 text-white px-4 py-2 rounded">
          Editar Cliente
        </button>
      </div>
    </ProtegidoPorPermiso>
  );

  // ============================================================================
  // MÉTODO 3: Usar useAccionConPermiso (Para lógica compleja)
  // ============================================================================
  // Valida y ejecuta una función con lógica personalizada
  
  const Metodo3_AccionCompleja = () => {
    const handleEliminar = (id) => {
      eliminarConPermiso(() => {
        // Tu lógica aquí - solo se ejecuta si tiene permiso
        if (window.confirm("¿Estás seguro?")) {
          console.log(`Eliminando cliente ${id}`);
          // eliminarCliente(id);
        }
      });
    };

    return (
      <button
        onClick={() => handleEliminar(123)}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        <FaTrash /> Eliminar
      </button>
    );
  };

  // ============================================================================
  // EJEMPLO COMPLETO: Tabla con botones de acción
  // ============================================================================
  
  const clientes = [
    { id: 1, nombre: "Cliente 1" },
    { id: 2, nombre: "Cliente 2" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Ejemplo de Uso del Sistema de Permisos Reutilizable
      </h1>

      {/* Header con botón de crear */}
      <div className="flex justify-between mb-6">
        <h2 className="text-xl">Lista de Clientes</h2>
        <Metodo1_BotonSimple />
      </div>

      {/* Sección protegida completa */}
      <Metodo2_SeccionProtegida />

      {/* Tabla con acciones por fila */}
      <div className="mt-6 bg-white rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Nombre</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-t">
                <td className="px-6 py-4">{cliente.id}</td>
                <td className="px-6 py-4">{cliente.nombre}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    {/* Botón de editar con permisos */}
                    <BotonConPermiso
                      modulo="clientes"
                      accion="editar"
                      onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                      textoError="editar este cliente"
                    >
                      <FaEdit />
                    </BotonConPermiso>

                    {/* Botón de eliminar con permisos */}
                    <BotonConPermiso
                      modulo="clientes"
                      accion="eliminar"
                      onClick={() => {
                        if (window.confirm("¿Eliminar?")) {
                          console.log("Eliminando", cliente.id);
                        }
                      }}
                      className="text-red-600 hover:bg-red-100 p-2 rounded"
                      textoError="eliminar este cliente"
                    >
                      <FaTrash />
                    </BotonConPermiso>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* O usar método 3 para lógica más compleja */}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Método 3 - Con lógica compleja:</h3>
        <Metodo3_AccionCompleja />
      </div>

      {/* Modal de sin permisos (se incluye automáticamente en BotonConPermiso,
          pero si usas métodos 2 o 3, debes incluirlo manualmente) */}
      <ModalSinPermisos 
        isOpen={modalData.isOpen}
        onClose={cerrarModal}
        accion={modalData.accion}
        modulo={modalData.modulo}
      />
    </div>
  );
};

export default EjemploUsoPermisos;
