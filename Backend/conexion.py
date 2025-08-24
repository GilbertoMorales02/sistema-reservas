# Backend/conexion.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Carga .env solo en local si existe (no rompe en Railway)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

def _dsn_from_parts():
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    pwd  = os.getenv("DB_PASSWORD")
    # sslmode=require para Neon/Supabase/etc.
    return f"postgresql://{user}:{pwd}@{host}:{port}/{name}?sslmode=require"

def obtener_conexion():
    """
    Abre una conexión nueva en cada uso.
    Producción: usa DATABASE_URL (Neon pooler) con ?sslmode=require.
    Local: usa DB_* si no hay DATABASE_URL.
    """
    dsn = os.getenv("DATABASE_URL") or _dsn_from_parts()

    # Asegura sslmode=require por si falta en DATABASE_URL
    if "sslmode=" not in dsn:
        sep = "&" if "?" in dsn else "?"
        dsn = f"{dsn}{sep}sslmode=require"

    return psycopg2.connect(
        dsn,
        connect_timeout=10,
        cursor_factory=RealDictCursor,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )