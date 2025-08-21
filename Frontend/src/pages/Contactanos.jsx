import { useState } from "react";
import "./Contactanos.css";

export default function Contactanos() {
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    setSending(true);

    // Si luego conectas backend, haz fetch aquí.
    setTimeout(() => {
      setSending(false);
      setOk(true);
      e.target.reset();
    }, 900);
  };

  return (
    <div className="contacto-wrap">
      {/* Hero */}
      <section className="contacto-hero">
        <div className="hero-inner">
          <h1>Contáctanos</h1>
          <p>¿Dudas, cambios o asesoría? Estamos para ayudarte.</p>
        </div>
      </section>

      <section className="contacto-grid">
        {/* Columna izquierda: formulario */}
        <form className="card contacto-form" onSubmit={onSubmit} noValidate>
          <h2 className="card-title">Escríbenos</h2>

          {ok && (
            <div className="alert success">
              Mensaje enviado ✅ — te responderemos en horario laboral.
            </div>
          )}
          {err && <div className="alert error">{err}</div>}

          <div className="f-row">
            <label>Nombre</label>
            <input name="nombre" placeholder="Tu nombre" required />
          </div>

          <div className="f-row">
            <label>Correo electrónico</label>
            <input name="email" type="email" placeholder="tuemail@ejemplo.com" required />
          </div>

          <div className="f-row">
            <label>Asunto</label>
            <input name="asunto" placeholder="Motivo de tu mensaje" required />
          </div>

          <div className="f-row">
            <label>Mensaje</label>
            <textarea name="mensaje" rows={5} placeholder="Cuéntanos cómo podemos ayudarte" required />
          </div>

          <div className="actions">
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? "Enviando…" : "Enviar mensaje"}
            </button>
          </div>
        </form>

        {/* Columna derecha: info/CTA */}
        <aside className="card contacto-side">
          <h3 className="card-title">Atención al cliente</h3>

          <div className="info-list">
            <div className="info-item">
              <div className="ico">✉️</div>
              <div>
                <div className="info-label">Correo</div>
                <div className="info-value">atencion@flyaway.com</div>
              </div>
            </div>
            <div className="info-item">
              <div className="ico">📞</div>
              <div>
                <div className="info-label">Teléfono</div>
                <div className="info-value">+52 (55) 1234 5678</div>
              </div>
            </div>
            <div className="info-item">
              <div className="ico">🕘</div>
              <div>
                <div className="info-label">Horario</div>
                <div className="info-value">Lun–Vie · 9:00–18:00</div>
              </div>
            </div>
          </div>

          <div className="cta-box">
            <h4>¿Necesitas asesoría para tu viaje?</h4>
            <p>Nuestros agentes pueden armarte un paquete a la medida.</p>
            <a className="btn-secondary" href="mailto:atencion@flyaway.com">
              Solicitar asesoría
            </a>
          </div>

          <div className="mini-map">
            <div className="map-img" role="img" aria-label="Mapa ilustrativo" />
            <small>Atención remota en todo México.</small>
          </div>
        </aside>
      </section>
    </div>
  );
}