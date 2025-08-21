import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MiPerfil.css";
import { toast } from "react-toastify";

export default function MiPerfil() {
  const navigate = useNavigate();
  const clienteId = Number(localStorage.getItem("cliente_id"));

  const [data, setData] = useState(null);   // datos originales del servidor
  const [form, setForm] = useState(null);   // datos en edición
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!clienteId) {
      navigate("/login", { state: { redirectTo: "/mi-perfil" }, replace: true });
    }
  }, [clienteId, navigate]);

  useEffect(() => {
    if (!clienteId) return;
    (async () => {
      try {
        const res = await fetch(`http://localhost:8000/mi-perfil?cliente_id=${clienteId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.detail || "No se pudo cargar el perfil");
        setData(json);
        setForm({ ...json }); // prellenado
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [clienteId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const hasChanges = useMemo(() => {
    if (!data || !form) return false;
    return Object.keys(data).some(k => (form[k] ?? "") !== (data[k] ?? ""));
  }, [data, form]);

  const startEdit = () => {
    setForm({ ...data });
    setEditMode(true);
    setError("");
  };

  const cancelEdit = () => {
    setForm({ ...data });
    setEditMode(false);
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/mi-perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), 
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || "No se pudo actualizar");

      const actualizado = json?.perfil || form;
      setData(actualizado);
      setForm(actualizado);
      setEditMode(false);
      toast.success("Perfil actualizado correctamente", { position: "top-center" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!clienteId) return null;
  if (loading) return <div className="perfil-wrap"><p>Cargando perfil…</p></div>;

  return (
    <div className="perfil-wrap">
      <h2>Mi perfil</h2>
      {error && <div className="perfil-error">{error}</div>}

      <form className="perfil-card" onSubmit={save}>
        <div className="actions" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
          {!editMode ? (
            <button type="button" className="btn-primary" onClick={startEdit}>
              Editar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || !hasChanges}
                title={!hasChanges ? "No hay cambios" : ""}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </>
          )}
        </div>

        <div className="grid">
          <div className="field">
            <label>Nombre</label>
            {editMode ? (
              <input name="nombre" value={form?.nombre || ""} onChange={onChange} required />
            ) : (
              <div className="read">{data?.nombre || "—"}</div>
            )}
          </div>

          <div className="field">
            <label>Apellido paterno</label>
            {editMode ? (
              <input name="apellido_paterno" value={form?.apellido_paterno || ""} onChange={onChange} required />
            ) : (
              <div className="read">{data?.apellido_paterno || "—"}</div>
            )}
          </div>

          <div className="field">
            <label>Apellido materno</label>
            {editMode ? (
              <input name="apellido_materno" value={form?.apellido_materno || ""} onChange={onChange} />
            ) : (
              <div className="read">{data?.apellido_materno || "—"}</div>
            )}
          </div>

          <div className="field">
            <label>Email</label>
            {editMode ? (
              <input name="email" type="email" value={form?.email || ""} onChange={onChange} required />
            ) : (
              <div className="read">{data?.email || "—"}</div>
            )}
          </div>

          <div className="field">
            <label>Teléfono</label>
            {editMode ? (
              <input name="telefono" value={form?.telefono || ""} onChange={onChange} />
            ) : (
              <div className="read">{data?.telefono || "—"}</div>
            )}
          </div>

          <div className="field full">
            <label>Dirección</label>
            {editMode ? (
              <input name="direccion" value={form?.direccion || ""} onChange={onChange} />
            ) : (
              <div className="read">{data?.direccion || "—"}</div>
            )}
          </div>

          <div className="field">
            <label>Tipo de documento</label>
            {editMode ? (
              <select name="tipo_documento" value={form?.tipo_documento || ""} onChange={onChange}>
                <option value="">Seleccione</option>
                <option value="INE">INE</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Licencia">Licencia</option>
                <option value="Otro">Otro</option>
              </select>
            ) : (
              <div className="read">{data?.tipo_documento || "—"}</div>
            )}
          </div>

          <div className="field">
            <label>Número de documento</label>
            {editMode ? (
              <input name="numero_documento" value={form?.numero_documento || ""} onChange={onChange} />
            ) : (
              <div className="read">{data?.numero_documento || "—"}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}