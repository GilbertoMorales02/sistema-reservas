import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Público
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Destinos from "./pages/Destinos";
import PaquetesDestino from "./pages/PaquetesDestino";
import CrearReserva from "./pages/CrearReserva";
import Confirmacion from "./pages/Confirmacion";
import MisReservas from "./pages/MisReservas";
import MiPerfil from "./pages/MiPerfil";
import Footer from "./components/Footer";
import Contactanos from "./pages/Contactanos";

// Admin
import AdminLogin from "./admin/AdminLogin";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminReservas from "./admin/AdminReservas";
import AdminDestinos from "./admin/AdminDestinos";
import AdminPaquetes from "./admin/AdminPaquetes";
import AdminReportes from "./admin/AdminReportes";
import Paquetes from "./pages/Paquetes";

// Layout público con Navbar
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Admin (sin Navbar) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* RUTAS ANIDADAS ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminReservas />} />            {/* /admin */}
          <Route path="reservas" element={<AdminReservas />} /> {/* /admin/reservas */}
          <Route path="destinos" element={<AdminDestinos />} />
          <Route path="paquetes" element={<AdminPaquetes />} />
          <Route path="reportes" element={<AdminReportes />} />
        </Route>

        {/* Público (con Navbar) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/destinos" element={<Destinos />} />
          <Route path="/destinos/:destinoId/paquetes" element={<PaquetesDestino />} />
          <Route path="/reservar/:paqueteId" element={<CrearReserva />} />
          <Route path="/confirmacion" element={<Confirmacion />} />
          <Route path="/mis-reservas" element={<MisReservas />} />
          <Route path="/mi-perfil" element={<MiPerfil />} />
          <Route path="/contacto" element={<Contactanos />} />
          <Route path="/paquetes" element={<Paquetes />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}