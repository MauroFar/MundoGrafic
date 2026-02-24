import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { toast } from 'react-toastify';
import { FaTimes, FaFileAlt, FaEye, FaEdit } from 'react-icons/fa';

const formatDate = (d: string | null) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('es-EC'); } catch { return d; }
}

const Certificados: React.FC = () => {
  const navigate = useNavigate();
  const [certificados, setCertificados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const cargarCertificados = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al cargar certificados');
      const data = await res.json();
      setCertificados(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al cargar certificados');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarCertificados(); }, []);

  // noop

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-24"><Logo/></div>
            <h1 className="text-2xl font-bold">Certificados de Análisis de Calidad</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => navigate('/certificados/crear')}
            >
              + Crear Certificado
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => { /* refrescar lista en el futuro */ }}
            >
              Actualizar lista
            </button>
          </div>
        </div>
        {/* Detail modal will be rendered below when needed */}
        {showDetailModal && selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Detalle Certificado</h2>
                    <div className="text-green-100 text-sm">N° {selectedCert.numero_certificado || '-'}</div>
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
                    <p className="text-gray-900 font-medium">{selectedCert.cliente_nombre || selectedCert.cliente || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Referencia</label>
                    <p className="text-gray-900 font-medium">{selectedCert.referencia || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Material / Lote</label>
                    <p className="text-gray-900 font-medium">{(selectedCert.material || '-') + ' / ' + (selectedCert.lote || '-')}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600">Descripcion</label>
                  <div className="bg-white border rounded p-3">{selectedCert.descripcion || '-'}</div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600">Observaciones</label>
                  <div className="bg-white border rounded p-3">{selectedCert.observaciones || '-'}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                    <p className="text-gray-900 font-medium mb-1">{selectedCert.created_by_nombre || 'Sistema'}</p>
                    <p className="text-xs text-gray-500">{selectedCert.created_at ? new Date(selectedCert.created_at).toLocaleString('es-EC') : '-'}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2" onClick={async () => {
                      try {
                        setPdfLoading(true);
                        const apiUrl = import.meta.env.VITE_API_URL;
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${apiUrl}/api/certificados/${selectedCert.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
                        if (!res.ok) throw new Error('Error al generar PDF');
                        const blob = await res.blob();
                        if (blob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
                        const url = window.URL.createObjectURL(blob);
                        const win = window.open(url, '_blank');
                        if (!win) {
                          toast.error('No se pudo abrir la ventana. Permite ventanas emergentes y vuelve a intentarlo.');
                          // as fallback, trigger download
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `certificado_${selectedCert.numero_certificado || selectedCert.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } else {
                          // leave URL to be handled by browser; revoke after delay
                          setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 20000);
                        }
                      } catch (err:any) {
                        toast.error(err.message || 'Error al obtener PDF');
                      } finally { setPdfLoading(false); }
                    }}>{pdfLoading ? 'Generando...' : (<><FaFileAlt/> Ver / Imprimir</>)}</button>
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
                  onClick={() => { setShowPreview(false); if (previewUrl) { try { window.URL.revokeObjectURL(previewUrl); } catch (e) {} } setPreviewUrl(null); }}
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
                    <object data={previewUrl} type="application/pdf" className="w-full h-full">
                      <p>No se puede mostrar el PDF. Por favor, intente abrirlo en otra pestaña.</p>
                    </object>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">No hay PDF para mostrar.</div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Certificados existentes</h2>
          {loading ? (
            <div>Cargando certificados...</div>
          ) : certificados.length === 0 ? (
            <div className="text-gray-500">No hay certificados. Crea uno nuevo con el botón "Crear Certificado".</div>
          ) : (
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Orden</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">N° Cert.</th>
                  <th className="p-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{c.numero_orden || '-'}</td>
                    <td className="p-2">{c.cliente_nombre || c.cliente || '-'}</td>
                    <td className="p-2">{formatDate(c.fecha_creacion || c.fecha || c.created_at)}</td>
                    <td className="p-2">{c.numero_certificado || '-'}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded flex flex-col items-center"
                          onClick={() => { setSelectedCert(c); setShowDetailModal(true); }}
                          title="Ver"
                        >
                          <FaEye />
                          <span className="text-xs mt-1 text-gray-600">Ver</span>
                        </button>

                        <button
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded flex flex-col items-center"
                          onClick={() => navigate(`/certificados/editar/${c.id || i}`)}
                          title="Editar"
                        >
                          <FaEdit />
                          <span className="text-xs mt-1 text-gray-600">Editar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificados;

