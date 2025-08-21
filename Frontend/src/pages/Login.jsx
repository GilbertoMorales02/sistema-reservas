import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contraseña }),
      });

      const data = await res.json();

      if (res.ok) {
        // ⬇️ Guarda el cliente_id devuelto por el backend
        if (!data?.cliente_id) {
          toast.error("No se recibió cliente_id del servidor.", { position: "top-center" });
          return;
        }

        localStorage.setItem("cliente_id", String(data.cliente_id));

        // ⬇️ Actualiza tu contexto (pásale también el id)
        login({ email, cliente_id: data.cliente_id });

        toast.success("Bienvenido a FlyAway", { position: "top-center" });

        // ⬇️ Redirección inteligente (si venías de /reservar/:id)
        const redirectTo = location.state?.redirectTo || "/";
        setTimeout(() => navigate(redirectTo, { replace: true }), 800);
      } else {
        toast.error(data.detail || "Correo o contraseña incorrectos", {
          position: "top-center",
          icon: "❌",
          style: { backgroundColor: "#ffe6e6", color: "#b30000", fontWeight: "bold" },
        });
      }
    } catch {
      toast.error("Error de conexión con el servidor", { position: "top-center" });
    }
  };

  return (
    <div className="login-page-modern">
      <div className="login-card">
        <div className="login-left">
          <h2>Bienvenido de nuevo</h2>
          <p>Inicia sesión para seguir explorando el mundo con nosotros.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-login-modern">Ingresar</button>
          </form>
        </div>

        <div className="login-right">
          <img
            src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
            alt="Ciudad turística"
          />
        </div>
      </div>
    </div>
  );
}