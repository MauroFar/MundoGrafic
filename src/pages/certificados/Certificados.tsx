import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';

const Certificados: React.FC = () => {
  const navigate = useNavigate();
  const [certificados, setCertificados] = useState<any[]>([]);

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

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Certificados existentes</h2>
          {certificados.length === 0 ? (
            <div className="text-gray-500">No hay certificados. Crea uno nuevo con el botón "Crear Certificado".</div>
          ) : (
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Orden</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{c.numero_orden || '-'}</td>
                    <td className="p-2">{c.cliente || '-'}</td>
                    <td className="p-2">{c.fecha || '-'}</td>
                    <td className="p-2">
                      <button className="px-2 py-1 bg-indigo-600 text-white rounded mr-2" onClick={() => navigate(`/certificados/ver/${c.id || i}`)}>Ver</button>
                      <button className="px-2 py-1 bg-yellow-600 text-white rounded" onClick={() => navigate(`/certificados/editar/${c.id || i}`)}>Editar</button>
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
