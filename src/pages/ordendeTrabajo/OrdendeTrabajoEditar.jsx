import React from "react";

const OrdendeTrabajoEditar = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white border border-gray-300 p-8 w-[210mm] h-[297mm] shadow-lg">
        {/* Encabezado */}
        <div className="flex justify-between mb-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold">Mundo Grafic</h1>
          </div>
          <div className="text-right">
            <p className="font-semibold">Estado:</p>
          </div>
        </div>
        {/* Título */}
        <h2 className="text-center text-xl font-bold mb-4">Orden de Trabajo</h2>

        {/* Información General */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p>Orden N°:</p>
            <p>Cotización N°:</p>
            <p>Orden de Compra N°:</p>
          </div>
          <div>
            <p>Fecha Creación:</p>
            <p>Fecha Entrega:</p>
          </div>
        </div>

        {/* Datos del Cliente */}
        <h3 className="font-bold mb-2">Datos del Cliente</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p>Cliente:</p>
            <p>Contacto:</p>
          </div>
          <div>
            <p>Teléfonos:</p>
            <p>Email:</p>
          </div>
        </div>

        {/* Información de Trabajo */}
        <h3 className="font-bold mb-2">Información de Trabajo</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>Cantidad:</div>
          <div>Concepto:</div>
          <div>Tamaño Abierto:</div>
          <div>Tamaño Cerrado:</div>
          <div>Páginas Portada:</div>
          <div>Páginas Interiores:</div>
        </div>

        {/* Código de Producto */}
        <h3 className="font-bold mb-2">Código de Producto</h3>
        <div className="border p-2 mb-6">Espacio para Código de Producto</div>

        {/* Prensa y Guillotina */}
        <h3 className="font-bold mb-2">Prensa / Guillotina</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>Prensas:</div>
          <div>Guillotina:</div>
        </div>

        {/* Etiquetas */}
        <h3 className="font-bold mb-2">Etiquetas</h3>
        <div className="border p-2 mb-6">Espacio para Etiquetas</div>

        {/* Instrucciones */}
        <h3 className="font-bold mb-2">Instrucciones</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>Preprensa:</div>
          <div>Corte:</div>
          <div>Impresión:</div>
          <div>Acabados:</div>
        </div>

        {/* Observaciones */}
        <h3 className="font-bold mb-2">Observaciones</h3>
        <div className="border p-4 mb-6">Espacio para Observaciones</div>

        {/* Pie de Página */}
        <div className="flex justify-between">
          <div>Vendedor</div>
          <div>Preprensa</div>
          <div>Prensa</div>
          <div>Terminados</div>
          <div>Facturado</div>
        </div>
      </div>
    </div>
  );
};

export default OrdendeTrabajoEditar;
