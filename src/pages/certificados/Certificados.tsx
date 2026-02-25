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
      // Ordenar por fecha de creación (más recientes primero). Usar created_at, fecha_creacion o fecha si están disponibles.
      const arr = Array.isArray(data) ? data.slice() : [];
      arr.sort((a: any, b: any) => {
        const ta = new Date(a.created_at || a.fecha_creacion || a.fecha || 0).getTime();
        const tb = new Date(b.created_at || b.fecha_creacion || b.fecha || 0).getTime();
        return tb - ta;
      });
      setCertificados(arr);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al cargar certificados');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarCertificados(); }, []);

  const verPDF = async (id: number) => {
    try {
      setPreviewUrl(null);
      setShowPreview(true);
      setPreviewLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${id}/preview`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener la vista previa');
      const data = await res.json();
      if (!data.success || !data.pdf) throw new Error('Respuesta inválida al generar vista previa');
      setPreviewUrl(data.pdf);
    } catch (err: any) {
      console.error('Error en verPDF certificados:', err);
      toast.error(err.message || 'Error al cargar el PDF');
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const descargarPDF = async (id: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener el PDF');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 10000);
      toast.success('✅ PDF descargado exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar el PDF');
    }
  };

  const imprimirPDF = async (id: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
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
              onClick={() => { cargarCertificados(); }}
            >
              Actualizar lista
            </button>
          </div>
        </div>
      
        {showDetailModal && selectedCert && (
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
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
                  onClick={() => { if (selectedCert && selectedCert.id) verPDF(selectedCert.id); }}
                >
                  <FaFileAlt />
                  <span>Ver / Imprimir</span>
                </button>
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
                          onClick={() => { if (c && c.id) verPDF(c.id); else toast.error('ID del certificado no disponible'); }}
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

