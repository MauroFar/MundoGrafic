import React from 'react';
import {
  FaTimes,
  FaUser,
  FaFileAlt,
  FaCalendar,
  FaClipboardList,
  FaHistory,
  FaEdit,
  FaCheckCircle
} from 'react-icons/fa';

interface Caracteristica {
  name?: string;
  nombre?: string;
  unidad?: string;
  minimo?: string | number;
  nominal?: string | number;
  maximo?: string | number;
}

interface Certificado {
  id?: number;
  numero_certificado?: string;
  fecha_creacion?: string;
  fecha_elaboracion?: string;
  fecha_caducidad?: string;
  cliente?: string;
  cliente_nombre?: string;
  referencia?: string;
  producto_cod_mg?: string;
  material?: string;
  descripcion?: string;
  producto_descripcion?: string;
  cantidad?: string | number;
  cantidad_despachada?: string | number;
  codigo?: string;
  codigo_producto?: string;
  lote?: string;
  lote_despacho?: string;
  tamano_cm?: string;
  orden_compra?: string;
  aprobado_area?: string;
  recepcion_area?: string;
  inspeccionado_por?: string;
  observaciones?: string;
  caracteristicas?: Caracteristica[];
  created_at?: string;
  created_by_nombre?: string;
  updated_at?: string;
  updated_by_nombre?: string;
}

interface Props {
  certificado: Certificado | null;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onVerPDF?: (id: number) => void;
  canEdit?: boolean;
}

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d; }
};

const Field: React.FC<{ label: string; value?: string | number | null; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
    <label className="text-sm text-gray-500 block mb-1">{label}</label>
    <p className="text-gray-900 font-medium">{value || '-'}</p>
  </div>
);

const CertificadoDetalleModal: React.FC<Props> = ({ certificado, onClose, onEdit, onVerPDF, canEdit = false }) => {
  if (!certificado) return null;

  const cliente = certificado.cliente_nombre || certificado.cliente || '-';
  const referencia = certificado.referencia || certificado.producto_cod_mg || '-';
  const descripcion = certificado.descripcion || certificado.producto_descripcion || '-';
  const codigo = certificado.codigo || certificado.codigo_producto || '-';
  const caracteristicas: Caracteristica[] = Array.isArray(certificado.caracteristicas) ? certificado.caracteristicas : [];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <FaCheckCircle className="text-blue-300" />
                Certificado de Análisis de Calidad
              </h2>
              <div className="text-blue-100 text-lg font-semibold">
                N° {certificado.numero_certificado || '-'}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-600 rounded-full p-2 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
        </div>

        {/* ── CONTENIDO ── */}
        <div className="p-6 space-y-6">

          {/* ── 1. FECHAS ── */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaCalendar className="mr-2 text-blue-600" /> Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Fecha de Creación" value={formatDate(certificado.fecha_creacion || certificado.created_at)} />
              <Field label="Fecha de Elaboración" value={formatDate(certificado.fecha_elaboracion)} />
              <Field label="Fecha de Caducidad" value={formatDate(certificado.fecha_caducidad)} />
            </div>
          </div>

          {/* ── 2. INFORMACIÓN DEL CLIENTE / PEDIDO ── */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaUser className="mr-2 text-blue-600" /> Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Cliente" value={cliente} />
              <Field label="Orden de Compra" value={certificado.orden_compra} />
              <Field label="Área del Cliente (Recepción del Producto)" value={certificado.recepcion_area} />
              <Field label="Área Aprobado" value={certificado.aprobado_area} />
            </div>
          </div>

          {/* ── 3. INFORMACIÓN DEL PRODUCTO ── */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaClipboardList className="mr-2 text-blue-600" /> Información del Producto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Referencia / Cod. MG" value={referencia} />
              <Field label="Código Producto" value={codigo} />
              {(certificado.material) && (
                <Field label="Material" value={certificado.material} />
              )}
              <Field label="Descripción" value={descripcion} className="md:col-span-3" />
              <Field label="Cantidad" value={certificado.cantidad} />
              <Field label="Cantidad Despachada" value={certificado.cantidad_despachada} />
              <Field label="Tamaño (cm)" value={certificado.tamano_cm} />
              <Field label="Lote" value={certificado.lote} />
              <Field label="Lote de Despacho" value={certificado.lote_despacho} />
              <Field label="Inspeccionado por" value={certificado.inspeccionado_por} />
            </div>
          </div>

          {/* ── 4. CARACTERÍSTICAS DE CALIDAD ── */}
          {caracteristicas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                <FaCheckCircle className="mr-2 text-blue-600" /> Características de Calidad
              </h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Característica</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Unidad</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Mínimo</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Nominal</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Máximo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caracteristicas.map((c, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 border-b text-gray-900 font-medium text-sm">
                          {c.nombre || c.name || '-'}
                        </td>
                        <td className="px-4 py-2 border-b text-gray-600 text-sm">
                          {c.unidad || '-'}
                        </td>
                        <td className="px-4 py-2 border-b text-center text-gray-900 text-sm">
                          {c.minimo !== null && c.minimo !== undefined && c.minimo !== '' ? c.minimo : '-'}
                        </td>
                        <td className="px-4 py-2 border-b text-center text-blue-700 font-semibold text-sm">
                          {c.nominal !== null && c.nominal !== undefined && c.nominal !== '' ? c.nominal : '-'}
                        </td>
                        <td className="px-4 py-2 border-b text-center text-gray-900 text-sm">
                          {c.maximo !== null && c.maximo !== undefined && c.maximo !== '' ? c.maximo : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 5. OBSERVACIONES ── */}
          {certificado.observaciones && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                <FaFileAlt className="mr-2 text-blue-600" /> Observaciones
              </h3>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-gray-900 whitespace-pre-wrap">{certificado.observaciones}</p>
              </div>
            </div>
          )}

          {/* ── 6. AUDITORÍA ── */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
              <FaHistory className="mr-2 text-blue-600" /> Auditoría
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                <p className="text-gray-900 font-medium mb-1">{certificado.created_by_nombre || 'Sistema'}</p>
                <p className="text-xs text-gray-500">
                  {certificado.created_at
                    ? new Date(certificado.created_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                    : '-'}
                </p>
              </div>
              {certificado.updated_by_nombre && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm text-gray-600 block mb-2 font-semibold">Última modificación por</label>
                  <p className="text-gray-900 font-medium mb-1">{certificado.updated_by_nombre}</p>
                  <p className="text-xs text-gray-500">
                    {certificado.updated_at
                      ? new Date(certificado.updated_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                      : '-'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTONES ── */}
          <div className="flex gap-3 pt-4 border-t">
            {onVerPDF && certificado.id && (
              <button
                onClick={() => { onVerPDF(certificado.id!); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FaFileAlt /> Ver / Imprimir PDF
              </button>
            )}
            {canEdit && onEdit && certificado.id && (
              <button
                onClick={() => { onClose(); onEdit(certificado.id!); }}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FaEdit /> Editar Certificado
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FaTimes /> Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CertificadoDetalleModal;
