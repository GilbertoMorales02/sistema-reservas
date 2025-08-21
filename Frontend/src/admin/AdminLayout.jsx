import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_id");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">FlyAway • Admin</div>
        <nav className="admin-nav">
          <NavLink to="/admin/reservas" className={({isActive}) => `link${isActive ? " active" : ""}`}>Reservas</NavLink>
          <NavLink to="/admin/destinos" className={({isActive}) => `link${isActive ? " active" : ""}`}>Destinos</NavLink>
          <NavLink to="/admin/paquetes" className={({isActive}) => `link${isActive ? " active" : ""}`}>Paquetes</NavLink>
          <NavLink to="/admin/reportes" className={({isActive}) => `link${isActive ? " active" : ""}`}>Reportes</NavLink>
        </nav>
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Panel de administración</h1>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}