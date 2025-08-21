import { createContext, useState, useEffect, useMemo } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); // { email, cliente_id? }

  // Cargar usuario al iniciar
  useEffect(() => {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        // Back-compat: si antes sólo guardabas email, no truena
        setUsuario(saved && typeof saved === "object" ? saved : null);
      } catch {
        setUsuario(null);
      }
    }
  }, []);

  // Login: ahora acepta objeto { email, cliente_id }
  const login = ({ email, cliente_id }) => {
    const user = { email, cliente_id };
    localStorage.setItem("usuario", JSON.stringify(user));
    setUsuario(user);
  };

  const logout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("cliente_id")
    setUsuario(null);
  };

  // Helpers útiles en el app
  const isLoggedIn = !!usuario?.email && !!usuario?.cliente_id;
  const clienteId = usuario?.cliente_id ?? null;
  const email = usuario?.email ?? null;

  const value = useMemo(
    () => ({ usuario, login, logout, isLoggedIn, clienteId, email }),
    [usuario]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};