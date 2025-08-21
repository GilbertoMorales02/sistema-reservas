# conexion.py

import psycopg2

def obtener_conexion():
    try:
        conexion = psycopg2.connect(
            host="localhost",
            database="Agencia",
            user="postgres",
            password="Gilmot@07"      
        )
        return conexion
    except Exception as e:
        print("Error al conectar a la base de datos:", e)
        return None