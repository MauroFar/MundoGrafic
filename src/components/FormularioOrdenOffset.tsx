import React, { useState, useRef, useEffect } from 'react';
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
  materialEspesor: string;
  setMaterialEspesor: (value: string) => void;
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
  materialEspesor,
  setMaterialEspesor,
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
  const MATERIALS = React.useMemo(() => [
    { name: 'PROPALCOTE', display: 'PROPALCOTE (0,045 mm)', unit: '0.045' },
    { name: 'POLIPROPILENO BLANCO MATE', display: 'POLIPROPILENO BLANCO MATE (0,054 mm)', unit: '0.054' },
    { name: 'POLIPROPILENO BLANCO BRILLANTE', display: 'POLIPROPILENO BLANCO BRILLANTE (0,060 mm)', unit: '0.060' },
    { name: 'POLIPROPILENO TRANSPARENTE', display: 'POLIPROPILENO TRANSPARENTE (0,050 mm)', unit: '0.050' },
    { name: 'POLIPROPILENO METALIZADO', display: 'POLIPROPILENO METALIZADO (0,050 mm)', unit: '0.050' },
    { name: 'TERMOENCOGIBLE PVC', display: 'TERMOENCOGIBLE PVC (0,04 mm)', unit: '0.040' },
    { name: 'TERMOENCOGIBLE PET', display: 'TERMOENCOGIBLE PET (0,040 mm)', unit: '0.040' },
    { name: 'CARTULINA METALIZADA', display: 'CARTULINA METALIZADA', unit: '' },
    { name: 'CARTULINA NORMAL', display: 'CARTULINA NORMAL', unit: '' },
    { name: 'BOPP METALIZADO', display: 'BOPP METALIZADO (0,06 mm)', unit: '0.060' },
    { name: 'BOPP BLANCO', display: 'BOPP BLANCO (0,06 mm)', unit: '0.060' },
    { name: 'BOPP TRANSPARENTE', display: 'BOPP TRANSPARENTE (0,06 mm)', unit: '0.060' },
    { name: 'TERMICO DIRECTO PAPEL', display: 'TERMICO DIRECTO PAPEL (0,045 mm)', unit: '0.045' },
    { name: 'TERMICO DIRECTO POLIPROPILENO', display: 'TERMICO DIRECTO POLIPROPILENO (0,054 mm)', unit: '0.054' },
    { name: 'POLIPROPILENO BLANCO FREZZER', display: 'POLIPROPILENO BLANCO FREZZER (0,054 mm)', unit: '0.054' },
  ], []);

  const [showMaterialOptions, setShowMaterialOptions] = useState<boolean>(false);
  const materialContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!materialContainerRef.current) return;
      if (!materialContainerRef.current.contains(e.target as Node)) setShowMaterialOptions(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMaterialOptions(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
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
              <div className="relative" ref={materialContainerRef}>
                <div className="flex">
                  <input
                    ref={(el) => { /* noop: keep uncontrolled ref if needed later */ }}
                    placeholder="Seleccionar o escribir..."
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={(() => {
                      // Mostrar nombre + unidad si coincide con lista conocida
                      const found = MATERIALS.find(m => m.name === material);
                      return found ? found.display : material;
                    })()}
                    onChange={(e) => { setMaterial(e.target.value); setMaterialEspesor(''); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMaterialOptions(s => !s)}
                    className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50"
                  >▾</button>
                </div>
                {showMaterialOptions && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
                    {MATERIALS.map(opt => (
                      <li key={opt.name} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={(e) => { e.preventDefault(); setMaterial(opt.name); setMaterialEspesor(opt.unit || ''); setShowMaterialOptions(false); }}>
                        {opt.display}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
