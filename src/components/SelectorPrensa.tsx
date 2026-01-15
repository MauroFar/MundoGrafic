import { useState, useEffect, useRef } from 'react';

interface Prensa {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

interface SelectorPrensaProps {
  value: string;
  onChange: (valor: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

/**
 * Componente selector de prensa con opción de agregar nuevas
 * Permite seleccionar de una lista o agregar prensas dinámicamente
 */
function SelectorPrensa({ value, onChange, className = '', label = 'Seleccionar Prensa', placeholder = 'Seleccionar o escribir prensa...' }: SelectorPrensaProps) {
  const [prensas, setPrensas] = useState<Prensa[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [nuevaPrensa, setNuevaPrensa] = useState({ nombre: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  // Cargar prensas al montar el componente
  useEffect(() => {
    cargarPrensas();
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarPrensas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/prensas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrensas(data);
      }
    } catch (error) {
      console.error('Error al cargar prensas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarPrensa = async () => {
    if (!nuevaPrensa.nombre.trim()) {
      alert('El nombre de la prensa es requerido');
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch(`${apiUrl}/api/prensas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(nuevaPrensa)
      });

      if (response.ok) {
        const prensaCreada = await response.json();
        
        // Actualizar lista de prensas
        await cargarPrensas();
        
        // Seleccionar la prensa recién creada
        onChange(prensaCreada.nombre);
        
        // Cerrar modal y resetear form
        setMostrarModalAgregar(false);
        setNuevaPrensa({ nombre: '', descripcion: '' });
        
        // Mantener el dropdown abierto para ver todos los equipos
        setMostrarDropdown(true);
        
        alert(`✅ Prensa "${prensaCreada.nombre}" agregada exitosamente`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo agregar la prensa'}`);
      }
    } catch (error) {
      console.error('Error al agregar prensa:', error);
      alert('Error al agregar la prensa');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrar prensas según lo que se escribe
  const prensasFiltradas = prensas.filter(p => 
    p.nombre.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input 
          ref={inputRef}
          className={`w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 pr-8 ${className}`}
          type="text" 
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setMostrarDropdown(true)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setMostrarDropdown(!mostrarDropdown)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {mostrarDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-50 mt-1 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Cargando prensas...
            </div>
          ) : (
            <>
              {prensasFiltradas.length > 0 ? (
                prensasFiltradas.map((prensa) => (
                  <div
                    key={prensa.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100"
                    onClick={() => {
                      onChange(prensa.nombre);
                      setMostrarDropdown(false);
                    }}
                  >
                    <div className="font-medium">{prensa.nombre}</div>
                    {prensa.descripcion && (
                      <div className="text-xs text-gray-500">{prensa.descripcion}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No se encontraron prensas
                </div>
              )}
              
              {/* Botón para agregar nueva prensa */}
              <div 
                className="px-3 py-2 bg-green-50 hover:bg-green-100 cursor-pointer text-sm border-t-2 border-green-200 font-semibold text-green-700 flex items-center gap-2 sticky bottom-0"
                onClick={() => {
                  setMostrarModalAgregar(true);
                  setMostrarDropdown(false);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Nueva Prensa
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal para agregar nueva prensa */}
      {mostrarModalAgregar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Agregar Nueva Prensa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: GTO 52, PM52, etc."
                  value={nuevaPrensa.nombre}
                  onChange={e => setNuevaPrensa({ ...nuevaPrensa, nombre: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  placeholder="Descripción de la prensa..."
                  value={nuevaPrensa.descripcion}
                  onChange={e => setNuevaPrensa({ ...nuevaPrensa, descripcion: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleAgregarPrensa}
                disabled={guardando || !nuevaPrensa.nombre.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalAgregar(false);
                  setNuevaPrensa({ nombre: '', descripcion: '' });
                }}
                disabled={guardando}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectorPrensa;
