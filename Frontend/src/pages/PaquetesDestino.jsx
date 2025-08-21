import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PaquetesDestino.css";

export default function PaquetesDestino() {
  const { destinoId } = useParams();
  const navigate = useNavigate();
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagenDestino, setImagenDestino] = useState("");
  const [ciudadDestino, setCiudadDestino] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/paquetes/destino/${destinoId}`)
      .then((res) => res.json())
      .then((data) => {
        const activos = data.filter((p) => p.estado_paquete !== "Inactivo");
        setPaquetes(activos);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando paquetes:", err);
        setLoading(false);
      });

    fetch("http://localhost:8000/destinos")
      .then((res) => res.json())
      .then((data) => {
        const destino = data.find((d) => d.destino_id === parseInt(destinoId));
        if (destino) {
          setImagenDestino(destino.url_imagen);
          setCiudadDestino(destino.ciudad);
        }
      });
  }, [destinoId]);

  if (loading) return <p>Cargando paquetes...</p>;

  return (
    <div className="paquetes-container">
      <h1>Paquetes disponibles en {ciudadDestino}</h1>

      {paquetes.length === 0 ? (
        <p>No hay paquetes activos para este destino.</p>
      ) : (
        <div className="paquetes-grid">
          {paquetes.map((p) => (
            <div key={p.paquete_id} className="paquete-card">
              <img src={imagenDestino} alt="Destino" className="paquete-img" />
              <div className="paquete-info">
  <h3>{p.nombre_paquete}</h3>
  <p>{p.descripcion}</p>

  {p.cupos_disponibles === 0 ? (
    <div className="agotado-row">
      <span className="agotado-badge">Agotado</span>
    </div>
  ) : (
    <p className="precio">
      ${Number(p.precio).toFixed(2)} <span>por persona</span>
    </p>
  )}

  <p><strong>Duración:</strong> {p.duracion_dias} días</p>
  <p><strong>Disponibilidad:</strong> {p.cupos_disponibles} lugares</p>

  <button
    className={`btn-reservar ${p.cupos_disponibles === 0 ? "is-disabled" : ""}`}
    disabled={p.cupos_disponibles === 0}
    onClick={() =>
      p.cupos_disponibles === 0
        ? null
        : navigate(`/reservar/${p.paquete_id}`, {
            state: { paquete: p, imagenDestino, ciudadDestino },
          })
    }
  >
    {p.cupos_disponibles === 0 ? "Agotado" : "Reservar"}
  </button>
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}