import { useState } from "react";
import { useNavigate } from "react-router-dom";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "admin" && password === "admin") {
      navigate("/welcome");
    } else {
      alert("Credenciales incorrectas. Intenta nuevamente.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/mundografic.jpg')" }} // Cambia la ruta si es necesario
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white/20 backdrop-blur-md p-10 rounded-2xl shadow-lg w-full max-w-sm flex flex-col gap-6"
      >
        <h2 className="text-2xl font-bold text-center text-white">Iniciar Sesión</h2>

        <input
          type="text"
          placeholder="Usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-3 rounded-md border border-white/30 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-3 rounded-md border border-white/30 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
        />

        <button
          type="submit"
          className="bg-white text-black font-semibold py-2 rounded-md hover:bg-gray-200 transition"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}

export default Login;
