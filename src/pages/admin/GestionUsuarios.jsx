import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '' });
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/");
  };

  // Cargar usuarios y áreas al montar
  useEffect(() => {
    fetchUsuarios();
    fetch("http://localhost:5000/api/areas", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAreas(data));
    // eslint-disable-next-line
  }, []);

  const fetchUsuarios = () => {
    fetch("http://localhost:5000/api/usuarios", {
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
    const url = editId ? `http://localhost:5000/api/usuarios/${editId}` : "http://localhost:5000/api/usuarios";
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
      setForm({ email: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '' });
      setEditId(null);
    } else {
      alert("Error al guardar usuario");
    }
  };

  const handleEdit = usuario => {
    setForm({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      area_id: usuario.area_id || '',
      password: ''
    });
    setEditId(usuario.id);
  };

  const handleDelete = async id => {
    if (!window.confirm("¿Seguro que deseas borrar este usuario?")) return;
    const res = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchUsuarios();
    else alert("Error al borrar usuario");
  };

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mb-4 float-right"
      >
        Cerrar sesión
      </button>
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required className="border p-2 rounded w-full" />
        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required className="border p-2 rounded w-full" />
        <select name="rol" value={form.rol} onChange={handleChange} className="border p-2 rounded w-full">
          <option value="admin">Admin</option>
          <option value="ejecutivo">Ejecutivo</option>
          <option value="impresion">Impresión</option>
        </select>
        <select name="area_id" value={form.area_id} onChange={handleChange} className="border p-2 rounded w-full" required>
          <option value="">Seleccione un área</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>{area.nombre}</option>
          ))}
        </select>
        <input name="password" value={form.password} onChange={handleChange} placeholder={editId ? "Nueva contraseña (opcional)" : "Contraseña"} type="password" className="border p-2 rounded w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editId ? "Actualizar" : "Crear"} Usuario
        </button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ email: '', nombre: '', rol: 'ejecutivo', area_id: '', password: '' }); }} className="ml-2 text-gray-600">Cancelar</button>}
      </form>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Área</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.nombre}</td>
              <td>{u.rol}</td>
              <td>{areas.find(a => a.id === u.area_id)?.nombre || u.area_id}</td>
              <td>{u.activo ? 'Sí' : 'No'}</td>
              <td>
                <button className="text-blue-600 mr-2" onClick={() => handleEdit(u)}>Editar</button>
                <button className="text-red-600" onClick={() => handleDelete(u.id)}>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GestionUsuarios; 