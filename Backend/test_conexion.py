# test_conexion.py
from conexion import obtener_conexion

def probar_conexion():
    print("Intentando conectar a la base de datos...")
    
    # Llamamos a tu función para obtener la conexión
    conn = obtener_conexion()
    
    # Verificamos si la conexión fue exitosa
    if conn:
        print("¡Conexión a la base de datos exitosa! ✅")
        # Es una buena práctica cerrar la conexión después de usarla
        conn.close()
        print("Conexión cerrada.")
    else:
        print("No se pudo establecer la conexión a la base de datos. ❌")

# Ejecutamos la función de prueba
if __name__ == "__main__":
    probar_conexion()