import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../components/Logo';
import { FaTimes, FaFileAlt } from 'react-icons/fa';

const CertificadoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const esVista = !!id && id !== 'crear' && id !== 'nuevo';

  const [form, setForm] = useState<any>({
    numero_certificado: esVista ? '' : null,
    fecha_elaboracion: new Date().toISOString().slice(0,10),
    fecha_caducidad: '',
      fecha_creacion: esVista ? '' : new Date().toISOString().slice(0,10),
    cliente: '',
    referencia: '',
    material: '',
    descripcion: '',
    cantidad: '',
    cantidad_despachada: '',
    codigo: '',
    lote: '',
    lote_despacho: '',
    tamano_cm: '',
    aprobado_area: '',
    // valor por defecto editable solicitado
    aprobado_area: 'ÍNDIGO',
    recepcion_area: '',
    orden_compra: '',
    inspeccionado_por: '',
    observaciones: 'MUNDO GRAFIC certifica que el 100% del producto se encuentra revisado y aprobado por el control de calidad.',
    caracteristicas: [
      { name: 'LARGO', minimo: '', nominal: '', maximo: '' },
      { name: 'ANCHO', minimo: '', nominal: '', maximo: '' },
      { name: 'ALTO', minimo: '', nominal: '', maximo: '' },
      { name: 'ESPESOR', minimo: '', nominal: '', maximo: '' }
    ]
  });

  const [saving, setSaving] = useState(false);
  const [fechaCaducidadManual, setFechaCaducidadManual] = useState(false);
  const [catalogoCaracteristicas, setCatalogoCaracteristicas] = useState<any[]>([]);
  const caracteristicasOrden = ['LARGO','ANCHO','ALTO','ESPESOR'];
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const referenciaRef = useRef<HTMLTextAreaElement | null>(null);

  // Editable combo component (input + dropdown) reused here
  const EditableCombo: React.FC<{
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder?: string;
  }> = ({ value, onChange, options, placeholder }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      const onDoc = (e: MouseEvent) => {
        if (!containerRef.current) return;
        if (!containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onDoc);
        document.removeEventListener('keydown', onKey);
      };
    }, []);

    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(s => !s); inputRef.current?.focus(); }}
            className="px-2 py-1 border border-gray-300 rounded bg-gray-50"
          >
            ▾
          </button>
        </div>
        {open && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Helper: compute step and formatted min/max based on the nominal string
  const computeStepAndBounds = (rawVal: string) => {
    const s = String(rawVal || '').trim();
    const v = parseFloat(s.replace(',', '.'));
    if (isNaN(v)) return { step: 1, decimals: 0, min: '', max: '' };
    // count decimals in the textual representation (after '.')
    const parts = s.indexOf('.') >= 0 ? s.split('.') : (s.indexOf(',') >= 0 ? s.split(',') : [s]);
    const decimals = parts.length > 1 ? parts[1].length : 0;
    const step = decimals > 0 ? Math.pow(10, -decimals) : 1;
    const min = (v - step).toFixed(decimals);
    const max = (v + step).toFixed(decimals);
    return { step, decimals, min, max };
  };
  useEffect(() => {
    // Si no es vista (crear nuevo), solicitar al backend el número sugerido
    const fetchNextNumber = async () => {
      if (esVista) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const micRaw = num * 1000;
        let micComputed = '';
        if (Math.abs(micRaw - Math.round(micRaw)) < 1e-9) micComputed = String(Math.round(micRaw));
        else micComputed = String(parseFloat(micRaw.toFixed(4))).replace(/\.0+$/, '');
        const res = await fetch(`${apiUrl}/api/certificados/next-number`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.numero_certificado) {
          setForm((f:any) => ({ ...f, numero_certificado: data.numero_certificado }));
        }
      } catch (e) {
        // ignore silently
      }
    };
    fetchNextNumber();
    // Si es vista, cargar datos desde API
    const cargar = async () => {
      if (!esVista) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/certificados/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('No se pudo cargar certificado');
        const data = (await res.json()) || {};
        // Mapear a form
        // Mapear características recibidas a las filas fijas en orden
        const recibidasArr = data && Array.isArray(data.caracteristicas) ? data.caracteristicas.slice() : [];

        // Construir filas fijas respetando si existen múltiples entradas con el mismo nombre
        const seenIds = new Set<string|number>();
        const caracteristicasOrdenadas: any[] = [];

        caracteristicasOrden.forEach((nameKey: string) => {
          const key = String(nameKey).toLowerCase();
          // encontrar todas las coincidencias por nombre (p.ej. ESPESOR puede aparecer 2 veces con distintas unidades)
          const matches = (recibidasArr || []).filter((c:any) => String(c.nombre || c.name || '').toLowerCase().includes(key));
          if (matches.length > 0) {
            // preferir la unidad mm si existe
            const preferred = matches.find((m:any) => String((m.unidad || '')).toLowerCase().includes('mm')) || matches[0];
            caracteristicasOrdenadas.push({ caracteristica_id: preferred.caracteristica_id || preferred.id || null, name: preferred.nombre || preferred.name || nameKey, unidad: preferred.unidad || '', minimo: preferred.minimo || '', nominal: preferred.nominal || '', maximo: preferred.maximo || '' });
            // marcar solo la coincidencia preferida como vista; las demás (p.ej. Micras) se añadirán después
            const prefUid = preferred.id || (preferred.caracteristica_id ? `ci:${preferred.caracteristica_id}` : JSON.stringify(preferred));
            seenIds.add(prefUid);
          } else {
            caracteristicasOrdenadas.push({ caracteristica_id: null, name: nameKey, unidad: '', minimo: '', nominal: '', maximo: '' });
          }
        });

        // Añadir cualquier característica recibida que no esté ya incluida (por ejemplo la otra unidad de ESPESOR)
        recibidasArr.forEach((r:any) => {
          const uid = r.id || (r.caracteristica_id ? `ci:${r.caracteristica_id}` : JSON.stringify(r));
          if (!seenIds.has(uid)) {
            caracteristicasOrdenadas.push({ caracteristica_id: r.caracteristica_id || null, name: r.nombre || r.name || '', unidad: r.unidad || '', minimo: r.minimo || '', nominal: r.nominal || '', maximo: r.maximo || '' });
            seenIds.add(uid);
          }
        });

        // Si el certificado tiene un campo espesor en mm (columna separada en la tabla), agregar como fila adicional si no existe
        try {
          // Normalizar detección de espesor (admite distintos nombres y valor 0)
          let espVal: any = null;
          if (data) {
            if (data.espesor_mm !== undefined && data.espesor_mm !== null) espVal = data.espesor_mm;
            else if (data.espesorMM !== undefined && data.espesorMM !== null) espVal = data.espesorMM;
            else if (data.espesor_mm_value !== undefined && data.espesor_mm_value !== null) espVal = data.espesor_mm_value;
          }
          if (espVal !== null && espVal !== undefined && espVal !== '') {
            // Buscar cualquier fila existente que sea 'ESPESOR' (independiente de unidad) y actualizarla
            const espIndexAny = caracteristicasOrdenadas.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor'));
            if (espIndexAny > -1) {
              // actualizar fila existente para asegurar unidad 'mm' y valor nominal
              const existing = caracteristicasOrdenadas[espIndexAny];
              const updated = { ...existing };
              updated.unidad = updated.unidad || 'mm';
              if (!updated.nominal || String(updated.nominal).trim() === '') updated.nominal = String(espVal);
              // si no tiene minimo/maximo los calculamos
              try {
                const num = parseFloat(String(updated.nominal).replace(',', '.'));
                if (!isNaN(num)) {
                  const isEspesorMm = String(updated.nombre || updated.name || '').toLowerCase().includes('espesor') && String((updated.unidad || '')).toLowerCase().includes('mm');
                  const step = isEspesorMm ? 0.001 : 1;
                  const decimals = step < 1 ? 3 : 0;
                  updated.minimo = updated.minimo || String(Number((num - step).toFixed(decimals)).toString());
                  updated.maximo = updated.maximo || String(Number((num + step).toFixed(decimals)).toString());
                }
              } catch (e) {}
              caracteristicasOrdenadas[espIndexAny] = updated;
            } else {
              // si no existe, añadir nueva fila ESPESOR (mm)
              let minimo = '';
              let maximo = '';
              try {
                const calc = computeStepAndBounds(String(espVal));
                minimo = calc.min;
                maximo = calc.max;
              } catch (e) { /* ignore */ }
              caracteristicasOrdenadas.push({ caracteristica_id: null, name: 'ESPESOR (mm)', unidad: 'mm', minimo, nominal: String(espVal), maximo });
            }
          }
        } catch (e) {
          // ignore
        }

        // Reordenar: subir ESPESOR (mm) justo después de 'ALTO' y bajar ESPESOR en Micras al final
        try {
          const espMmIdx = caracteristicasOrdenadas.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String(r.unidad || '').toLowerCase().includes('mm'));
          if (espMmIdx > -1) {
            const item = caracteristicasOrdenadas.splice(espMmIdx, 1)[0];
            const altoIdx = caracteristicasOrdenadas.findIndex((r:any) => String(r.name || '').toUpperCase() === 'ALTO');
            const insertPos = altoIdx >= 0 ? altoIdx + 1 : 0;
            caracteristicasOrdenadas.splice(insertPos, 0, item);
          }

          const micIdx = caracteristicasOrdenadas.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String(r.unidad || '').toLowerCase().includes('mic'));
          if (micIdx > -1) {
            const mic = caracteristicasOrdenadas.splice(micIdx, 1)[0];
            caracteristicasOrdenadas.push(mic);
          }
        } catch (e) {
          // ignore reorder errors
        }

        setForm((f:any) => {
          // preserve any existing rows from previous state that may include ESPESOR (mm)
          const prevRows = Array.isArray(f?.caracteristicas) ? f.caracteristicas.slice() : [];
          const rows = caracteristicasOrdenadas.slice();
          const hasEspMmInRows = rows.find((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
          const hasEspMmInPrev = prevRows.find((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
          if (!hasEspMmInRows && hasEspMmInPrev) {
            // add the espesor mm row from previous rows
            rows.push(hasEspMmInPrev);
          }

          // Ensure ordering: put ESPESOR (mm) right after ALTO and move ESPESOR (micras) to the end
          try {
            const espMmIdx2 = rows.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
            if (espMmIdx2 > -1) {
              const item = rows.splice(espMmIdx2, 1)[0];
              const altoIdx = rows.findIndex((r:any) => String(r.name || '').toUpperCase() === 'ALTO');
              const insertPos = altoIdx >= 0 ? altoIdx + 1 : 0;
              rows.splice(insertPos, 0, item);
            }
            const micIdxLocal = rows.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mic'));
            if (micIdxLocal > -1) {
              const mic = rows.splice(micIdxLocal, 1)[0];
              rows.push(mic);
            }

            return {
              ...f,
              cliente: data.cliente_nombre || f?.cliente,
              referencia: data.referencia || data.producto_cod_mg || f?.referencia,
              material: data.material || data.producto_descripcion || f?.material,
              descripcion: data.descripcion || f?.descripcion,
              cantidad: data.cantidad || f?.cantidad,
              cantidad_despachada: data.cantidad_despachada || f?.cantidad_despachada,
              codigo: data.codigo || data.codigo_producto || f?.codigo,
              lote: data.lote || f?.lote,
              lote_despacho: data.lote_despacho || f?.lote_despacho,
              tamano_cm: data.tamano_cm || f?.tamano_cm,
              orden_compra: data.orden_compra || f?.orden_compra,
              inspeccionado_por: data.inspeccionado_por || f?.inspeccionado_por,
              aprobado_area: data.aprobado_area || f?.aprobado_area,
              recepcion_area: data.recepcion_area || f?.recepcion_area,
              observaciones: data.observaciones || f?.observaciones,
              caracteristicas: rows
            };
          } catch (e) {}
        });

        // Si la API trajo fecha_caducidad, marcamos como editada por usuario (no sobreescribir luego)
        if (data.fecha_caducidad) setFechaCaducidadManual(true);
      } catch (err) {
        console.error(err);
        alert('Error cargando certificado');
      }
    };
    cargar();
  }, [id]);

  // ajustar altura del textarea de referencia cuando cambie el valor (por carga o edición)
  useEffect(() => {
    if (!referenciaRef.current) return;
    const el = referenciaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [form.referencia]);

  useEffect(() => {
    // cargar catálogo de caracteristicas
    const loadCatalog = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/certificados/caracteristicas`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('No se pudo cargar el catálogo');
        const data = await res.json();
        setCatalogoCaracteristicas(data || []);
        // Si el formulario ya tiene filas (por carga del certificado), rellenar unidad desde el catálogo
        setForm((f:any) => {
          const rows = Array.isArray(f?.caracteristicas) ? f.caracteristicas.map((r:any) => {
            const byId = (data || []).find((c:any) => String(c.id) === String(r.caracteristica_id));
            const rawName = String(r.name || r.nombre || '').toLowerCase();
            const byName = (data || []).find((c:any) => {
              const catName = String(c.nombre || '').toLowerCase();
              return catName === rawName || rawName.includes(catName) || catName.includes(rawName);
            });
            const found = byId || byName;
            return { ...r, unidad: r.unidad || (found ? found.unidad : '') };
          }) : null;

          // Si no hay filas, inicializar con orden fijo
          if (!rows || rows.length === 0) {
            const mapped = caracteristicasOrden.map(nameKey => {
              const found = (data || []).find((c:any) => String(c.nombre).toLowerCase() === String(nameKey).toLowerCase());
              return { caracteristica_id: found ? found.id : null, name: found ? found.nombre : nameKey, unidad: found ? found.unidad : '', minimo: '', nominal: '', maximo: '' };
            });
            // si el catálogo tiene ESPESOR en mm, añadirla también
            const espMmCat = (data || []).find((c:any) => String(c.nombre || '').toLowerCase() === 'espesor' && String((c.unidad || '').toLowerCase()) === 'mm');
            if (espMmCat) {
              // evitar duplicados
              const exists = mapped.find((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '').toLowerCase()) === 'mm');
              if (!exists) mapped.push({ caracteristica_id: espMmCat.id, name: espMmCat.nombre, unidad: espMmCat.unidad || 'mm', minimo: '', nominal: '', maximo: '' });
            }
            // Reorder: put ESPESOR (mm) after ALTO and move Micras to the end
            try {
              const mmIdx = mapped.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
              if (mmIdx > -1) {
                const it = mapped.splice(mmIdx,1)[0];
                const altoIdx = mapped.findIndex((r:any) => String(r.name || '').toUpperCase() === 'ALTO');
                const insertPos = altoIdx >= 0 ? altoIdx + 1 : 0;
                mapped.splice(insertPos,0,it);
              }
              const micIdx2 = mapped.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mic'));
              if (micIdx2 > -1) {
                const mic = mapped.splice(micIdx2,1)[0];
                mapped.push(mic);
              }
            } catch(e) {}
            return { ...f, caracteristicas: mapped };
          }

          // Si ya hay filas, pero el catálogo trae ESPESOR en mm y no está presente en las filas, añadirla
          const espMmCat2 = (data || []).find((c:any) => String(c.nombre || '').toLowerCase() === 'espesor' && String((c.unidad || '').toLowerCase()) === 'mm');
          if (espMmCat2) {
            const existsRow = rows.find((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '').toLowerCase()) === 'mm');
            if (!existsRow) {
              rows.push({ caracteristica_id: espMmCat2.id, name: espMmCat2.nombre, unidad: espMmCat2.unidad || 'mm', minimo: '', nominal: '', maximo: '' });
            }
          }
          // Reorder rows: ESPESOR (mm) after ALTO, ESPESOR (Micras) at end
          try {
            const mmIdx2 = rows.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
            if (mmIdx2 > -1) {
              const it = rows.splice(mmIdx2,1)[0];
              const altoIdx2 = rows.findIndex((r:any) => String(r.name || '').toUpperCase() === 'ALTO');
              const insertPos2 = altoIdx2 >= 0 ? altoIdx2 + 1 : 0;
              rows.splice(insertPos2,0,it);
            }
            const micIdx3 = rows.findIndex((r:any) => String(r.name || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mic'));
            if (micIdx3 > -1) {
              const mic = rows.splice(micIdx3,1)[0];
              rows.push(mic);
            }
          } catch(e) {}

          return { ...f, caracteristicas: rows };
        });
      } catch (err) {
        console.error('Error cargando catalogo caracteristicas', err);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    // Prefill desde location.state si venimos desde OrdenesVer
    const state: any = (location && (location as any).state) || {};
    if (state.orden) {
      const orden = state.orden;
      const producto = state.producto || {};

      // attempt to read measurements from product or order detalle
      const medidaAlto = producto.medida_alto || orden.detalle?.medida_alto || orden.detalle?.medida_alto_mm || '';
      const medidaAncho = producto.medida_ancho || orden.detalle?.medida_ancho || orden.detalle?.medida_ancho_mm || '';
      const medidaAlto_mm = orden.detalle?.medida_alto_mm || producto.medida_alto_mm || null;
      const medidaAncho_mm = orden.detalle?.medida_ancho_mm || producto.medida_ancho_mm || null;
      const espesorVal = orden.detalle?.espesor || producto.espesor || '';

      setForm((f:any) => {
        // build caracteristicas preserving existing rows but filling nominal where applicable
        const existing = Array.isArray(f?.caracteristicas) ? f.caracteristicas : [];
          const caracteristicas = existing.map((r:any) => {
          const name = String(r.name || r.nombre || '').toUpperCase();
          let nominal = r.nominal || '';
          if (name === 'LARGO' && !nominal) nominal = medidaAlto || '';
          if (name === 'ANCHO' && !nominal) nominal = medidaAncho || '';
          if (String(name).includes('ESPESOR') && !nominal) nominal = espesorVal || '';
          const updated: any = { ...r, nominal };
          // Si estamos prefijando espesor desde la orden, forzar unidad 'mm' para evitar que
          // el mapeo del catálogo asigne la característica de 'Micras' por defecto.
          try {
            if (String(name).toLowerCase().includes('espesor') && nominal && (!updated.unidad || String(updated.unidad).trim() === '')) {
              updated.unidad = 'mm';
            }
          } catch (e) {}
          // si nominal es numérico y no existen minimo/maximo, calcularlos
          const num = parseFloat(String(nominal).replace(',', '.'));
          if (!isNaN(num)) {
            const calc = computeStepAndBounds(String(nominal));
            if (!updated.minimo) updated.minimo = calc.min;
            if (!updated.maximo) updated.maximo = calc.max;
          }
          return updated;
        });

        // Ensure catalog-driven ESPESOR rows (mm + micras) are present when available
        try {
          const cat = catalogoCaracteristicas || [];
          const espMmCat = cat.find((c:any) => String(c.nombre || '').toLowerCase().includes('espesor') && String((c.unidad || '')).toLowerCase().includes('mm'));
          const espMicCat = cat.find((c:any) => String(c.nombre || '').toLowerCase().includes('espesor') && String((c.unidad || '')).toLowerCase().includes('mic'));
          const hasMmRow = caracteristicas.find((r:any) => String(r.name || r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
          const hasMicRow = caracteristicas.find((r:any) => String(r.name || r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mic'));
          if (espMmCat && !hasMmRow) {
            caracteristicas.push({ caracteristica_id: espMmCat.id, name: espMmCat.nombre, unidad: espMmCat.unidad || 'mm', minimo: '', nominal: '', maximo: '' });
          }
          if (!hasMicRow) {
            if (espMicCat) {
              caracteristicas.push({ caracteristica_id: espMicCat.id, name: espMicCat.nombre, unidad: espMicCat.unidad || 'micras', minimo: '', nominal: '', maximo: '' });
            } else {
              // Add a generic ESPESOR (micras) row so both units are present when prefilling from an order
              caracteristicas.push({ caracteristica_id: null, name: 'ESPESOR (micras)', unidad: 'micras', minimo: '', nominal: '', maximo: '' });
            }
          }
        } catch (e) {}

        // If the order provided an espesor value, set it into the ESPESOR (mm) row
        try {
          if (espesorVal !== null && espesorVal !== undefined && String(espesorVal).trim() !== '') {
            const raw = String(espesorVal);
            // find mm and mic rows
            const mmIdx = caracteristicas.findIndex((r:any) => String(r.name || r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mm'));
            const micIdx = caracteristicas.findIndex((r:any) => String(r.name || r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mic'));
            if (mmIdx > -1) {
              caracteristicas[mmIdx].nominal = raw;
              // compute min/max if missing
              try {
                const num = parseFloat(raw.replace(',', '.'));
                if (!isNaN(num)) {
                  try {
                    const calc = computeStepAndBounds(String(num));
                    caracteristicas[mmIdx].minimo = caracteristicas[mmIdx].minimo || calc.min;
                    caracteristicas[mmIdx].maximo = caracteristicas[mmIdx].maximo || calc.max;
                  } catch (e) {}
                }
              } catch (e) {}
            }
            if (micIdx > -1) {
              try {
                const num = parseFloat(raw.replace(',', '.'));
                if (!isNaN(num)) {
                  const micRaw = num * 1000;
                  let mic = '';
                  if (Math.abs(micRaw - Math.round(micRaw)) < 1e-9) mic = String(Math.round(micRaw));
                  else mic = String(parseFloat(micRaw.toFixed(4))).replace(/\.0+$/, '');
                  caracteristicas[micIdx].nominal = mic;
                  try {
                    const micNum = parseFloat(String(mic).replace(',', '.'));
                    if (!isNaN(micNum)) {
                      caracteristicas[micIdx].minimo = caracteristicas[micIdx].minimo || String(Number((micNum - 1)).toFixed(4)).replace(/\.0+$/, '');
                      caracteristicas[micIdx].maximo = caracteristicas[micIdx].maximo || String(Number((micNum + 1)).toFixed(4)).replace(/\.0+$/, '');
                    }
                  } catch (e) {}
                }
              } catch (e) {}
            }
          }
        } catch (e) {}

        return {
          ...f,
          numero_certificado: f.numero_certificado || null,
          numero_orden: orden.numero_orden || orden.numero_orden || '',
          orden_trabajo_id: orden.id || orden.id || null,
          cliente: orden.nombre_cliente || f.cliente,
          referencia: producto.producto || producto.descripcion || f.referencia,
          material: (orden.detalle && (orden.detalle.material || orden.detalle.proveedor_material)) || producto.material || f.material,
          descripcion: (orden.detalle && (orden.detalle.terminado_etiqueta || producto.terminado_etiqueta)) || f.descripcion,
          cantidad: producto.cantidad || f.cantidad,
          codigo: producto.cod_cliente || f.codigo,
          lote: (orden.detalle && (orden.detalle.lote_produccion || orden.detalle.lote_produccion)) || producto.lote || f.lote,
          orden_compra: orden.orden_compra || f.orden_compra,
          caracteristicas,
          // compute tamano_cm as "AnchoxAlto" in cm
          tamano_cm: (() => {
            const toNumber = (v: any) => {
              if (v === null || v === undefined) return NaN;
              const s = String(v).toLowerCase().trim();
              // extract first numeric occurrence
              const m = s.match(/[-+]?[0-9]*\.?[0-9]+/);
              if (!m) return NaN;
              return parseFloat(m[0].replace(',', '.'));
            };

            const fmt = (n: number) => {
              if (isNaN(n)) return '';
              if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
              return String(Math.round(n * 100) / 100);
            };

            // Determine ancho in cm
            let anchoCm: number | null = null;
            let altoCm: number | null = null;

            // prefer explicit mm fields when present
            if (medidaAncho_mm) {
              const num = toNumber(medidaAncho_mm);
              if (!isNaN(num)) anchoCm = num / 10;
            }
            if (medidaAlto_mm) {
              const num = toNumber(medidaAlto_mm);
              if (!isNaN(num)) altoCm = num / 10;
            }

            // fallback to raw values
            if (anchoCm === null) {
              const n = toNumber(medidaAncho);
              if (!isNaN(n)) {
                // heuristic: values > 100 likely in mm
                anchoCm = n > 100 ? n / 10 : n;
              }
            }
            if (altoCm === null) {
              const n = toNumber(medidaAlto);
              if (!isNaN(n)) {
                altoCm = n > 100 ? n / 10 : n;
              }
            }

            if (anchoCm === null || altoCm === null) return '';
            return `${fmt(anchoCm)}x${fmt(altoCm)}`;
          })()
        };
      });
    }
  }, [location]);

  // Keep ESPESOR (micras) synchronized with ESPESOR (mm) when the user edits values
  useEffect(() => {
    try {
      const rows = Array.isArray(form.caracteristicas) ? form.caracteristicas : [];
      if (rows.length === 0) return;
      let mmValue: string | null = null;
      rows.forEach((r:any) => {
        const name = String(r.name || r.nombre || '').toLowerCase();
        const unidad = String(r.unidad || '').toLowerCase();
        if (name.includes('espesor') && unidad.includes('mm')) {
          mmValue = r.nominal || null;
        }
      });
      if (!mmValue) return;
      const num = parseFloat(String(mmValue).replace(',', '.'));
      if (isNaN(num)) return;
      const micRaw = num * 1000;
      let micComputed = '';
      if (Math.abs(micRaw - Math.round(micRaw)) < 1e-9) micComputed = String(Math.round(micRaw));
      else micComputed = String(parseFloat(micRaw.toFixed(4))).replace(/\.0+$/, '');
      let changed = false;
      const newRows = rows.map((r:any) => ({ ...r }));
      const micIdx = newRows.findIndex((r:any) => String(r.name || r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad || '')).toLowerCase().includes('mic'));
      if (micIdx > -1) {
        const existing = String(newRows[micIdx].nominal || '').trim();
        const micManual = !!newRows[micIdx]._micras_manual;
        // If user marked micras as manual, do not overwrite their nominal value
        if (!micManual) {
          let localChanged = false;
          if (existing !== micComputed) {
            newRows[micIdx].nominal = micComputed;
            localChanged = true;
          }
          try {
            const micNum = parseFloat(String(micComputed).replace(',', '.'));
            if (!isNaN(micNum)) {
              const desiredMin = String(Math.round(micNum - 1));
              const desiredMax = String(Math.round(micNum + 1));
              if (String(newRows[micIdx].minimo || '') !== desiredMin) {
                newRows[micIdx].minimo = desiredMin;
                localChanged = true;
              }
              if (String(newRows[micIdx].maximo || '') !== desiredMax) {
                newRows[micIdx].maximo = desiredMax;
                localChanged = true;
              }
              if (newRows[micIdx]._micras_manual) {
                newRows[micIdx]._micras_manual = false;
                localChanged = true;
              }
            }
          } catch (e) {}
          if (localChanged) changed = true;
        }
      }
      if (changed) setForm((f:any) => ({ ...f, caracteristicas: newRows }));
    } catch (e) {
      // ignore sync errors
    }
  }, [form.caracteristicas]);

  const verPDF = async (certId: number) => {
    try {
      setPreviewUrl(null);
      setShowPreview(true);
      setPreviewLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${certId}/preview`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener la vista previa');
      const data = await res.json();
      if (!data.success || !data.pdf) throw new Error('Respuesta inválida al generar vista previa');
      setPreviewUrl(data.pdf);
    } catch (err: any) {
      console.error('Error en verPDF certificado:', err);
      toast.error(err.message || 'Error al cargar el PDF');
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const descargarPDF = async (certId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${certId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener el PDF');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 10000);
      toast.success('✅ PDF descargado exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar el PDF');
    }
  };

  const imprimirPDF = async (certId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${certId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener el PDF');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => { printWindow.print(); };
      } else {
        toast.error('No se pudo abrir la ventana de impresión. Permite ventanas emergentes.');
      }
      setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 10000);
    } catch (err: any) {
      toast.error(err.message || 'Error al imprimir el PDF');
    }
  };

  const cerrarPreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      try { window.URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    setPreviewUrl(null);
  };

  // Helper: sumar 1 año en formato YYYY-MM-DD
  const addOneYear = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Si la fecha de elaboración cambia y el usuario no editó la fecha de caducidad, auto-asignar +1 año
  useEffect(() => {
    const fechElab = form.fecha_elaboracion;
    if (!fechElab) return;
    if (!fechaCaducidadManual) {
      const nueva = addOneYear(fechElab);
      setForm((f:any) => ({ ...f, fecha_caducidad: nueva }));
    }
  }, [form.fecha_elaboracion, fechaCaducidadManual]);

  const guardarCertificado = async () => {
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');

      const payload: any = {
        numero_certificado: form.numero_certificado || null,
        orden_trabajo_id: form.orden_trabajo_id || null,
        numero_orden: form.numero_orden || null,
        cliente_nombre: form.cliente || null,
        producto_cod_mg: form.referencia || null,
        producto_cod_cliente: form.codigo || null,
        producto_descripcion: form.descripcion || null,
        // Enviamos cantidad tal cual (texto) para permitir valores como "500 unidades"
        cantidad: form.cantidad || null,
        cantidad_despachada: form.cantidad_despachada || null,
        codigo_producto: form.codigo || null,
        lote: form.lote || null,
        lote_despacho: form.lote_despacho || null,
        tamano_cm: form.tamano_cm || null,
        fecha_creacion: form.fecha_creacion || null,
        orden_compra: form.orden_compra || null,
        fecha_elaboracion: form.fecha_elaboracion || null,
        fecha_caducidad: form.fecha_caducidad || null,
        inspeccionado_por: form.inspeccionado_por || null,
        observaciones: form.observaciones || null,
        aprobado_area: form.aprobado_area || null,
        recepcion_area: form.recepcion_area || null,
        caracteristicas: Array.isArray(form.caracteristicas) ? form.caracteristicas.map((c:any, idx:number) => ({
            caracteristica_id: c.caracteristica_id || null,
            nombre: c.name || c.nombre || `c${idx+1}`,
            minimo: c.minimo || null,
            nominal: c.nominal || null,
            maximo: c.maximo || null,
            unidad: c.unidad || null,
            orden: idx
        })) : []
      };

      const res = await fetch(`${apiUrl}/api/certificados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar certificado');
      }

      const data = await res.json();
      // Mostrar confirmación y redirigir al listado de certificados
      toast.success(`Certificado ${data.numero_certificado || ''} guardado correctamente`);
      navigate('/certificados');
    } catch (error: any) {
      alert(error.message || 'Error al guardar certificado');
      setSaving(false);
    }
  };

  const actualizarCertificado = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');

      const payload: any = {
        numero_certificado: form.numero_certificado || null,
        orden_trabajo_id: form.orden_trabajo_id || null,
        numero_orden: form.numero_orden || null,
        cliente_nombre: form.cliente || null,
        referencia: form.referencia || null,
        producto_descripcion: form.descripcion || null,
        cantidad: form.cantidad || null,
        cantidad_despachada: form.cantidad_despachada || null,
        codigo_producto: form.codigo || null,
        lote: form.lote || null,
        lote_despacho: form.lote_despacho || null,
        tamano_cm: form.tamano_cm || null,
        fecha_creacion: form.fecha_creacion || null,
        orden_compra: form.orden_compra || null,
        fecha_elaboracion: form.fecha_elaboracion || null,
        fecha_caducidad: form.fecha_caducidad || null,
        inspeccionado_por: form.inspeccionado_por || null,
        observaciones: form.observaciones || null,
        aprobado_area: form.aprobado_area || null,
        recepcion_area: form.recepcion_area || null,
        caracteristicas: Array.isArray(form.caracteristicas) ? form.caracteristicas.map((c:any, idx:number) => ({
          caracteristica_id: c.caracteristica_id || null,
          nombre: c.name || c.nombre || `c${idx+1}`,
          minimo: c.minimo || null,
          nominal: c.nominal || null,
          maximo: c.maximo || null,
          unidad: c.unidad || null,
          orden: idx
        })) : []
      };

      const res = await fetch(`${apiUrl}/api/certificados/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al actualizar certificado');
      }

      const data = await res.json();
      toast.success(`Certificado ${data.numero_certificado || ''} actualizado correctamente`);
      navigate('/certificados');
    } catch (error: any) {
      alert(error.message || 'Error al actualizar certificado');
      setSaving(false);
    }
  };

  const guardarComoNuevo = async () => {
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');

      const payload: any = {
        numero_certificado: null,
        orden_trabajo_id: form.orden_trabajo_id || null,
        numero_orden: form.numero_orden || null,
        cliente_nombre: form.cliente || null,
        producto_cod_mg: form.referencia || null,
        producto_cod_cliente: form.codigo || null,
        producto_descripcion: form.descripcion || null,
        cantidad: form.cantidad || null,
        cantidad_despachada: form.cantidad_despachada || null,
        codigo_producto: form.codigo || null,
        lote: form.lote || null,
        lote_despacho: form.lote_despacho || null,
        tamano_cm: form.tamano_cm || null,
        fecha_creacion: form.fecha_creacion || null,
        orden_compra: form.orden_compra || null,
        fecha_elaboracion: form.fecha_elaboracion || null,
        fecha_caducidad: form.fecha_caducidad || null,
        inspeccionado_por: form.inspeccionado_por || null,
        observaciones: form.observaciones || null,
        aprobado_area: form.aprobado_area || null,
        recepcion_area: form.recepcion_area || null,
        caracteristicas: Array.isArray(form.caracteristicas) ? form.caracteristicas.map((c:any, idx:number) => ({
          caracteristica_id: c.caracteristica_id || null,
          nombre: c.name || c.nombre || `c${idx+1}`,
          minimo: c.minimo || null,
          nominal: c.nominal || null,
          maximo: c.maximo || null,
          unidad: c.unidad || null,
          orden: idx
        })) : []
      };

      const res = await fetch(`${apiUrl}/api/certificados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar certificado');
      }

      const data = await res.json();
      toast.success(`Certificado ${data.numero_certificado || ''} guardado correctamente`);
      navigate('/certificados');
    } catch (error: any) {
      alert(error.message || 'Error al guardar como nuevo');
      setSaving(false);
    }
  };

  const actualizar = (campo: string, valor: any) => setForm((f:any) => ({ ...f, [campo]: valor }));
  const actualizarCaracteristica = (index: number, campo: string, valor: any) => {
    setForm((f:any) => {
      const c = Array.isArray(f?.caracteristicas) ? [...f.caracteristicas] : [];
      const updated = { ...c[index], [campo]: valor };
      // Si se actualiza el nominal para LARGO/ANCHO/ESPESOR, ajustar mínimo y máximo automáticamente
      try {
        const name = String(updated.name || updated.nombre || '').toUpperCase();
        if (campo === 'nominal' && (name === 'LARGO' || name === 'ANCHO' || name.includes('ESPESOR'))) {
          const num = parseFloat(String(valor).replace(',', '.'));
          if (!isNaN(num)) {
            const calc = computeStepAndBounds(String(valor));
            updated.minimo = calc.min;
            updated.maximo = calc.max;
          }
        }
        // If user edits the micras nominal manually, mark it to avoid auto-sync
        if (campo === 'nominal') {
          const unidad = String(updated.unidad || '').toLowerCase();
          if (name.includes('ESPESOR') && unidad.includes('mic')) {
            updated._micras_manual = true;
          }
        }
      } catch (e) {
        // ignore
      }
      c[index] = updated;
      return { ...f, caracteristicas: c };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20"><Logo/></div>
              <div>
                <h1 className="text-xl font-bold">{esVista ? 'Ver Certificado' : 'Crear Certificado de Análisis de Calidad'}</h1>
                <div className="text-sm text-gray-600">Certificado N.: <span className="font-medium">{form.numero_certificado}</span></div>
              </div>
            </div>
            <div>
              <div className="flex items-center">
              <button className="px-4 py-2 bg-gray-400 text-white rounded mr-2" onClick={() => navigate('/certificados')}>Volver</button>
              {!esVista && (
                <button
                  className={`px-4 py-2 ${saving ? 'bg-gray-400' : 'bg-green-600'} text-white rounded`}
                  onClick={guardarCertificado}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                
              )}
              </div>
              {esVista && (
                <>
                  <button
                    className={`px-4 py-2 ${saving ? 'bg-gray-400' : 'bg-yellow-600'} text-white rounded ml-2`}
                    onClick={() => actualizarCertificado()}
                    disabled={saving}
                  >
                    {saving ? 'Actualizando...' : 'Actualizar'}
                  </button>

                  <button
                    className={`px-4 py-2 ${saving ? 'bg-gray-400' : 'bg-indigo-600'} text-white rounded ml-2`}
                    onClick={() => guardarComoNuevo()}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar como nuevo'}
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded ml-2"
                    onClick={() => { if (id) verPDF(Number(id)); }}
                  >
                    Ver / Imprimir PDF
                  </button>

                  {showDetailModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-2xl font-bold mb-2">Vista previa PDF - CERTIFICADO</h2>
                              <div className="text-green-100 text-sm">Certificado N° {form.numero_certificado || '-'}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={() => setShowDetailModal(false)} className="text-white hover:bg-green-500 rounded-full p-2">
                                <FaTimes size={20} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                              <p className="text-gray-900 font-medium">{form.cliente || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Referencia</label>
                              <p className="text-gray-900 font-medium">{form.referencia || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Material / Lote</label>
                              <p className="text-gray-900 font-medium">{(form.material || '-') + ' / ' + (form.lote || '-')}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600">Descripcion</label>
                            <div className="bg-white border rounded p-3">{form.descripcion || '-'}</div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                              <p className="text-gray-900 font-medium mb-1">{form.created_by_nombre || 'Sistema'}</p>
                              <p className="text-xs text-gray-500">{form.created_at ? new Date(form.created_at).toLocaleString('es-EC') : '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2" onClick={() => { if (id) verPDF(Number(id)); }}><FaFileAlt/> Ver / Imprimir</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Preview Modal (embed PDF) */}
                  {showPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
                          <button
                            onClick={() => cerrarPreview()}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {previewLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Generando vista previa...</p>
                              </div>
                            </div>
                          ) : (
                            previewUrl ? (
                              <embed src={previewUrl} type="application/pdf" className="w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">No hay PDF para mostrar.</div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-2/3 border-r pr-6">
              <div className="text-sm text-gray-700 mb-2">CERTIFICADO DE ANALISIS DE CALIDAD</div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">FECHA CREACIÓN (certificado):</label>
                    <input type="date" className="w-full border rounded px-2 py-1" value={form.fecha_creacion} onChange={(e) => actualizar('fecha_creacion', e.target.value)} />
                  </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">FECHA DE ELABORACIÓN:</label>
                  <input type="date" className="w-full border rounded px-2 py-1" value={form.fecha_elaboracion} onChange={(e) => actualizar('fecha_elaboracion', e.target.value)} />
                </div>
                {/* El número de certificado se muestra arriba en el título; aquí no es editable */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CLIENTE:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.cliente} onChange={(e) => actualizar('cliente', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">FECHA DE CADUCIDAD:</label>
                  <input type="date" className="w-full border rounded px-2 py-1" value={form.fecha_caducidad} onChange={(e) => actualizar('fecha_caducidad', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">REFERENCIA:</label>
                  <textarea
                    ref={referenciaRef}
                    rows={1}
                    className="w-full border rounded px-2 py-1 resize-none overflow-hidden"
                    value={form.referencia}
                    onChange={(e) => {
                      actualizar('referencia', e.target.value);
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }}
                    onInput={(e) => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">MATERIAL:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.material} onChange={(e) => actualizar('material', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600">TIPO DE TERMINADO:</label>
                  <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CANTIDAD:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.cantidad} onChange={(e) => actualizar('cantidad', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CODIGO:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.codigo} onChange={(e) => actualizar('codigo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">LOTE:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.lote} onChange={(e) => actualizar('lote', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CANTIDAD DESPACHADA:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.cantidad_despachada} onChange={(e) => actualizar('cantidad_despachada', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">LOTE DE DESPACHO:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.lote_despacho} onChange={(e) => actualizar('lote_despacho', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">TAMAÑO (<span className="lowercase">cm</span>):</label>
                  <input className="w-full border rounded px-2 py-1" value={form.tamano_cm} onChange={(e) => actualizar('tamano_cm', e.target.value)} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600">ORDEN DE COMPRA:</label>
                <input className="w-full border rounded px-2 py-1" value={form.orden_compra} onChange={(e) => actualizar('orden_compra', e.target.value)} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600">OBSERVACIONES:</label>
                <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.observaciones} onChange={(e) => actualizar('observaciones', e.target.value)} />
              </div>

            </div>

            <div className="w-2/3 pl-2">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-semibold mb-2">CARACTERÍSTICAS CUANTITATIVAS</div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm border" style={{ tableLayout: 'fixed' as const }}>
                  <thead>
                        <tr>
                          <th className="border px-5 py-2" style={{ width: '21%' }}>CARACTERÍSTICA</th>
                          <th className="border px-5 py-2" style={{ width: '14%' }}>UNIDAD</th>
                          <th className="border px-5 py-2" style={{ width: '14%' }}>MÍNIMO</th>
                          <th className="border px-5 py-2" style={{ width: '14%' }}>NOMINAL</th>
                          <th className="border px-5 py-2" style={{ width: '14%' }}>MÁXIMO</th>
                        </tr>
                  </thead>
                  <tbody>
                    {form.caracteristicas.map((row:any, idx:number) => (
                      <tr key={idx} className="text-sm">
                        <td className="border px-1 py-1">
                          <div className="text-sm font-medium">
                            {String(row.name || '')
                              .replace(/\s*\(.*\)\s*$/, '')
                              .toLowerCase()
                              .replace(/(^|\s)\S/g, s => s.toUpperCase())}
                          </div>
                        </td>
                        <td className="border px-1 text-center"><span className="text-sm">{row.unidad || (catalogoCaracteristicas.find((c:any) => String(c.id) === String(row.caracteristica_id))?.unidad) || ''}</span></td>
                        <td className="border px-1 text-center"><input value={row.minimo || ''} onChange={(e) => actualizarCaracteristica(idx, 'minimo', e.target.value)} className="w-full text-center text-sm px-1 py-1" /></td>
                        <td className="border px-1 text-center"><input value={row.nominal || ''} onChange={(e) => actualizarCaracteristica(idx, 'nominal', e.target.value)} className="w-full text-center text-sm px-1 py-1" /></td>
                        <td className="border px-1 text-center"><input value={row.maximo || ''} onChange={(e) => actualizarCaracteristica(idx, 'maximo', e.target.value)} className="w-full text-center text-sm px-1 py-1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-600">INSPECCIONADO POR:</label>
                  <EditableCombo
                    value={form.inspeccionado_por || ''}
                    onChange={(v) => actualizar('inspeccionado_por', v)}
                    options={[ 'GEOVANNY', 'ROBINSON', 'FERNANDO', 'WILLIAM' ]}
                    placeholder="Seleccione o escriba..."
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-600">ÁREA / DEPARTAMENTO (APROBADO POR):</label>
                  <input className="w-full border rounded px-2 py-1" value={form.aprobado_area || ''} onChange={(e) => actualizar('aprobado_area', e.target.value)} />
                </div>

                <div className="mt-4 border-t pt-3">
                  <div className="text-sm font-semibold mb-2">RECEPCIÓN DE PRODUCTO</div>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-600">CLIENTE:</label>
                    <input className="w-full border rounded px-2 py-1" value={form.cliente || ''} onChange={(e) => actualizar('cliente', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">ÁREA / DEPARTAMENTO (RECEPCIÓN):</label>
                    <input className="w-full border rounded px-2 py-1" value={form.recepcion_area || ''} onChange={(e) => actualizar('recepcion_area', e.target.value)} />
                  </div>
                </div>

                <div className="mt-6 text-xs text-gray-600">MUNDO GRAFIC certifica que el 100% del producto se encuentra revisado y aprobado por el control de calidad.</div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificadoForm;
