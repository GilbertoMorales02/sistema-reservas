 import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="ft-container">
        <div className="ft-grid">
          {/* Brand / about */}
          <div className="ft-col">
            <div className="ft-brand">
              <span className="logo-dot" aria-hidden="true">✈︎</span>
              <span className="brand-name">FlyAway</span>
            </div>
            <p className="ft-text">
              Experiencias de viaje diseñadas a tu medida. Descubre destinos, reserva con confianza y viaja sin complicaciones.
            </p>
          </div>

          {/* Links */}
          <nav className="ft-col" aria-label="Enlaces rápidos">
            <h4 className="ft-title">Enlaces</h4>
            <ul className="ft-list">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/destinos">Destinos</Link></li>
              <li><Link to="/mis-reservas">Mis reservas</Link></li>
              <li><Link to="/mi-perfil">Mi perfil</Link></li>
            </ul>
          </nav>

          {/* Soporte */}
          <nav className="ft-col" aria-label="Soporte">
            <h4 className="ft-title">Soporte</h4>
            <ul className="ft-list">
              <li><Link to="/#faq">Preguntas frecuentes</Link></li>
              <li><Link to="/#politicas">Políticas de cambio</Link></li>
              <li><Link to="/#seguridad">Seguridad y pagos</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </nav>

          {/* Contacto / redes */}
          <div className="ft-col">
            <h4 className="ft-title">Contacto</h4>
            <ul className="ft-contact">
              <li><span>atencion@flyaway.com</span></li>
              <li><span>+52 (55) 1234 5678</span></li>
              <li><span>Lun–Vie 9:00–18:00</span></li>
            </ul>
            <div className="ft-social" aria-label="Redes sociales">
              <a href="#" aria-label="Facebook" className="ico" title="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.3 3h-1.9v7A10 10 0 0 0 22 12"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="ico" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2.5A3.5 3.5 0 1 0 12 17a3.5 3.5 0 0 0 0-7Zm5.25-.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>
              </a>
              <a href="#" aria-label="X/Twitter" className="ico" title="X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4.7l3.4 5 3.7-5H20l-5.8 7.8L20 20h-4.7l-3.7-5.4L7.7 20H4l6.1-8L4 4z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="ft-bottom">
          <p>© {new Date().getFullYear()} FlyAway. Todos los derechos reservados.</p>
          <div className="ft-legal">
            <Link to="/#terminos">Términos</Link>
            <span>•</span>
            <Link to="/#privacidad">Privacidad</Link>
            <span>•</span>
            <Link to="/#cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}