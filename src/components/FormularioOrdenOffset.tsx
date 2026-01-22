import React from 'react';
import SelectorPrensa from './SelectorPrensa';

interface FormularioOrdenOffsetProps {
  // Información del trabajo
  cantidad: string;
  setCantidad: (value: string) => void;
  concepto: string;
  setConcepto: (value: string) => void;
  tamanoAbierto1: string;
  setTamanoAbierto1: (value: string) => void;
  tamanoCerrado1: string;
  setTamanoCerrado1: (value: string) => void;

  // Material y Corte
  material: string;
  setMaterial: (value: string) => void;
  corteMaterial: string;
  setCorteMaterial: (value: string) => void;

  // Cantidad de Pliegos
  cantidadPliegosCompra: string;
  setCantidadPliegosCompra: (value: string) => void;
  exceso: string;
  setExceso: (value: string) => void;
  totalPliegos: string;

  // Impresión y Acabados
  impresion: string;
  setImpresion: (value: string) => void;
  instruccionesImpresion: string;
  setInstruccionesImpresion: (value: string) => void;
  instruccionesAcabados: string;
  setInstruccionesAcabados: (value: string) => void;
  instruccionesEmpacado: string;
  setInstruccionesEmpacado: (value: string) => void;

  // Prensa y Observaciones
  prensaSeleccionada: string;
  setPrensaSeleccionada: (value: string) => void;
  observaciones: string;
  setObservaciones: (value: string) => void;
  notasObservaciones: string;
  setNotasObservaciones: (value: string) => void;
}

const FormularioOrdenOffset: React.FC<FormularioOrdenOffsetProps> = ({
  cantidad,
  setCantidad,
  concepto,
  setConcepto,
  tamanoAbierto1,
  setTamanoAbierto1,
  tamanoCerrado1,
  setTamanoCerrado1,
  material,
  setMaterial,
  corteMaterial,
  setCorteMaterial,
  cantidadPliegosCompra,
  setCantidadPliegosCompra,
  exceso,
  setExceso,
  totalPliegos,
  impresion,
  setImpresion,
  instruccionesImpresion,
  setInstruccionesImpresion,
  instruccionesAcabados,
  setInstruccionesAcabados,
  instruccionesEmpacado,
  setInstruccionesEmpacado,
  prensaSeleccionada,
  setPrensaSeleccionada,
  observaciones,
  setObservaciones,
  notasObservaciones,
  setNotasObservaciones,
}) => {
  return (
    <>
      {/* Información del Trabajo - Diseño compacto */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Información del Trabajo
        </h3>
        
        <div className="flex gap-4 items-start">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input 
              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
              type="text" 
              value={cantidad} 
              onChange={e => setCantidad(e.target.value)} 
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={2}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Descripción del trabajo..."
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Abierto</label>
            <input 
              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
              type="text" 
              placeholder="5x9"
              value={tamanoAbierto1}
              onChange={e => setTamanoAbierto1(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Cerrado</label>
            <input 
              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
              type="text" 
              placeholder="5x9"
              value={tamanoCerrado1}
              onChange={e => setTamanoCerrado1(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Material y Corte - Diseño horizontal */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Material y Corte
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
              rows={2}
              value={material}
              onChange={e => setMaterial(e.target.value)}
              placeholder="Especificaciones del material..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corte de Material</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
              rows={2}
              value={corteMaterial}
              onChange={e => setCorteMaterial(e.target.value)}
              placeholder="Instrucciones de corte..."
            />
          </div>
        </div>
      </div>

      {/* Cantidad de Pliegos - Diseño compacto */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Cantidad de Pliegos
        </h3>
        
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pliegos de Compra</label>
            <input 
              className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500" 
              type="number" 
              value={cantidadPliegosCompra}
              onChange={e => setCantidadPliegosCompra(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exceso</label>
            <input 
              className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500" 
              type="number" 
              value={exceso}
              onChange={e => setExceso(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
            <input 
              className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-50 font-semibold text-gray-700 cursor-not-allowed" 
              type="text" 
              value={totalPliegos}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Impresión y Acabados - Diseño horizontal */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Impresión y Acabados
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impresión</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              rows={2}
              value={impresion}
              onChange={e => setImpresion(e.target.value)}
              placeholder="Especificaciones de impresión..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Impresión</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              rows={2}
              value={instruccionesImpresion}
              onChange={e => setInstruccionesImpresion(e.target.value)}
              placeholder="Instrucciones específicas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Acabados</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              rows={2}
              value={instruccionesAcabados}
              onChange={e => setInstruccionesAcabados(e.target.value)}
              placeholder="Instrucciones de acabados..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Empacado</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              rows={2}
              value={instruccionesEmpacado}
              onChange={e => setInstruccionesEmpacado(e.target.value)}
              placeholder="Instrucciones de empacado..."
            />
          </div>
        </div>
      </div>

      {/* Prensa y Observaciones - Diseño horizontal */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Prensa y Observaciones
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SelectorPrensa
            value={prensaSeleccionada}
            onChange={setPrensaSeleccionada}
            label="Seleccionar Prensa"
            placeholder="Seleccionar o escribir prensa..."
          />

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Generales</label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              rows={2}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Observaciones generales del trabajo..."
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
          <textarea 
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" 
            rows={2}
            placeholder="Añadir notas adicionales aquí..." 
            value={notasObservaciones} 
            onChange={e => setNotasObservaciones(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};

export default FormularioOrdenOffset;
