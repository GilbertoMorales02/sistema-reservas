import { useEffect, useState } from "react";

const api = (path) =>
  fetch(`http://localhost:8000${path}`, {
    headers: { "X-Admin-Token": localStorage.getItem("admin_token") || "" }
  }).then(async (r) => {
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || "Error");
    return j;
  });

export default function AdminReportes() {
  const [tab, setTab] = useState("resumen");
  const [year, setYear] = useState(new Date().getFullYear());
  const [months, setMonths] = useState(12);
  const [limit, setLimit] = useState(5);

  const [data, setData] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(""); setLoading(true);
    try {
      let d = [];
      if (tab === "resumen") {
        d = [await api(`/admin/reportes/resumen-activos-futuras`)];
      } else if (tab === "pivot") {
        d = await api(`/admin/reportes/reservas-mes?year=${year}`);
      } else if (tab === "frecuencia") {
        d = await api(`/admin/reportes/clientes-frecuencia?months=${months}`);
      } else if (tab === "detalle") {
        d = await api(`/admin/reportes/detalle-reservas`);
      } else if (tab === "top") {
        d = await api(`/admin/reportes/top-destinos?limit=${limit}`);
      }
      setData(d);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const toCSV = (rows) => {
    if (!rows?.length) return "";
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")].concat(
      rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g,'""')}"`).join(","))
    );
    return lines.join("\n");
  };
  const downloadCSV = () => {
    const csv = toCSV(Array.isArray(data) ? data : [data]);
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${tab}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = (rows) => {
    if (!rows?.length) return <p>Sin datos.</p>;
    const cols = Object.keys(rows[0]);
    return (
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse", background:"#fff", border:"1px solid #e5e7eb", borderRadius:12}}>
          <thead>
            <tr style={{background:"#f9fafb"}}>
              {cols.map(c=> <th key={c} style={{textTransform:"capitalize", padding:10, textAlign:"left"}}>{c.replace(/_/g," ")}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} style={{borderTop:"1px solid #eee", color:"#1f2937"}}>
                {cols.map(c => <td key={c} style={{padding:10}}>{String(r[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{marginBottom:12}}>Reportes</h2>

      <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
        {[
          ["resumen","Resumen"],
          ["pivot","Reservas por mes (pivot)"],
          ["frecuencia","Clientes por frecuencia"],
          ["detalle","Detalle reservas"],
          ["top","Top destinos"]
        ].map(([id,label])=>(
          <button key={id}
            onClick={()=>setTab(id)}
            style={{
              padding:"8px 10px", borderRadius:999, cursor:"pointer",
              border: tab===id ? "1px solid #2563eb" : "1px solid #e5e7eb",
              background: tab===id ? "#eef2ff" : "#fff", color:"#1f2937"
            }}
          >{label}</button>
        ))}
      </div>

      {/* Filtros por pestaña */}
      {tab==="pivot" && (
        <div style={{display:"flex", gap:8, marginBottom:10}}>
          <input type="number" value={year} onChange={e=>setYear(e.target.value)} />
          <button onClick={load}>Consultar</button>
        </div>
      )}
      {tab==="frecuencia" && (
        <div style={{display:"flex", gap:8, marginBottom:10}}>
          <input type="number" min={1} max={60} value={months} onChange={e=>setMonths(e.target.value)} />
          <button onClick={load}>Consultar</button>
        </div>
      )}
      {tab==="top" && (
        <div style={{display:"flex", gap:8, marginBottom:10}}>
          <input type="number" min={1} max={20} value={limit} onChange={e=>setLimit(e.target.value)} />
          <button onClick={load}>Consultar</button>
        </div>
      )}

      {err && <div style={{color:"#b91c1c", background:"#fee2e2", border:"1px solid #fecaca", padding:10, borderRadius:10, marginBottom:10}}>{err}</div>}
      {loading ? <p>Cargando…</p> : renderTable(Array.isArray(data) ? data : [data])}

      <div style={{marginTop:10}}>
        <button onClick={downloadCSV}>Descargar CSV</button>
      </div>
    </div>
  );
}