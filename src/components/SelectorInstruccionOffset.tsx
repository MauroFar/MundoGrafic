import { useEffect, useRef, useState } from 'react';

type CategoriaInstruccionOffset = 'impresion' | 'acabados' | 'empacado';

interface InstruccionOffset {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface SelectorInstruccionOffsetProps {
  categoria: CategoriaInstruccionOffset;
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  placeholder: string;
  inputClassName: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const mensajeDeError = async (response: Response) => {
  const data = await response.json();
  return data.error || 'No se pudo completar la operación';
};

const SelectorInstruccionOffset: React.FC<SelectorInstruccionOffsetProps> = ({
  categoria,
  fieldKey,
  label,
  value,
  onChange,
  onFocus,
  placeholder,
  inputClassName,
}) => {
  const [instrucciones, setInstrucciones] = useState<InstruccionOffset[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/api/instrucciones-offset/${categoria}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error(await mensajeDeError(response));
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Respuesta inválida al cargar plantillas');
        if (!cancelado) setInstrucciones(data);
      } catch (loadError) {
        if (!cancelado) {
          setError(loadError instanceof Error ? loadError.message : 'Error al cargar plantillas');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [categoria]);

  useEffect(() => {
    const cerrarAlHacerClickFuera = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener('mousedown', cerrarAlHacerClickFuera);
    return () => document.removeEventListener('mousedown', cerrarAlHacerClickFuera);
  }, []);

  const abrirModalAgregar = () => {
    setNombre('');
    setDescripcion('');
    setError('');
    setMostrarDropdown(false);
    setMostrarModal(true);
  };

  const guardarInstruccion = async () => {
    const nombreNormalizado = nombre.trim();
    const descripcionNormalizada = descripcion.trim();
    if (!nombreNormalizado) return;

    setGuardando(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/instrucciones-offset/${categoria}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          nombre: nombreNormalizado,
          descripcion: descripcionNormalizada || null,
        }),
      });
      if (!response.ok) throw new Error(await mensajeDeError(response));
      const creada: InstruccionOffset = await response.json();
      setInstrucciones((actuales) => [...actuales, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      onChange(creada.nombre);
      setMostrarModal(false);
      setMostrarDropdown(true);
      setNombre('');
      setDescripcion('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al guardar la instrucción');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div
          ref={editorRef}
          data-offset-field-key={fieldKey}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className={`${inputClassName} pr-10`}
          style={{ color: '#111827', whiteSpace: 'pre-wrap' }}
          onFocus={onFocus}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          onMouseUp={onFocus}
          onKeyUp={onFocus}
          data-placeholder={placeholder}
        />
        <button
          type="button"
          aria-label="Seleccionar instrucciones guardadas"
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          onClick={() => setMostrarDropdown((abierto) => !abierto)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {mostrarDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 max-h-64 overflow-y-auto rounded border border-gray-300 bg-white shadow-lg">
          {cargando ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Cargando instrucciones...
            </div>
          ) : instrucciones.length > 0 ? (
            instrucciones.map((instruccion) => (
              <button
                type="button"
                key={instruccion.id}
                className="block w-full px-3 py-2 text-left text-sm border-b border-gray-100 hover:bg-gray-50"
                onClick={() => {
                  onChange(instruccion.nombre);
                  setMostrarDropdown(false);
                }}
              >
                {instruccion.nombre}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No hay instrucciones guardadas
            </div>
          )}
          <button
            type="button"
            className="sticky bottom-0 flex w-full items-center gap-2 border-t-2 border-green-200 bg-green-50 px-3 py-2 text-left text-sm font-semibold text-green-700 hover:bg-green-100"
            onClick={abrirModalAgregar}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar nueva instrucción
          </button>
        </div>
      )}

      {error && !mostrarModal && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}

      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-800">Agregar nueva instrucción</h4>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`nombre-${categoria}`}>
                Nombre
              </label>
              <input
                id={`nombre-${categoria}`}
                autoFocus
                maxLength={120}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nombre para identificarla"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`descripcion-${categoria}`}>
                Descripción (opcional)
              </label>
              <textarea
                id={`descripcion-${categoria}`}
                rows={5}
                className="w-full resize-y rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Descripción adicional de la plantilla..."
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={guardando || !nombre.trim()}
                onClick={() => void guardarInstruccion()}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300"
                disabled={guardando}
                onClick={() => {
                  setMostrarModal(false);
                  setError('');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorInstruccionOffset;
