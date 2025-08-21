import { useEffect, useMemo, useState } from "react";
import "./AdminDestinos.css";

const CONTINENTES = ["América", "Europa", "Asia", "África", "Oceanía", "Antártida"];

export default function AdminDestinos() {
  const [destinos, setDestinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filtros / búsqueda
  const [q, setQ] = useState("");
  const [cont, setCont] = useState("Todos");

  // Form crear destino
  const [openForm, setOpenForm] = useState(false);
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("");
  const [continente, setContinente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [urlImagen, setUrlImagen] = useState("");
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem("admin_token");

  const cargar = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/destinos");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudieron cargar los destinos");
      // opcional: ordenar por ciudad
      data.sort((a, b) => a.ciudad.localeCompare(b.ciudad));
      setDestinos(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const listaFiltrada = useMemo(() => {
    const term = q.trim().toLowerCase();
    return destinos.filter(d => {
      const matchesQ =
        !term ||
        d.ciudad.toLowerCase().includes(term) ||
        d.pais.toLowerCase().includes(term);
      const matchesC = cont === "Todos" || d.continente === cont;
      return matchesQ && matchesC;
    });
  }, [destinos, q, cont]);

  const resetForm = () => {
    setCiudad(""); setPais(""); setContinente("");
    setDescripcion(""); setUrlImagen("");
  };

  const crearDestino = async (e) => {
    e.preventDefault();
    setErr("");

    if (!ciudad.trim() || !pais.trim() || !continente) {
      setErr("Ciudad, país y continente son obligatorios");
      return;
    }
    if (!CONTINENTES.includes(continente)) {
      setErr("Continente no válido");
      return;
    }

    setSending(true);
    try {
      const payload = {
        ciudad: ciudad.trim(),
        pais: pais.trim(),
        continente,
        descripcion: descripcion || null,
        url_imagen: urlImagen || null
      };
      const res = await fetch("http://localhost:8000/admin/destinos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo crear el destino");

      // éxito
      await cargar();
      resetForm();
      setOpenForm(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="adest-wrap">
      <div className="adest-header">
        <h2>Destinos</h2>
        <button className="btn-primary" onClick={() => setOpenForm(v => !v)}>
          {openForm ? "Cerrar" : "Nuevo destino"}
        </button>
      </div>

      {openForm && (
        <form className="adest-form" onSubmit={crearDestino}>
          <div className="grid">
            <div className="row">
              <label>Ciudad *</label>
              <input value={ciudad} onChange={e=>setCiudad(e.target.value)} required />
            </div>
            <div className="row">
              <label>País *</label>
              <input value={pais} onChange={e=>setPais(e.target.value)} required />
            </div>
            <div className="row">
              <label>Continente *</label>
              <select value={continente} onChange={e=>setContinente(e.target.value)} required>
                <option value="">Seleccione</option>
                {CONTINENTES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="row full">
              <label>Descripción</label>
              <textarea rows={3} value={descripcion} onChange={e=>setDescripcion(e.target.value)} />
            </div>
            <div className="row full">
              <label>URL de imagen</label>
              <input value={urlImagen} onChange={e=>setUrlImagen(e.target.value)} placeholder="https://…" />
            </div>
          </div>

          {err && <p className="form-error">{err}</p>}

          <div className="actions">
            <button type="button" className="btn-secondary" onClick={() => { resetForm(); setOpenForm(false); }} disabled={sending}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? "Guardando…" : "Guardar destino"}
            </button>
          </div>
        </form>
      )}

      <div className="adest-filters">
        <input
          className="search"
          placeholder="Buscar por ciudad o país…"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
        <select className="select" value={cont} onChange={e=>setCont(e.target.value)}>
          <option value="Todos">Todos los continentes</option>
          {CONTINENTES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="muted">Cargando destinos…</p>
      ) : err && !openForm ? (
        <p className="err">{err}</p>
      ) : (
        <div className="adest-grid">
          {listaFiltrada.map(d => (
            <div key={d.destino_id} className="card">
              {d.url_imagen ? (
                <img src={d.url_imagen} alt={d.ciudad} className="thumb" />
              ) : (
                <div className="thumb placeholder">Sin imagen</div>
              )}
              <div className="body">
                <div className="title">{d.ciudad}, {d.pais}</div>
                <div className="continent">{d.continente}</div>
                {d.descripcion && <p className="desc">{d.descripcion}</p>}
              </div>
            </div>
          ))}
          {listaFiltrada.length === 0 && (
            <div className="empty">No hay destinos que coincidan con tu búsqueda.</div>
          )}
        </div>
      )}
    </div>
  );
}