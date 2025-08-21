import { useEffect, useMemo, useState } from "react";

const ESTADOS = ["Todos","Pendiente","Confirmada","Cancelada","Reembolsada"];

export default function AdminReservas(){
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // paginación
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));

  const [filtro, setFiltro] = useState("Todos");
  const token = localStorage.getItem("admin_token");

  const cargar = async (p = page) => {
    setErr(""); setLoading(true);
    try{
      const url = `http://localhost:8000/admin/reservas?page=${p}&per_page=${perPage}`;
      const res = await fetch(url, { headers: { "X-Admin-Token": token } });
      const data = await res.json();

      if(!res.ok) throw new Error(data.detail || "No se pudo cargar");

      // Soporta respuesta nueva {items,total,...} y legacy [array]
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
        setPage(p);
      } else {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      }
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ cargar(1); }, []); // carga página 1 al montar

  const acc = async (id, accion) => {
    setErr("");
    try{
      const res = await fetch(`http://localhost:8000/admin/reservas/${id}/${accion}`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "X-Admin-Token": token }
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail || "Error en la acción");
      await cargar(page); // recarga la misma página
      alert(`Reserva ${accion}da`);
    }catch(e){ setErr(e.message); }
  };

  const listado = useMemo(() =>
    filtro === "Todos" ? items : items.filter(r => r.estado_reserva === filtro),
  [items, filtro]);

  const Badge = ({estado}) => {
    const map = {
      Pendiente:  { bg:"#fff7ed", bd:"#fed7aa", tx:"#9a3412" },
      Confirmada: { bg:"#ecfdf5", bd:"#bbf7d0", tx:"#065f46" },
      Cancelada:  { bg:"#fef2f2", bd:"#fecaca", tx:"#991b1b" },
      Reembolsada:{ bg:"#eef2ff", bd:"#e0e7ff", tx:"#3730a3" }
    };
    const s = map[estado] || { bg:"#f3f4f6", bd:"#e5e7eb", tx:"#374151" };
    return (
      <span style={{
        fontSize:12, padding:"4px 8px", borderRadius:999,
        background:s.bg, border:`1px solid ${s.bd}`, color:s.tx
      }}>{estado}</span>
    );
  };

  const Pagination = () => (
    <div style={{display:"flex", gap:8, alignItems:"center", marginTop:12}}>
      <button
        onClick={()=>{ if(page>1) cargar(page-1)}}
        disabled={page<=1}
        style={{padding:"8px 12px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff"}}
      >« Anterior</button>

      <span style={{color:"#374151"}}>Página {page} de {totalPages}</span>

      <button
        onClick={()=>{ if(page<totalPages) cargar(page+1)}}
        disabled={page>=totalPages}
        style={{padding:"8px 12px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff"}}
      >Siguiente »</button>
    </div>
  );

  return (
    <div>
      <h2 style={{marginBottom:12}}>Reservas</h2>
      {err && <p style={{color:"#b91c1c"}}>{err}</p>}

      <div style={{display:"flex", gap:8, marginBottom:12}}>
        {ESTADOS.map(est => (
          <button
            key={est}
            onClick={()=>setFiltro(est)}
            style={{
              padding:"8px 10px", borderRadius:999, cursor:"pointer",
              border: filtro===est ? "1px solid #2563eb" : "1px solid #e5e7eb",
              background: filtro===est ? "#eef2ff" : "#fff", color:"#1f2937"
            }}
          >
            {est}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse", background:"#fff", border:"1px solid #e5e7eb", borderRadius:12}}>
              <thead>
                <tr style={{background:"#f9fafb"}}>
                  <th style={{textAlign:"left", padding:10}}>Código</th>
                  <th style={{textAlign:"left", padding:10}}>Cliente</th>
                  <th style={{textAlign:"left", padding:10}}>Paquete</th>
                  <th style={{textAlign:"left", padding:10}}>Salida</th>
                  <th style={{textAlign:"left", padding:10}}>Estado</th>
                  <th style={{textAlign:"right", padding:10}}>Personas</th>
                  <th style={{textAlign:"right", padding:10}}>Total</th>
                  <th style={{textAlign:"left", padding:10}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listado.map(r=>(
                  <tr key={r.reserva_id} style={{borderTop:"1px solid #eee", color:"#1f2937"}}>
                    <td style={{padding:10}}>{r.reserva_code}</td>
                    <td style={{padding:10}}>{r.cliente}</td>
                    <td style={{padding:10}}>{r.paquete}</td>
                    <td style={{padding:10}}>
                      {r.fecha_salida ? new Date(r.fecha_salida).toLocaleDateString() : "—"}
                    </td>
                    <td style={{padding:10}}><Badge estado={r.estado_reserva} /></td>
                    <td style={{padding:10, textAlign:"right"}}>{r.personas}</td>
                    <td style={{padding:10, textAlign:"right"}}>${Number(r.total||0).toFixed(2)}</td>
                    <td style={{padding:10}}>
                      <button
                        onClick={()=>acc(r.reserva_id, "confirmar")}
                        disabled={r.estado_reserva !== "Pendiente"}
                        style={{opacity: r.estado_reserva === "Pendiente" ? 1 : .5, cursor:"pointer"}}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={()=>acc(r.reserva_id, "cancelar")}
                        disabled={r.estado_reserva !== "Pendiente"}
                        style={{marginLeft:8, opacity: r.estado_reserva === "Pendiente" ? 1 : .5, cursor:"pointer"}}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
                {listado.length===0 && (
                  <tr><td colSpan={8} style={{padding:14}}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination />
        </>
      )}
    </div>
  );
}