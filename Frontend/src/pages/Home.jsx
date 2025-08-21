import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const imagenes = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1526772662000-3f88f10405ff",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  ];

  const [indice, setIndice] = useState(0);
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, 10000);
    return () => clearInterval(intervalo);
  }, []);

  // 🔹 Paquetes destacados
  useEffect(() => {
    setCargando(true);
    fetch("http://localhost:8000/paquetes/activos?limit=8")
      .then((r) => r.json())
      .then((data) => setPaquetes(data))
      .catch(() => setErr("No se pudieron cargar los paquetes"))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="home">
      {/* Hero / slider */}
      <div className="slider">
        <img src={imagenes[indice]} alt={`Imagen ${indice + 1}`} />
        <div className="slider-text">
          <p>Explora el mundo con nosotros y vive experiencias inolvidables.</p>
          {/* Si no tienes /explorar, apunta a /destinos */}
          <Link to="/destinos" className="btn-explorar">
            Explorar
          </Link>
        </div>
      </div>

      {/* Sección: Paquetes destacados */}
      <section className="sec-paquetes">
        <div className="sec-head">
          <h2>Paquetes destacados</h2>
          <button
            className="link-ver-todos"
            onClick={() => navigate("/destinos")}
          >
            Ver todos
          </button>
        </div>

        {cargando ? (
          <p>Cargando paquetes…</p>
        ) : err ? (
          <p className="error">{err}</p>
        ) : paquetes.length === 0 ? (
          <p>No hay paquetes disponibles por ahora.</p>
        ) : (
          <div className="paqs-grid">
            {paquetes.map((p) => (
              <article key={p.paquete_id} className="paq-card">
                <div className="paq-imgwrap">
                  <img src={p.url_imagen} alt={p.ciudad} />
                  <span className="ciudad-badge">{p.ciudad}</span>
                </div>
                <div className="paq-body">
                  <h3 className="paq-title">{p.nombre_paquete}</h3>
                  <p className="paq-desc">{p.descripcion}</p>
                  <div className="paq-meta">
                    <span>{p.duracion_dias} días</span>
                    <span>{p.cupos_disponibles} lugares</span>
                  </div>
                  <div className="paq-foot">
                    <strong className="precio">
                      ${Number(p.precio).toFixed(2)}
                    </strong>
                    <button
                      className="btn-reservar"
                      onClick={() =>
                        navigate(`/reservar/${p.paquete_id}`, {
                          state: {
                            paquete: p,
                            imagenDestino: p.url_imagen,
                            ciudadDestino: p.ciudad,
                          },
                        })
                      }
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}