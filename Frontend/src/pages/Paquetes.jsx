import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Paquetes.css";

export default function Paquetes() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todos"); // Todos | Disponibles | Agotados
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const cargar = async () => {
    setErr(""); setLoading(true);
    try {
      // sube el límite si quieres mostrar más
      const res = await fetch("http://localhost:8000/paquetes/activos?limit=60");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setErr("No se pudieron cargar los paquetes");
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const list = useMemo(() => {
    let base = items;

    // filtro por disponibilidad
    if (filter === "Disponibles") base = base.filter(p => (p.cupos_disponibles ?? 0) > 0);
    if (filter === "Agotados")   base = base.filter(p => (p.cupos_disponibles ?? 0) === 0);

    // búsqueda simple por nombre / ciudad / descripción
    const term = q.trim().toLowerCase();
    if (term) {
      base = base.filter(p =>
        (p.nombre_paquete || "").toLowerCase().includes(term) ||
        (p.ciudad || "").toLowerCase().includes(term) ||
        (p.descripcion || "").toLowerCase().includes(term)
      );
    }
    return base;
  }, [items, q, filter]);

  return (
    <div className="pkts-page">
      <header className="pkts-head">
        <h1>Paquetes Turísticos</h1>
        <div className="pkts-tools">
          <input
            className="input"
            placeholder="Buscar por destino, paquete, descripción…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <select className="select" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option>Todos</option>
            <option>Disponibles</option>
            <option>Agotados</option>
          </select>
        </div>
      </header>

      {loading ? (
        <p className="muted">Cargando paquetes…</p>
      ) : err ? (
        <p className="error">{err}</p>
      ) : list.length === 0 ? (
        <p className="muted">No encontramos resultados con los filtros actuales.</p>
      ) : (
        <div className="pkts-grid">
          {list.map(p => {
            const agotado = (p.cupos_disponibles ?? 0) === 0;
            return (
              <article key={p.paquete_id} className="pkt-card">
                <div className="imgwrap">
                  <img src={p.url_imagen} alt={p.ciudad} />
                  <span className="badge">{p.ciudad}</span>
                </div>
                <div className="body">
                  <h3 className="title">{p.nombre_paquete}</h3>
                  <p className="desc">{p.descripcion}</p>
                  <div className="meta">
                    <span>{p.duracion_dias} días</span>
                    <span>{p.cupos_disponibles} lugares</span>
                  </div>
                  <div className="foot">
                    <strong className="price">${Number(p.precio).toFixed(2)}</strong>
                    <button
                      className={`btn ${agotado ? "btn-disabled" : ""}`}
                      disabled={agotado}
                      onClick={() =>
                        navigate(`/reservar/${p.paquete_id}`, {
                          state: { paquete: p, imagenDestino: p.url_imagen, ciudadDestino: p.ciudad }
                        })
                      }
                      title={agotado ? "Paquete agotado" : "Reservar"}
                    >
                      {agotado ? "Agotado" : "Reservar"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}