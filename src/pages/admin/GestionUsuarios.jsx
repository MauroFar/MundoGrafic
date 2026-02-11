import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FirmaModalOptimized from "../../components/FirmaModalOptimized";
import PermisosModal from "../../components/PermisosModal";
import * as rolesService from '../../services/rolesService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', nombre_usuario: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '', email_personal: '', celular: '', activo: true });
  const [editId, setEditId] = useState(null);
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Cargar usuarios y áreas al montar
  useEffect(() => {
    fetchUsuarios();
    Promise.all([
      fetch(`${API_URL}/api/areas`, getAuthHeaders()).then(res => res.json()),
      rolesService.obtenerRoles()
    ]).then(([areasData, rolesData]) => {
      setAreas(areasData);
      setRoles(rolesData);
    }).catch(error => {
      console.error('Error cargando datos:', error);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, []);

  const fetchUsuarios = () => {
    fetch(`${API_URL}/api/usuarios`, getAuthHeaders())
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
        setLoading(false);
      });
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const url = editId ? `${API_URL}/api/usuarios/${editId}` : `${API_URL}/api/usuarios`;
    const method = editId ? "PUT" : "POST";
    const body = { ...form };
    if (!form.password) delete body.password;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      fetchUsuarios();
      setForm({ email: '', nombre_usuario: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '', email_personal: '', celular: '', activo: true });
      setEditId(null);
    } else {
      alert("Error al guardar usuario");
    }
  };

  const handleEdit = usuario => {
    setForm({
      email: usuario.email,
      nombre_usuario: usuario.nombre_usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      area_id: usuario.area_id || '',
      password: '',
      email_personal: usuario.email_personal || '',
      celular: usuario.celular || '',
      activo: usuario.activo !== undefined ? usuario.activo : true
    });
    setEditId(usuario.id);
  };

  const handleDelete = async id => {
    if (!window.confirm("¿Seguro que deseas borrar este usuario?")) return;
    const res = await fetch(`${API_URL}/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchUsuarios();
    else alert("Error al borrar usuario");
  };

  const handleConfigurarFirma = (usuario) => {
    setSelectedUsuario(usuario);
    setShowFirmaModal(true);
  };

  const handleConfigurarPermisos = (usuario) => {
    setSelectedUsuario(usuario);
    setShowPermisosModal(true);
  };

  const handleSaveFirma = async (htmlCode) => {
    try {
      // Verificar tamaño del HTML
      const htmlSize = new Blob([htmlCode]).size;
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (htmlSize > maxSize) {
        alert(`❌ El HTML de la firma es demasiado grande (${(htmlSize / 1024 / 1024).toFixed(2)}MB). El límite es 50MB.`);
        return;
      }

      const res = await fetch(`${API_URL}/api/usuarios/${selectedUsuario.id}/firma`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          firma_html: htmlCode,
          firma_activa: true 
        })
      });
      
      if (res.ok) {
        alert("✅ Firma guardada correctamente");
        fetchUsuarios(); // Recargar lista
      } else {
        let errorMessage = "Error desconocido";
        
        if (res.status === 413) {
          errorMessage = "El HTML de la firma es demasiado grande. Intenta reducir el tamaño de las imágenes.";
        } else if (res.status === 404) {
          errorMessage = "Usuario no encontrado";
        } else if (res.status === 401) {
          errorMessage = "No autorizado";
        } else {
          try {
            const error = await res.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            errorMessage = `Error del servidor (${res.status})`;
          }
        }
        
        alert(`❌ Error al guardar la firma: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error al guardar firma:', error);
      alert(`❌ Error de conexión: ${error.message}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-lg font-semibold">Cargando usuarios...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-8 px-2">
      <div className="relative w-full max-w-6xl mx-auto bg-white p-12 rounded-3xl shadow-2xl border border-gray-100 flex flex-col gap-8">
        <button
          onClick={() => navigate('/administracion')}
          className="absolute top-8 left-8 bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg shadow transition-all duration-200 text-base font-semibold flex items-center gap-2"
        >
          ← Regresar
        </button>
        <h2 className="text-4xl font-extrabold mb-10 text-center text-blue-900 tracking-tight drop-shadow">Gestión de Usuarios</h2>
        <form onSubmit={handleSubmit} className="mb-8 bg-blue-50/60 p-8 rounded-2xl shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 border border-blue-100">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-blue-900 mb-2">Email Corporativo *</label>
            <input id="email" name="email" value={form.email} onChange={handleChange} placeholder="ejemplo@empresa.com" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div>
            <label htmlFor="nombre_usuario" className="block text-sm font-bold text-blue-900 mb-2">Usuario *</label>
            <input id="nombre_usuario" name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} placeholder="Usuario" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="nombre" className="block text-sm font-bold text-blue-900 mb-2">Nombre Completo *</label>
            <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div>
            <label htmlFor="rol" className="block text-sm font-bold text-blue-900 mb-2">Rol *</label>
            <div className="flex gap-2">
              <select id="rol" name="rol" value={form.rol} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                <option value="">Seleccione un rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.nombre}>{rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => navigate('/admin/roles')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                title="Ir a configurar roles"
              >
                ⚙️
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="area_id" className="block text-sm font-bold text-blue-900 mb-2">Área *</label>
            <div className="flex gap-2">
              <select id="area_id" name="area_id" value={form.area_id} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                <option value="">Seleccione un área</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => navigate('/admin/areas')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                title="Ir a configurar áreas"
              >
                ⚙️
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="password" className="block text-sm font-bold text-blue-900 mb-2">
              {editId ? "Nueva Contraseña (Opcional)" : "Contraseña *"}
            </label>
            <input id="password" name="password" value={form.password} onChange={handleChange} placeholder={editId ? "Dejar en blanco para mantener la actual" : "Contraseña"} type="password" className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="celular" className="block text-sm font-bold text-blue-900 mb-2">Celular (Opcional)</label>
            <input id="celular" name="celular" value={form.celular} onChange={handleChange} placeholder="Ej: 3001234567" className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          {/* Campo de email personal (visible para todos los roles) */}
          <div className="md:col-span-2">
            <label htmlFor="email_personal" className="block text-sm font-bold text-blue-900 mb-2">
              Email Personal {form.rol === 'ejecutivo' && '(Requerido para envío de cotizaciones)'}
            </label>
            <input 
              id="email_personal"
              name="email_personal" 
              value={form.email_personal || ''} 
              onChange={handleChange} 
              placeholder="ejemplo@gmail.com" 
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.rol === 'ejecutivo' 
                ? '📧 Este email se usará para enviar cotizaciones desde la cuenta del ejecutivo' 
                : 'Email personal de contacto (opcional)'
              }
            </p>
          </div>
          
          {/* Estado activo del usuario */}
          <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <input 
              type="checkbox" 
              id="activo" 
              name="activo" 
              checked={form.activo} 
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="activo" className="text-sm font-bold text-blue-900 cursor-pointer">
              Usuario Activo
              <span className="block text-xs font-normal text-gray-600 mt-1">
                {form.activo ? '✅ El usuario puede iniciar sesión' : '❌ El usuario no podrá iniciar sesión'}
              </span>
            </label>
          </div>
          
          {/* Botón de configuración de firma para ejecutivos */}
          {form.rol === 'ejecutivo' && (
            <div className="md:col-span-2">
              <button 
                type="button" 
                onClick={() => {
                  if (editId) {
                    // Si estamos editando, abrir modal con datos del usuario
                    const usuario = usuarios.find(u => u.id === editId);
                    if (usuario) {
                      handleConfigurarFirma(usuario);
                    }
                  } else {
                    // Si estamos creando, mostrar mensaje
                    alert("Primero crea el usuario ejecutivo, luego podrás configurar su firma desde la tabla.");
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold w-full transition-colors"
              >
                📧 Configurar Firma de Email
              </button>
            </div>
          )}
          
          <div className="flex gap-4 md:col-span-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold w-full text-lg shadow transition-all duration-200">
              {editId ? "Actualizar" : "Crear"} Usuario
            </button>
                         {editId && <button type="button" onClick={() => { setEditId(null); setForm({ email: '', nombre_usuario: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '', email_personal: '', celular: '', activo: true }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl w-full font-bold text-lg shadow transition-all duration-200">Cancelar</button>}
          </div>
        </form>
        <div className="overflow-x-auto rounded-2xl shadow-lg border border-blue-100 bg-white">
          <table className="min-w-full divide-y divide-blue-100 text-base">
            <thead className="bg-blue-100/60">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Email</th>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Usuario</th>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Nombre</th>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Rol</th>
                                 <th className="px-4 py-3 text-left font-bold text-blue-900">Área</th>
                 <th className="px-4 py-3 text-center font-bold text-blue-900">Email Personal</th>
                 <th className="px-4 py-3 text-center font-bold text-blue-900">Firma</th>
                 <th className="px-4 py-3 text-center font-bold text-blue-900">Activo</th>
                 <th className="px-4 py-3 text-center font-bold text-blue-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-50">
              {usuarios.map(u => (
                <tr key={u.id} className="odd:bg-blue-50/30 hover:bg-blue-100/60 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{u.nombre_usuario}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{u.nombre}</td>
                  <td className="px-4 py-2 whitespace-nowrap capitalize">{u.rol}</td>
                                     <td className="px-4 py-2 whitespace-nowrap">{areas.find(a => a.id === u.area_id)?.nombre || u.area_id}</td>
                   <td className="px-4 py-2 text-center">
                     {u.rol === 'ejecutivo' ? (
                       u.email_personal ? (
                         <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded" title={u.email_personal}>
                           ✅ {u.email_personal}
                         </span>
                       ) : (
                         <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                           ❌ Sin configurar
                         </span>
                       )
                     ) : (
                       <span className="text-gray-400">-</span>
                     )}
                   </td>
                   <td className="px-4 py-2 text-center">
                    {u.rol === 'ejecutivo' ? (
                      u.firma_html ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">✅ Configurada</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">❌ Sin configurar</span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">{u.activo ? <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Sí</span> : <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">No</span>}</td>
                                     <td className="px-4 py-2 text-center flex gap-2 justify-center flex-wrap">
                     <button className="text-blue-700 hover:text-blue-900 font-bold transition-all px-3 py-1 rounded-lg bg-blue-100/60 shadow-sm" onClick={() => handleEdit(u)} title="Editar">
                       <svg xmlns="http://www.w3.org/2000/svg" className="inline w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
                       Editar
                     </button>
                     <button className="text-green-700 hover:text-green-900 font-bold transition-all px-3 py-1 rounded-lg bg-green-100/60 shadow-sm" onClick={() => handleConfigurarPermisos(u)} title="Configurar Permisos CRUD">
                       🔐 Permisos
                     </button>
                     {u.rol === 'ejecutivo' && (
                       <button className="text-purple-700 hover:text-purple-900 font-bold transition-all px-3 py-1 rounded-lg bg-purple-100/60 shadow-sm" onClick={() => handleConfigurarFirma(u)} title="Configurar Firma">
                         📧 Firma
                       </button>
                     )}
                     {u.rol !== "admin" && (
                       <button className="text-red-700 hover:text-red-900 font-bold transition-all px-3 py-1 rounded-lg bg-red-100/60 shadow-sm" onClick={() => handleDelete(u.id)} title="Borrar">
                         <svg xmlns="http://www.w3.org/2000/svg" className="inline w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         Borrar
                       </button>
                     )}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
                 </div>
       </div>
       
               {/* Modal de Firma Optimizado */}
        <FirmaModalOptimized
          isOpen={showFirmaModal}
          onClose={() => setShowFirmaModal(false)}
          onSave={handleSaveFirma}
          usuario={selectedUsuario}
        />
        
        {/* Modal de Permisos */}
        {showPermisosModal && selectedUsuario && (
          <PermisosModal
            usuario={selectedUsuario}
            onClose={() => setShowPermisosModal(false)}
            onSave={() => {
              fetchUsuarios();
              setShowPermisosModal(false);
            }}
          />
        )}
     </div>
   );
 }

export default GestionUsuarios;