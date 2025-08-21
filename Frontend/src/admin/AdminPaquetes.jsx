import { useEffect, useMemo, useState } from "react";
import "./AdminPaquetes.css";

const ESTADOS = ["Todos", "Activo", "Inactivo"];

export default function AdminPaquetes() {
  const token = localStorage.getItem("admin_token");

  // Listado
  const [items, setItems] = useState([]);
  const [page, setPage]   = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Destinos para el form de creación
  const [destinos, setDestinos] = useState([]);

  // Form crear paquete
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    destino_id: "",
    nombre_paquete: "",
    descripcion: "",
    precio: "",
    duracion_dias: "",
    fecha_inicio: "",
    fecha_fin: "",
    capacidad: "",
    estado_paquete: "Activo",
  });
  const [sending, setSending] = useState(false);

  const estadoParam = useMemo(
    () => (estado === "Todos" ? "" : estado),
    [estado]
  );

  const cargarDestinos = async () => {
    try {
      const res = await fetch("http://localhost:8000/destinos");
      const data = await res.json();
      setDestinos(data || []);
    } catch {
      // silencioso
    }
  };

  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("per_page", perPage);
      if (q.trim()) params.set("q", q.trim());
      if (estadoParam) params.set("estado", estadoParam);

      const res = await fetch(
        `http://localhost:8000/admin/paquetes?${params.toString()}`,
        { headers: { "X-Admin-Token": token } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo cargar");
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDestinos();
  }, []);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, estadoParam]);

  const totalPages = useMemo(
    () => (perPage ? Math.max(1, Math.ceil(total / perPage)) : 1),
    [total, perPage]
  );

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    cargar();
  };

  const resetForm = () => {
    setForm({
      destino_id: "",
      nombre_paquete: "",
      descripcion: "",
      precio: "",
      duracion_dias: "",
      fecha_inicio: "",
      fecha_fin: "",
      capacidad: "",
      estado_paquete: "Activo",
    });
  };

  const crearPaquete = async (e) => {
    e.preventDefault();
    setErr("");
    setSending(true);
    try {
      // Validaciones rápidas front
      if (!form.destino_id) throw new Error("Selecciona un destino");
      if (!form.nombre_paquete.trim()) throw new Error("Nombre requerido");
      if (Number(form.capacidad) <= 0) throw new Error("Capacidad debe ser > 0");
      if (Number(form.precio) <= 0) throw new Error("Precio debe ser > 0");
      if (Number(form.duracion_dias) <= 0) throw new Error("Duración debe ser > 0");
      if (!form.fecha_inicio || !form.fecha_fin) throw new Error("Fechas requeridas");

      const payload = {
        destino_id: Number(form.destino_id),
        nombre_paquete: form.nombre_paquete.trim(),
        descripcion: form.descripcion || "",
        precio: Number(form.precio),
        duracion_dias: Number(form.duracion_dias),
        fecha_inicio: form.fecha_inicio, // YYYY-MM-DD
        fecha_fin: form.fecha_fin,
        capacidad: Number(form.capacidad),
        estado_paquete: form.estado_paquete,
      };

      const res = await fetch("http://localhost:8000/admin/paquetes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo crear el paquete");
      // Cierre modal y refresh
      resetForm();
      setOpenForm(false);
      setPage(1);
      await cargar();
      alert("Paquete creado");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="adm-paq">
      <header className="adm-paq__toolbar">
        <h2>Paquetes</h2>
        <div className="adm-paq__filters">
          <form onSubmit={onSearch} className="adm-paq__search">
            <input
              placeholder="Buscar por paquete/ciudad/país…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
            {ESTADOS.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>

          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
            {[10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n}/página</option>)}
          </select>

          <button className="btn-primary" onClick={() => { resetForm(); setOpenForm(true); }}>
            + Nuevo paquete
          </button>
        </div>
      </header>

      {err && <div className="adm-paq__error">{err}</div>}

      {loading ? (
        <p className="adm-paq__loading">Cargando…</p>
      ) : (
        <div className="adm-paq__tablewrap">
          <table className="adm-paq__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paquete</th>
                <th>Destino</th>
                <th>Fechas</th>
                <th>Capacidad</th>
                <th>Disponibles</th>
                <th>Estado</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 14 }}>Sin resultados</td>
                </tr>
              )}
              {items.map(p => (
                <tr key={p.paquete_id}>
                  <td>{p.paquete_id}</td>
                  <td>
                    <div className="cell-title">{p.nombre_paquete}</div>
                    <div className="cell-sub">{p.descripcion}</div>
                  </td>
                  <td>{p.ciudad}, {p.pais}</td>
                  <td>
                    {p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString() : "—"}{" "}
                    –{" "}
                    {p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : "—"}
                  </td>
                  <td>{p.capacidad}</td>
                  <td>{p.cupos_disponibles}</td>
                  <td>
                    <span className={`badge ${p.estado_paquete === "Activo" ? "ok" : "warn"}`}>
                      {p.estado_paquete}
                    </span>
                  </td>
                  <td>${Number(p.precio || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      <div className="adm-paq__pager">
        <span>Total: {total}</span>
        <div className="pager-controls">
          <button disabled={page <= 1} onClick={() => setPage(1)}>«</button>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
          <span>Página {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
        </div>
      </div>

      {/* Modal crear paquete */}
      {openForm && (
        <div className="modal-backdrop" onClick={() => !sending && setOpenForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo paquete</h3>
            <form className="grid" onSubmit={crearPaquete}>
              <div className="row">
                <label>Destino</label>
                <select
                  value={form.destino_id}
                  onChange={(e) => setForm({ ...form, destino_id: e.target.value })}
                  required
                >
                  <option value="">Seleccione…</option>
                  {destinos.map(d => (
                    <option key={d.destino_id} value={d.destino_id}>
                      {d.ciudad} — {d.pais}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <label>Nombre del paquete</label>
                <input
                  value={form.nombre_paquete}
                  onChange={(e) => setForm({ ...form, nombre_paquete: e.target.value })}
                  required
                />
              </div>

              <div className="row full">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>

              <div className="row">
                <label>Precio</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  required
                />
              </div>

              <div className="row">
                <label>Duración (días)</label>
                <input
                  type="number"
                  min="1"
                  value={form.duracion_dias}
                  onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
                  required
                />
              </div>

              <div className="row">
                <label>Fecha inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="row">
                <label>Fecha fin</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  required
                />
              </div>

              <div className="row">
                <label>Capacidad</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacidad}
                  onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                  required
                />
              </div>

              <div className="row">
                <label>Estado</label>
                <select
                  value={form.estado_paquete}
                  onChange={(e) => setForm({ ...form, estado_paquete: e.target.value })}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              {err && <div className="form-error">{err}</div>}

              <div className="actions">
                <button type="button" className="btn-secondary" disabled={sending}
                        onClick={() => setOpenForm(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" disabled={sending}>
                  {sending ? "Guardando…" : "Crear paquete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}