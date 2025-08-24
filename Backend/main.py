from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from conexion import obtener_conexion
from typing import List
from fastapi import Path
from fastapi.responses import JSONResponse
from fastapi import Body
from fastapi import Query
from typing import Optional
from fastapi import Depends
from fastapi import Header
import uuid
import math
from datetime import date

app = FastAPI()

# main.py
from fastapi.middleware.cors import CORSMiddleware
import os
from helpers import to_jsonable



ALLOWED = os.getenv("ALLOWED_ORIGINS", "https://flway.fyi,https://www.flway.fyi")
origins = [o.strip() for o in ALLOWED.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,   # si vas a usar cookies/autenticación
    allow_methods=["*"],
    allow_headers=["*"],
)

# (recomendado) endpoints básicos
@app.get("/")
def root():
    return {"ok": True, "msg": "Backend Sistema de Reservas activo"}

@app.get("/health")
def health():
    return {"ok": True}
class Cliente(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: str | None = None
    email: str
    telefono: str | None = None
    direccion: str | None = None
    tipo_documento: str
    numero_documento: str
    contraseña: str

@app.post("/clientes")
def registrar_cliente(cliente: Cliente):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        # Validar correo
        cursor.execute("SELECT validar_correo(%s)", (cliente.email,))
        if cursor.fetchone()[0]:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

        # Intentar registrar
        cursor.execute("""
            SELECT registrar_cliente(%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            cliente.nombre,
            cliente.apellido_paterno,
            cliente.apellido_materno,
            cliente.email,
            cliente.telefono,
            cliente.direccion,
            cliente.tipo_documento,
            cliente.numero_documento,
            cliente.contraseña
        ))

        nuevo_id = cursor.fetchone()[0]
        conexion.commit()
        cursor.close()
        conexion.close()

        return {"cliente_id": nuevo_id, "mensaje": "Cliente registrado correctamente"}

    except Exception as e:
        error_str = str(e)

        # Detectar error por número de documento duplicado
        if "Ya existe un cliente con ese número de documento" in error_str:
            raise HTTPException(status_code=400, detail="El número de documento ya está registrado")

        # Si es otro error, mandar mensaje genérico
        raise HTTPException(status_code=400, detail="Ocurrió un error al registrar el cliente")
    

class LoginData(BaseModel):
    email: str
    contraseña: str

@app.post("/login")
def login_cliente(login_data: LoginData):
    conn = obtener_conexion(); cur = conn.cursor()
    cur.execute("SELECT login_cliente(%s,%s)", (login_data.email, login_data.contraseña))
    ok = cur.fetchone()[0]
    if not ok:
        cur.close(); conn.close()
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    cur.execute("SELECT cliente_id FROM clientes WHERE email=%s", (login_data.email,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return {"mensaje":"Login exitoso","cliente_id":row[0]}

from typing import Optional, List
class Destino(BaseModel):
    destino_id: int
    ciudad: str
    pais: str
    descripcion: Optional[str] = None
    url_imagen: Optional[str] = None

@app.get("/destinos", response_model=List[Destino])
def obtener_destinos():
    conn = None
    cur = None
    try:
        conn = obtener_conexion()
        cur = conn.cursor()
        # en Postgres los identificadores sin comillas se normalizan a minúsculas
        cur.execute("""
            SELECT destino_id, ciudad, pais, descripcion, url_imagen
            FROM destinos
            ORDER BY destino_id DESC
        """)
        rows = cur.fetchall()

        # Construye objetos del modelo (Pydantic aceptará None en opcionales)
        destinos = [
            Destino(
                destino_id=r[0],
                ciudad=r[1],
                pais=r[2],
                descripcion=r[3],
                url_imagen=r[4],
            )
            for r in rows
        ]
        return destinos
    except Exception as e:
        # deja rastro en logs de Railway para depurar si algo más falla
        print("ERROR /destinos:", repr(e))
        raise HTTPException(status_code=500, detail="Error al obtener destinos")
    finally:
        if cur: cur.close()
        if conn: conn.close()


@app.get("/paquetes/destino/{destino_id}")
def obtener_paquetes_por_destino(destino_id: int = Path(..., gt=0)):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("SELECT * FROM obtener_paquetes_por_destino(%s)", (destino_id,))
        resultados = cursor.fetchall()

        paquetes = [
            {
                "paquete_id": r[0],
                "nombre_paquete": r[1],
                "descripcion": r[2],
                "precio": float(r[3]),
                "duracion_dias": r[4],
                "fecha_inicio": r[5],
                "fecha_fin": r[6],
                "cupos_disponibles": r[7],
                "estado_paquete": r[8]
            }
            for r in resultados
        ]

        cursor.close()
        conexion.close()
        return paquetes

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Error al obtener paquetes: {str(e)}"})
    

class ReservaRequest(BaseModel):
    paquete_id: int
    cliente_id: int
    cantidad_personas: int
    metodo_pago: str
    medio_compra: str
    fecha_reserva: str | None = None   # YYYY-MM-DD o None
    fecha_salida: str | None = None
    tipo_servicio: str
    proveedor: str | None = None

@app.post("/reservas")
def crear_reserva(reserva: ReservaRequest = Body(...)):
    conn = None
    try:
        conn = obtener_conexion()
        cur = conn.cursor()

        cur.execute("""
            SELECT * FROM fx_crear_reserva_retornar_codigo(
                %s,%s,%s,%s,%s,%s,%s,%s,%s
            )
        """, (
            reserva.paquete_id,
            reserva.cliente_id,
            reserva.cantidad_personas,
            reserva.metodo_pago,
            reserva.medio_compra,
            reserva.fecha_reserva,  # puede ir None
            reserva.fecha_salida,
            reserva.tipo_servicio,
            reserva.proveedor
        ))

        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        res_id, codigo, error = row
        if error:
            raise HTTPException(status_code=400, detail=error)

        return {
            "mensaje": "Reserva creada correctamente",
            "reserva_id": res_id,
            "codigo_reserva": codigo
        }

    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback(); conn.close()
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")
class DestinoCreate(BaseModel):
    ciudad: str
    pais: str
    continente: str
    descripcion: str | None = None
    url_imagen: str | None = None

@app.post("/destinos")
def insertar_destino(destino: DestinoCreate):
    conn = None
    try:
        conn = obtener_conexion()
        cur = conn.cursor()

        cur.execute(
            "CALL sp_insertar_destino(%s,%s,%s,%s,%s)",
            (
                destino.ciudad,
                destino.pais,
                destino.continente,
                destino.descripcion,
                destino.url_imagen,
            )
        )

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Destino insertado correctamente"}

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=f"{e}")
    
from fastapi import Query, Path, HTTPException

@app.get("/mis-reservas")
def mis_reservas(cliente_id: int = Query(..., gt=0)):
    try:
        conn = obtener_conexion(); cur = conn.cursor()
        cur.execute("SELECT * FROM obtener_reservas_por_cliente(%s)", (cliente_id,))
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        cur.close(); conn.close()

        reservas = []
        for row in rows:
            item = dict(zip(cols, row))
            if item.get("total_reserva") is not None:
                item["total_reserva"] = float(item["total_reserva"])
            reservas.append(item)
        return reservas
    except Exception as e:
        # te da el detalle en el front
        raise HTTPException(status_code=500, detail=f"{e}")

@app.post("/reservas/{reserva_id}/cancelar")
def cancelar_reserva(
    reserva_id: int = Path(..., gt=0),
    cliente_id: int = Query(..., gt=0)  # opcional, si lo mandas desde el front
):
    conn = None
    try:
        conn = obtener_conexion(); cur = conn.cursor()

        # (opcional) asegura que la reserva pertenece al cliente
        cur.execute("SELECT 1 FROM reservas WHERE reserva_id=%s AND cliente_id=%s", (reserva_id, cliente_id))
        if cur.fetchone() is None:
            cur.close(); conn.close()
            raise HTTPException(status_code=403, detail="No puedes cancelar esta reserva")

        cur.execute("SELECT * FROM fx_cancelar_reserva(%s)", (reserva_id,))
        ok, error = cur.fetchone()
        if not ok:
            conn.rollback(); cur.close(); conn.close()
            raise HTTPException(status_code=400, detail=error)

        conn.commit(); cur.close(); conn.close()
        return {"mensaje": "Reserva cancelada y reembolsada", "reserva_id": reserva_id}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback(); conn.close()
        raise HTTPException(status_code=500, detail=f"Error al cancelar: {e}")
    

class PerfilUpdate(BaseModel):
    cliente_id: int
    nombre: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

@app.get("/mi-perfil")
def mi_perfil(cliente_id: int = Query(..., gt=0)):
    try:
        conn = obtener_conexion(); cur = conn.cursor()
        cur.execute("""
            SELECT cliente_id, nombre, apellido_paterno, apellido_materno, email,
                   telefono, direccion, tipo_documento, numero_documento
            FROM clientes
            WHERE cliente_id = %s
        """, (cliente_id,))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        cols = ["cliente_id","nombre","apellido_paterno","apellido_materno","email",
                "telefono","direccion","tipo_documento","numero_documento"]
        return dict(zip(cols, row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@app.put("/mi-perfil")
def actualizar_perfil(payload: PerfilUpdate = Body(...)):
    conn = None
    try:
        conn = obtener_conexion()
        conn.autocommit = False  # transacción manual
        cur = conn.cursor()

        # Validaciones de unicidad (solo si se envían)
        if payload.email:
            cur.execute("""
                SELECT 1 FROM clientes
                WHERE lower(email)=lower(%s) AND cliente_id <> %s
            """, (payload.email, payload.cliente_id))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="El correo ya está en uso")

        if payload.numero_documento:
            cur.execute("""
                SELECT 1 FROM clientes
                WHERE numero_documento = %s AND cliente_id <> %s
            """, (payload.numero_documento, payload.cliente_id))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="El número de documento ya está en uso")

        # Construir UPDATE solo con campos enviados
        campos, valores = [], []
        for col in ["nombre","apellido_paterno","apellido_materno","email",
                    "telefono","direccion","tipo_documento","numero_documento"]:
            val = getattr(payload, col)
            if val is not None:
                campos.append(f"{col} = %s")
                valores.append(val)

        if not campos:
            conn.commit(); cur.close(); conn.close()
            return {"mensaje": "Sin cambios"}

        valores.append(payload.cliente_id)

        cur.execute(f"""
            UPDATE clientes
            SET {", ".join(campos)}
            WHERE cliente_id = %s
            RETURNING cliente_id, nombre, apellido_paterno, apellido_materno, email,
                      telefono, direccion, tipo_documento, numero_documento
        """, valores)

        updated = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        cols = ["cliente_id","nombre","apellido_paterno","apellido_materno","email",
                "telefono","direccion","tipo_documento","numero_documento"]
        return {"mensaje": "Perfil actualizado", "perfil": dict(zip(cols, updated))}

    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback(); conn.close()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {e}")


# --- SESIONES ADMIN EN MEMORIA ---
ADMIN_SESSIONS: dict[str, int] = {}  # token -> admin_id


# --- MODELO DE LOGIN ---
class AdminLogin(BaseModel):
    email: str
    password: str


# --- LOGIN ADMIN (por email/password) ---
@app.post("/admin/login")
def admin_login(payload: AdminLogin = Body(...)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT admin_id, password, activo
            FROM administradores
            WHERE lower(email) = lower(%s)
        """, (payload.email,))
        row = cur.fetchone()
    finally:
        cur.close(); conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    admin_id, stored_password, activo = row
    if not activo:
        raise HTTPException(status_code=403, detail="Admin inactivo")

    # En producción: usa bcrypt. Aquí comparamos texto plano.
    if payload.password != stored_password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = str(uuid.uuid4())
    ADMIN_SESSIONS[token] = admin_id
    return {"token": token, "admin_id": admin_id}


# --- GUARD PARA RUTAS ADMIN ---
def require_admin(x_admin_token: str = Header(...)):
    """
    Valida el token emitido por /admin/login (guardado en ADMIN_SESSIONS).
    Retorna el admin_id si es válido.
    """
    admin_id = ADMIN_SESSIONS.get(x_admin_token)
    if not admin_id:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return admin_id


# --- LISTAR TODAS LAS RESERVAS (con estado) ---
@app.get("/admin/reservas")
def admin_reservas_todas(
    page: int = Query(1, gt=0),
    per_page: int = Query(15, gt=0, le=100),
    admin_id: int = Depends(require_admin)
):
    conn = obtener_conexion()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM obtener_reservas_paginadas(%s, %s)", (page, per_page))
        rows = cur.fetchall()
        cols = ["reserva_id","reserva_code","cliente","paquete",
                "fecha_reserva","fecha_salida","estado_reserva",
                "personas","total","total_registros"]
        items = [dict(zip(cols, r)) for r in rows]

        total = items[0]["total_registros"] if items else 0
        return {
            "items": items,
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": math.ceil(total / per_page) if per_page else 1
        }
    finally:
        cur.close()
        conn.close()

@app.post("/admin/reservas/{reserva_id}/confirmar")
def admin_confirmar_reserva(
    reserva_id: int = Path(..., gt=0),
    admin_id: int = Depends(require_admin)
):
    conn = None
    try:
        conn = obtener_conexion()
        conn.autocommit = False
        cur = conn.cursor()

        # Bloquea la fila para evitar carreras
        cur.execute("SELECT estado_reserva FROM reservas WHERE reserva_id=%s FOR UPDATE", (reserva_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        estado = row[0]
        if estado == "Confirmada":
            conn.commit()
            return {"mensaje": "Reserva ya estaba confirmada", "reserva_id": reserva_id}
        if estado != "Pendiente":
            raise HTTPException(status_code=400, detail=f"No se puede confirmar una reserva en estado {estado}")

        cur.execute("UPDATE reservas SET estado_reserva='Confirmada' WHERE reserva_id=%s", (reserva_id,))
        conn.commit()
        return {"mensaje": "Reserva confirmada", "reserva_id": reserva_id}
    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al confirmar: {e}")
    finally:
        if conn: conn.close()

@app.post("/admin/reservas/{reserva_id}/cancelar")
def admin_cancelar_reserva(
    reserva_id: int = Path(..., gt=0),
    admin_id: int = Depends(require_admin)
):
    conn = None
    try:
        conn = obtener_conexion()
        conn.autocommit = False
        cur = conn.cursor()

        # Llama a tu función existente que hace UPDATE de estado + cupos
        cur.execute("SELECT * FROM fx_cancelar_reserva(%s)", (reserva_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=400, detail="No se obtuvo respuesta al cancelar")

        ok, error = row[0], row[1] if len(row) > 1 else None
        if not ok:
            conn.rollback()
            raise HTTPException(status_code=400, detail=error or "No se pudo cancelar")

        conn.commit()
        return {"mensaje": "Reserva cancelada", "reserva_id": reserva_id}
    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cancelar: {e}")
    finally:
        if conn: conn.close()

# main.py
from fastapi import Depends, Header, HTTPException, Body
from pydantic import BaseModel


# --- esquema para crear destino ---
class AdminDestino(BaseModel):
    ciudad: str
    pais: str
    continente: str
    descripcion: str | None = None
    url_imagen: str | None = None

# --- crear destino (usa tu SP sp_insertar_destino) ---
@app.post("/admin/destinos")
def admin_crear_destino(
    dest: AdminDestino = Body(...),
    admin_id: int = Depends(require_admin)
):
    conn = None
    try:
        conn = obtener_conexion()
        conn.autocommit = False
        cur = conn.cursor()

        # (opcional) validación rápida de continente para evitar 400 del SP
        if dest.continente not in ('América','Europa','Asia','África','Oceanía','Antártida'):
            raise HTTPException(status_code=400, detail="Continente no válido")

        # Llama tu procedimiento (versión sin INOUT)
        cur.execute("""
            CALL sp_insertar_destino(%s,%s,%s,%s,%s)
        """, (dest.ciudad, dest.pais, dest.continente, dest.descripcion, dest.url_imagen))

        conn.commit()
        return {"mensaje": "Destino creado con éxito"}
    except HTTPException:
        if conn: conn.rollback()
        raise
    except Exception as e:
        # Manejo amable de duplicados (UNIQUE(ciudad,pais))
        msg = str(e)
        if "unique" in msg.lower() or "duplicate" in msg.lower():
            detail = "Ya existe un destino con esa ciudad y país"
        else:
            detail = f"No se pudo crear el destino: {msg}"
        if conn: conn.rollback()
        raise HTTPException(status_code=400, detail=detail)
    finally:
        if conn: conn.close()

from fastapi import Depends, HTTPException, Query

@app.get("/admin/paquetes")
def admin_listar_paquetes(
    page: int = Query(1, gt=0),
    per_page: int = Query(15, gt=0, le=100),
    q: str | None = None,
    estado: str | None = None,
    admin_id: int = Depends(require_admin)
):
    conn = None
    try:
        conn = obtener_conexion(); cur = conn.cursor()
        cur.execute(
            "SELECT * FROM obtener_paquetes_admin_paginados(%s,%s,%s,%s)",
            (page, per_page, q, estado)
        )
        rows = cur.fetchall()
        cols = [c[0] for c in cur.description]
        items = [dict(zip(cols, r)) for r in rows]
        total = int(items[0]["total"]) if items else 0
        for it in items:
            it.pop("total", None)  # quitar total de cada fila
        return {"items": items, "total": total}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo cargar paquetes: {e}")
    finally:
        if conn:
            cur.close(); conn.close()

class AdminPaquete(BaseModel):
    destino_id: int
    nombre_paquete: str
    descripcion: str
    precio: float
    duracion_dias: int
    fecha_inicio: date
    fecha_fin: date
    capacidad: int
    estado_paquete: str

@app.post("/admin/paquetes")
@app.post("/admin/paquetes/")

def admin_crear_paquete(p: AdminPaquete, admin_id: int = Depends(require_admin)):
    conn = None
    try:
        conn = obtener_conexion(); cur = conn.cursor()
        conn.autocommit = False
        cur.execute("""
          CALL sp_insertar_paquete_ligado(%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            p.destino_id, p.nombre_paquete, p.descripcion, p.precio,
            p.duracion_dias, p.fecha_inicio, p.fecha_fin, p.capacidad,
            p.estado_paquete
        ))
        conn.commit()
        return {"mensaje": "Paquete creado"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=400, detail=f"No se pudo crear: {e}")
    finally:
        if conn: conn.close()

@app.get("/paquetes/activos")
def paquetes_activos(limit: int = 8):
    try:
        conn = obtener_conexion(); cur = conn.cursor()
        cur.execute("""
            SELECT p.paquete_id, p.nombre_paquete, p.descripcion, p.precio,
                   p.duracion_dias, p.fecha_inicio, p.fecha_fin, p.cupos_disponibles,
                   d.destino_id, d.ciudad, d.url_imagen
            FROM paquetes_turisticos p
            JOIN paquete_destino pd ON pd.paquete_id = p.paquete_id
            JOIN destinos d        ON d.destino_id   = pd.destino_id
            WHERE p.estado_paquete = 'Activo' AND p.cupos_disponibles > 0
            ORDER BY p.fecha_inicio NULLS LAST, p.paquete_id DESC
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, r)) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener paquetes: {e}")
    finally:
        if conn: cur.close(); conn.close()


# --- REPORTES ADMIN ---
from fastapi import Depends, Query

@app.get("/admin/reportes/reservas-mes")
def rep_reservas_mes(year: int = Query(..., ge=2000, le=2100), admin_id: int = Depends(require_admin)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM rpt_reservas_mes_destino(%s)", (year,))
        cols = [d[0] for d in cur.description]
        data = [dict(zip(cols, r)) for r in cur.fetchall()]
        return data
    finally:
        cur.close(); conn.close()

@app.get("/admin/reportes/clientes-frecuencia")
def rep_clientes_frec(months: int = Query(12, ge=1, le=60), admin_id: int = Depends(require_admin)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM rpt_clientes_frecuencia(%s)", (months,))
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close(); conn.close()

@app.get("/admin/reportes/resumen-activos-futuras")
def rep_resumen(admin_id: int = Depends(require_admin)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM rpt_resumen_activos_futuras()")
        row = cur.fetchone()
        return {"paquetes_activos": row[0], "reservas_futuras": row[1], "reservas_pendientes": row[2]}
    finally:
        cur.close(); conn.close()

@app.get("/admin/reportes/detalle-reservas")
def rep_detalle(admin_id: int = Depends(require_admin)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM rpt_clientes_reservas_destinos()")
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close(); conn.close()

@app.get("/admin/reportes/top-destinos")
def rep_top_destinos(limit: int = Query(5, ge=1, le=20), admin_id: int = Depends(require_admin)):
    conn = obtener_conexion(); cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM rpt_top_destinos(%s)", (limit,))
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
    finally:
        cur.close(); conn.close()