import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl, API_CONFIG } from "../config/api";
import { FiEye, FiEyeOff } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Construir URL de login usando configuración centralizada con fallback seguro
  const loginUrl = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.user.rol);
        localStorage.setItem("nombre", data.user.nombre);
        try { localStorage.setItem("user", JSON.stringify(data.user)); } catch (_) {}
        // Todos los usuarios van al menú principal
        navigate("/welcome");
      } else {
        alert(data.error || "Credenciales incorrectas. Intenta nuevamente.");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/mundografic.jpg')" }}
      aria-label="Pantalla de inicio de sesión"
    >
      <section
        className="bg-white/20 backdrop-blur-md w-full max-w-sm rounded-2xl shadow-lg p-6 sm:p-8 md:p-10"
      >
        <header className="mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/mundografic.jpg"
              alt="Mundo Grafic"
              className="h-12 w-12 rounded-full object-cover shadow-md"
              loading="eager"
              decoding="async"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-center text-white">
            Iniciar sesión
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-white text-sm font-medium">
              Usuario o Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              placeholder="usuario o correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 px-3 rounded-md border border-white/30 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-white text-sm font-medium">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 w-full px-3 pr-10 rounded-md border border-white/30 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/80"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 h-12 rounded-md bg-white text-black font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
