import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Confirmacion.css";

export default function Confirmacion() {
  const { state } = useLocation() || {};
  const navigate = useNavigate();

  // Guardar en sessionStorage para evitar pérdida al recargar
  useEffect(() => {
    if (state) {
      sessionStorage.setItem("confirmacion_state", JSON.stringify(state));
    }
  }, [state]);

  const raw = sessionStorage.getItem("confirmacion_state");
  const safeState = state || (raw ? JSON.parse(raw) : null);

  // Fallback si no hay datos
  if (!safeState) {
    return (
      <div className="conf-page">
        <div className="conf-card">
          <div className="conf-header error">
            <h2>No encontramos datos de la reserva</h2>
            <p>Vuelve a la lista de destinos para reservar de nuevo.</p>
          </div>
          <div className="conf-actions">
            <button className="btn-secondary" onClick={() => navigate("/destinos")}>
              Ver destinos
            </button>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    ciudadDestino,
    imagenDestino,
    paqueteNombre,
    personas,
    total,
    fechaSalida,
    codigoReserva,
  } = safeState;

  const fmtFecha = (s) => new Date(s).toLocaleDateString();
  const fmtMoney = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigoReserva);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="conf-page">
      <div className="conf-card">
        <div className="conf-hero">
          {imagenDestino && <img src={imagenDestino} alt={ciudadDestino} />}
          <div className="conf-overlay">
            <span className="conf-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.15" />
                <path
                  d="M9.2 12.6l-1.6-1.6-1.4 1.4 3 3c.2.2.5.3.7.3s.5-.1.7-.3l7-7-1.4-1.4-6.3 6.3-.4.3z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <h2>¡Reserva confirmada!</h2>
            <p>Tu viaje está listo. Te enviamos el detalle a tu correo.</p>

            {codigoReserva && (
              <div className="code-badge" onClick={copiarCodigo} title="Copiar código">
                <span>Código:</span>
                <strong>{codigoReserva}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="conf-body">
          <div className="conf-summary">
            {codigoReserva && (
              <div className="row">
                <span className="label">Código de reserva</span>
                <span className="value">{codigoReserva}</span>
              </div>
            )}
            <div className="row">
              <span className="label">Destino</span>
              <span className="value">{ciudadDestino}</span>
            </div>
            <div className="row">
              <span className="label">Paquete</span>
              <span className="value">{paqueteNombre}</span>
            </div>
            <div className="row">
              <span className="label">Personas</span>
              <span className="value">{personas}</span>
            </div>
            <div className="row">
              <span className="label">Fecha de salida</span>
              <span className="value">{fmtFecha(fechaSalida)}</span>
            </div>
            <div className="row total">
              <span className="label">Total pagado</span>
              <span className="value">{fmtMoney(total)}</span>
            </div>
          </div>

          <div className="conf-actions">
            <button className="btn-secondary" onClick={() => navigate("/mis-reservas")}>
              Ver mis reservas
            </button>
            <button className="btn-secondary" onClick={() => navigate("/destinos")}>
              Ver más destinos
            </button>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}