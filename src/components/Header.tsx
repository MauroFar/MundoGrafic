import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  nombre_usuario: string;
  rol: string;
}

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const showMenuButton = location.pathname !== '/' && location.pathname !== '/welcome';
  const nombre = localStorage.getItem("nombre") || "Usuario";
  const rol = localStorage.getItem("rol") || "";
  const apiUrl = import.meta.env.VITE_API_URL;

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombre");
    navigate("/", { replace: true });
    window.location.reload();
  };

  // Manejar eventos globales de notificación
  useEffect(() => {
    const handleNewNotification = (e: any) => {
      setNotifications((prev) => [e.detail, ...prev]);
    };
    window.addEventListener("nueva-notificacion", handleNewNotification);
    return () => {
      window.removeEventListener("nueva-notificacion", handleNewNotification);
    };
  }, []);

  // Cerrar los menús si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setMessagesOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (menuOpen || messagesOpen || notificationsOpen || settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, messagesOpen, notificationsOpen, settingsOpen]);

  // Fetch usuarios al abrir mensajes (para cualquier usuario autenticado)
  useEffect(() => {
    if (messagesOpen) {
      setLoadingUsuarios(true);
      setErrorUsuarios(null);
      const token = localStorage.getItem("token");
      fetch(`${apiUrl}/api/chat/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("No se pudo obtener la lista de usuarios");
          return res.json();
        })
        .then(data => setUsuarios(data))
        .catch(err => setErrorUsuarios(err.message))
        .finally(() => setLoadingUsuarios(false));
    }
  }, [messagesOpen, apiUrl]);

  return (
    <>
    <header className="header-topbar">
      <div className="header-left">
        {showMenuButton && (
          <button className="menu-principal-btn" onClick={() => navigate('/welcome')} title="Ir al Menú Principal">🏠 Menú Principal</button>
        )}
      </div>
      <div className="header-right">
        {/* Notificaciones */}
        <div className="notifications-menu-wrapper" ref={notificationsRef}>
          <button className="icon-btn notification-btn" title="Notificaciones" onClick={() => setNotificationsOpen((v) => !v)}>
            <span role="img" aria-label="notificaciones">🔔</span>
            {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="notifications-dropdown">
              <div className="notifications-title">Notificaciones</div>
              {notifications.length === 0 ? (
                <div className="notifications-empty">No hay notificaciones.</div>
              ) : (
                <ul className="notifications-list">
                  {notifications.map((n, idx) => (
                    <li key={idx} className="notification-item">
                      <div className="notification-title">{n.titulo}</div>
                      <div className="notification-body">{n.mensaje}</div>
                      <div className="notification-date">{n.fecha}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {/* Mensajes */}
        <div className="messages-menu-wrapper" ref={messagesRef}>
          <button
            className="icon-btn message-btn"
            title="Mensajes"
            onClick={() => setMessagesOpen((v) => !v)}
          >
            <span role="img" aria-label="mensajes">💬</span>
            <span className="badge">2</span>
          </button>
          {messagesOpen && (
            <div className="messages-dropdown">
              <div className="messages-title">Usuarios registrados</div>
              {loadingUsuarios ? (
                <div className="messages-loading">Cargando...</div>
              ) : errorUsuarios ? (
                <div className="messages-error">{errorUsuarios}</div>
              ) : (
                <ul className="messages-list">
                  {usuarios.map((u) => (
                    <li key={u.id} className="messages-user-item">
                      <div className="messages-user-name">{u.nombre}</div>
                      <div className="messages-user-rol">{u.rol}</div>
                    </li>
                  ))}
                  {usuarios.length === 0 && <li className="messages-empty">No hay usuarios registrados.</li>}
                </ul>
              )}
            </div>
          )}
        </div>
        {/* Usuario y avatar */}
        <div className="user-menu-wrapper" ref={menuRef}>
          <button className="user-btn" onClick={() => setMenuOpen((v) => !v)}>
            <span className="user-name">{nombre}</span>
            {/* Avatar eliminado */}
          </button>
        </div>
        {/* Configuración */}
        <div className="settings-menu-wrapper" ref={settingsRef}>
          <button className="icon-btn settings-btn" title="Configuración" onClick={() => setSettingsOpen((v) => !v)}>
            <span role="img" aria-label="configuracion">⚙️</span>
          </button>
          {settingsOpen && (
            <div className="user-dropdown">
              <button
                className="dropdown-item"
                onClick={() => { setSettingsOpen(false); navigate('/admin/usuarios'); }}
              >
                Editar registros
              </button>
              <button className="dropdown-item" onClick={() => { setSettingsOpen(false); handleLogout(); }}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    
    </>
  );
};

export default Header; 