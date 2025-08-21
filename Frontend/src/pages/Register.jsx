import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi"; // 👈 Importar íconos
import "./Register.css";

export default function Register() {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const datos = {
      nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno,
      email,
      telefono,
      direccion,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      contraseña
    };

    try {
      const res = await fetch("http://localhost:8000/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Cliente registrado con éxito");
        navigate("/login");
      } else {
        setErrorMsg(data.detail || "Error al registrar cliente");
      }
    } catch (error) {
      setErrorMsg("Error de conexión con el servidor");
      console.error(error);
    }
  };

  return (
    <div className="register-page">
      <div className="register-form-container">
        <h2>Crear cuenta</h2>
        {errorMsg && <p className="error-message">{errorMsg}</p>}

        <form className="register-form" onSubmit={step === 2 ? handleSubmit : handleNext}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Apellido paterno</label>
                <input value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Apellido materno</label>
                <input value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group password-group">
                <label>Contraseña</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-next">Siguiente</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Tipo de documento</label>
                <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} required>
                  <option value="">Seleccione</option>
                  <option value="INE">INE</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Licencia">Licencia</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Número de documento</label>
                <input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} required />
              </div>

              <div className="form-buttons">
                <button onClick={handleBack} className="btn-back">Atrás</button>
                <button type="submit" className="btn-submit">Registrarse</button>
              </div>
            </>
          )}
        </form>
      </div>

      <div className="register-image">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" alt="Destino turístico" />
      </div>
    </div>
  );
}