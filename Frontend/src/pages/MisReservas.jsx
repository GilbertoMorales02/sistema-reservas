import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { toast } from "react-toastify";
import "./MisReservas.css";

export default function MisReservas() {
  const { usuario } = useContext(AuthContext);
  const clienteId = usuario?.cliente_id || JSON.parse(localStorage.getItem("usuario"))?.cliente_id;
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservas = async () => {
    try {
      const res = await fetch(`http://localhost:8000/mis-reservas?cliente_id=${clienteId}`);
      if (!res.ok) throw new Error("No se pudieron cargar las reservas");
      const data = await res.json();
      setReservas(data);
    } catch (error) {
      toast.error(`Error al obtener reservas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    try {
      const res = await fetch(`http://localhost:8000/reservas/${reservaId}/cancelar`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo cancelar");
      toast.success(data.mensaje);
      fetchReservas(); // Recargar lista
    } catch (error) {
      toast.error(`Error al cancelar: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  if (loading) return <p>Cargando tus reservas…</p>;

  return (
    <div className="mis-reservas-page">
      <h2>Mis Reservas</h2>
      {reservas.length === 0 ? (
        <p>No tienes reservas registradas.</p>
      ) : (
        <table className="tabla-reservas">
          <thead>
            <tr>
              <th>Código</th>
              <th>Paquete</th>
              <th>Fecha Reserva</th>
              <th>Fecha Salida</th>
              <th>Estado</th>
              <th>Personas</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.reserva_id}>
                <td>{r.reserva_code}</td>
                <td>{r.paquete_nombre}</td> {/* 🔹 ahora mostramos el nombre */}
                <td>{new Date(r.fecha_reserva).toLocaleDateString()}</td>
                <td>{new Date(r.fecha_salida).toLocaleDateString()}</td>
                <td>{r.estado_reserva}</td>
                <td>{r.cantidad_personas}</td>
                <td>${r.total_reserva.toFixed(2)}</td>
                <td>
                  {r.estado_reserva === "Activa" && (
                    <button
                      className="btn-cancelar"
                      onClick={() => cancelarReserva(r.reserva_id)}
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}