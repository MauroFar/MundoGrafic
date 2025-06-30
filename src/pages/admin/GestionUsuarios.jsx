import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', nombre_usuario: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '' });
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/");
  };

  // Cargar usuarios y áreas al montar
  useEffect(() => {
    fetchUsuarios();
    fetch(`${apiUrl}/api/areas`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAreas(data));
    // eslint-disable-next-line
  }, []);

  const fetchUsuarios = () => {
    fetch(`${apiUrl}/api/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
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
    const url = editId ? `${apiUrl}/api/usuarios/${editId}` : `${apiUrl}/api/usuarios`;
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
      setForm({ email: '', nombre_usuario: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '' });
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
      password: ''
    });
    setEditId(usuario.id);
  };

  const handleDelete = async id => {
    if (!window.confirm("¿Seguro que deseas borrar este usuario?")) return;
    const res = await fetch(`${apiUrl}/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchUsuarios();
    else alert("Error al borrar usuario");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-lg font-semibold">Cargando usuarios...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-2">
      <div className="relative max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition-all duration-200"
        >
          Cerrar sesión
        </button>
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Gestión de Usuarios</h2>
        <form onSubmit={handleSubmit} className="mb-10 bg-gray-50 p-6 rounded-xl shadow-inner grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} placeholder="Usuario" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2" />
          <select name="rol" value={form.rol} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="admin">Admin</option>
            <option value="ejecutivo">Ejecutivo</option>
            <option value="impresion">Impresión</option>
          </select>
          <select name="area_id" value={form.area_id} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required>
            <option value="">Seleccione un área</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.nombre}</option>
            ))}
          </select>
          <input name="password" value={form.password} onChange={handleChange} placeholder={editId ? "Nueva contraseña (opcional)" : "Contraseña"} type="password" className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2" />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold w-full transition-all duration-200">
              {editId ? "Actualizar" : "Crear"} Usuario
            </button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm({ email: '', nombre_usuario: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '' }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg w-full font-semibold transition-all duration-200">Cancelar</button>}
          </div>
        </form>
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Email</th>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Nombre</th>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Rol</th>
                <th className="px-4 py-3 text-left font-bold text-blue-900">Área</th>
                <th className="px-4 py-3 text-center font-bold text-blue-900">Activo</th>
                <th className="px-4 py-3 text-center font-bold text-blue-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {usuarios.map(u => (
                <tr key={u.id} className="odd:bg-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{u.nombre}</td>
                  <td className="px-4 py-2 whitespace-nowrap capitalize">{u.rol}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{areas.find(a => a.id === u.area_id)?.nombre || u.area_id}</td>
                  <td className="px-4 py-2 text-center">{u.activo ? <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Sí</span> : <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">No</span>}</td>
                  <td className="px-4 py-2 text-center flex gap-2 justify-center">
                    <button className="text-blue-600 hover:text-blue-900 font-semibold transition-all" onClick={() => handleEdit(u)} title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-900 font-semibold transition-all" onClick={() => handleDelete(u.id)} title="Borrar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionUsuarios; 