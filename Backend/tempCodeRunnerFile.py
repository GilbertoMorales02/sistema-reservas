
@app.get("/admin/reportes/top-destinos")
def rep_top_destinos(limit: int = Query(5, ge=1, le=20), admin_id: int = Depends(require_admin)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM rpt_top_destinos(%s)", (limit,))
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close(); conn.close()