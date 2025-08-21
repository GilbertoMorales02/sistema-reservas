import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import "./CrearReserva.css";

export default function CrearReserva() {
  const { paqueteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Contexto (cliente_id e isLoggedIn); fallback a localStorage
  const auth = useContext(AuthContext);
  const clienteIdCtx = auth?.clienteId ?? auth?.usuario?.cliente_id ?? null;
  const clienteIdLS = Number(localStorage.getItem("cliente_id")) || null;
  const clienteId = clienteIdCtx || clienteIdLS;

  // Traído desde PaquetesDestino (si navegaste desde ahí)
  const paqueteFromState = location.state?.paquete || null;
  const [paquete, setPaquete] = useState(paqueteFromState);
  const [imagenDestino, setImagenDestino] = useState(location.state?.imagenDestino || "");
  const [ciudadDestino, setCiudadDestino] = useState(location.state?.ciudadDestino || "");

  const [loading, setLoading] = useState(!paqueteFromState);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Form
  const [personas, setPersonas] = useState(1);
  const [metodoPago, setMetodoPago] = useState("Tarjeta");
  const [medioCompra, setMedioCompra] = useState("En línea");
  const [fechaSalida, setFechaSalida] = useState("");
  const [tipoServicio, setTipoServicio] = useState("Tour");
  const [proveedor, setProveedor] = useState("");
  const [notas, setNotas] = useState("");

  // Si entras por URL directa, cargar paquete + imagen/ciudad
  useEffect(() => {
    if (!paqueteFromState) {
      setLoading(true);
      fetch(`http://localhost:8000/paquetes/${paqueteId}`)
        .then((res) => res.json())
        .then(async (data) => {
          setPaquete(data);
          if (data?.destino_id) {
            const r = await fetch("http://localhost:8000/destinos");
            const destinos = await r.json();
            const dest = destinos.find((d) => d.destino_id === data.destino_id);
            if (dest) {
              setImagenDestino(dest.url_imagen || "");
              setCiudadDestino(dest.ciudad || "");
            }
          }
        })
        .catch(() => setError("No se pudo cargar la información del paquete."))
        .finally(() => setLoading(false));
    }
  }, [paqueteFromState, paqueteId]);

  // Guard suave: si no hay cliente_id, redirige a login con retorno
  useEffect(() => {
    if (!clienteId) {
      navigate("/login", { state: { redirectTo: `/reservar/${paqueteId}` }, replace: true });
    }
  }, [clienteId, navigate, paqueteId]);

  const maxPersonas = paquete?.cupos_disponibles ?? 1;
  const precio = Number(paquete?.precio || 0);

  // Limitar fecha de salida entre fecha_inicio y fecha_fin (y no antes de hoy)
  const hoyISO = new Date().toISOString().slice(0, 10);
  const fechaInicioISO = paquete?.fecha_inicio?.slice(0, 10) || hoyISO;
const fechaFinISO    = paquete?.fecha_fin?.slice(0, 10)    || "";

  const minDate = useMemo(() => {
    return [hoyISO, fechaInicioISO].sort()[1]; // la más “grande”
  }, [hoyISO, fechaInicioISO]);

  const total = useMemo(() => {
    const n = Number(personas) || 0;
    return (precio * n).toFixed(2);
  }, [precio, personas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!paquete) {
      setError("No hay información del paquete.");
      return;
    }

    if (!clienteId) {
      // navega y no renderices nada
      navigate("/login", { state: { redirectTo: `/reservar/${paqueteId}` }, replace: true });
      return null;
    }

    const n = Number(personas);
    if (!Number.isInteger(n) || n < 1) {
      setError("Indica una cantidad de personas válida (mínimo 1).");
      return;
    }
    if (n > maxPersonas) {
      setError(`Solo hay ${maxPersonas} lugares disponibles.`);
      return;
    }

    if (!fechaSalida) {
      setError("Selecciona una fecha de salida.");
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        paquete_id: paquete.paquete_id,
        cliente_id: Number(clienteId),
        cantidad_personas: n,
        metodo_pago: metodoPago,
        medio_compra: medioCompra,
        fecha_reserva: null, // SP usa CURRENT_DATE
        fecha_salida: fechaSalida,
        tipo_servicio: tipoServicio,
        proveedor: proveedor || null,
      };

      const res = await fetch("http://localhost:8000/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
if (!res.ok) throw new Error(data?.detail || "No se pudo crear la reserva");
navigate("/confirmacion", {
  state: {
    ciudadDestino,
    imagenDestino,
    paqueteNombre: paquete.nombre_paquete,
    personas: n,
    total,
    fechaSalida,
    codigoReserva: data.codigo_reserva, // 👈 nuevo
  },
  replace: true,
});
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <p className="cargando">Cargando formulario…</p>;
  if (!paquete) return <p className="error">No se encontró el paquete.</p>;

  return (
    <div className="reserva-layout">
      {/* Columna izquierda: resumen */}
      <aside className="card resumen">
        <img src={imagenDestino} alt={ciudadDestino} className="resumen-img" />
        <div className="resumen-body">
          <h2 className="titulo">{paquete.nombre_paquete}</h2>
          <p className="ciudad">{ciudadDestino}</p>
          <div className="pill-group">
            <span className="pill">Duración: {paquete.duracion_dias} días</span>
            <span className="pill">Disponibles: {maxPersonas}</span>
            <span className="pill">
              {new Date(paquete.fecha_inicio).toLocaleDateString()} –{" "}
              {new Date(paquete.fecha_fin).toLocaleDateString()}
            </span>
          </div>
          <div className="precio-box">
            <div>Precio por persona</div>
            <div className="precio">${precio.toFixed(2)}</div>
          </div>
          <div className="total-box">
            <span>Total</span>
            <strong>${total}</strong>
          </div>
        </div>
      </aside>

      {/* Columna derecha: formulario */}
      <main className="card form-card">
        <h3>Completa tu reserva</h3>

        <form onSubmit={handleSubmit} className="grid-form">
          <div className="form-row">
            <label>Personas</label>
            <input
              type="number"
              min={1}
              max={maxPersonas}             
              value={personas}
              onChange={(e) => setPersonas(parseInt(e.target.value || "0", 10))}
              required
            />
            <small>Máximo {maxPersonas}</small>
          </div>

          <div className="form-row">
            <label>Método de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="PayPal">PayPal</option>
            </select>
          </div>

          <div className="form-row">
            <label>Medio de compra</label>
            <select value={medioCompra} onChange={(e) => setMedioCompra(e.target.value)}>
              <option value="En línea">En línea</option>
              <option value="Teléfono">Teléfono</option>
            </select>
          </div>

          <div className="form-row">
            <label>Fecha de salida</label>
            <input
              type="date"
              value={fechaSalida}
              min={minDate}                   
              max={fechaFinISO || undefined}   
              onChange={(e) => setFechaSalida(e.target.value)}
              required
            />
            <small>
              {fechaFinISO
                ? `Entre ${new Date(paquete.fecha_inicio).toLocaleDateString()} y ${new Date(paquete.fecha_fin).toLocaleDateString()}`
                : `A partir de ${new Date(minDate).toLocaleDateString()}`}
            </small>
          </div>

          <div className="form-row">
            <label>Tipo de servicio</label>
            <select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)}>
              <option value="Transporte">Transporte</option>
              <option value="Hospedaje">Hospedaje</option>
              <option value="Tour">Tour</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="form-row">
            <label>Proveedor (opcional)</label>
            <input
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Operadora / Agencia proveedora"
            />
          </div>

          <div className="form-row full">
            <label>Notas (opcional)</label>
            <textarea
              rows={4}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Especificaciones o preferencias… (no se envían al SP por ahora)"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? "Procesando…" : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}