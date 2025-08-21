import { useEffect, useState } from "react";
import "./Destinos.css";
import { useNavigate } from "react-router-dom";

export default function Destinos() {
  const [destinos, setDestinos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/destinos")
      .then((res) => res.json())
      .then((data) => setDestinos(data))
      .catch((err) => console.error("Error cargando destinos:", err));
  }, []);

  return (
    <div className="destinos-container">
      <h1>Destinos Disponibles</h1>
      <p>Explora nuestros destinos y vive experiencias inolvidables.</p>

      <div className="destinos-grid">
        {destinos.map((destino) => (
          <div key={destino.destino_id} className="destino-card">
            <img
              src={destino.url_imagen}
              alt={destino.ciudad}
              className="destino-imagen"
            />
            <h3>{destino.ciudad}</h3>
            <p>{destino.pais}</p>
            <small>{destino.descripcion}</small>
            <button onClick={() => navigate(`/destinos/${destino.destino_id}/paquetes`)}>
  Ver detalles
</button>
          </div>
        ))}
      </div>
    </div>
  );
}