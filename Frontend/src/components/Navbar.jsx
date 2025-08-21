import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { usuario, logout } = useContext(AuthContext);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú si se hace clic afuera
  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">FlyAway</Link>

        <ul className="nav-links">
          <li><Link to="/contacto">Contáctanos</Link></li>
          <li><Link to="/destinos">Destinos</Link></li>
          <li><Link to="/paquetes">Paquetes Turísticos</Link></li>
        </ul>

        <div className="auth-buttons">
          {usuario ? (
            <div className="menu-cuenta" ref={menuRef}>
              <button
                className="btn-mi-cuenta"
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                Mi cuenta ▾
              </button>
              {menuAbierto && (
                <div className="submenu">
                  <Link to="/mi-perfil" onClick={() => setMenuAbierto(false)}>Mi perfil</Link>
                  <Link to="/mis-reservas" onClick={() => setMenuAbierto(false)}>Mis reservas</Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Iniciar Sesión</Link>
              <Link to="/register" className="btn-register">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}