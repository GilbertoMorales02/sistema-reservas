from fastapi import APIRouter
from conexion import obtener_conexion

router = APIRouter()

@router.post("/registrar_reserva")
def registrar_reserva(cliente_id: int, paquete_id: int):
    conn = obtener_conexion()
    cursor = conn.cursor()
    try:
        cursor.callproc("registrar_reserva", [cliente_id, paquete_id])
        conn.commit()
        return {"mensaje": "Reserva registrada correctamente"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()