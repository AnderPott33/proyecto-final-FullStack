import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const CotizacionContext = createContext();

export const useCotizacion = () => useContext(CotizacionContext);

export const CotizacionProvider = ({ children }) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;
  const verificarCotizacionHoy = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(
        `${API}/api/cambio/existe-hoy`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mostrar modal si no hay cotización para hoy
      setMostrarModal(!res.data.existe);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Verificar al iniciar app
    verificarCotizacionHoy();

    // Ejecutar a la medianoche
    const interval = setInterval(() => {
      const now = new Date();
      if (
        now.getHours() === 0 &&
        now.getMinutes() === 0 &&
        now.getSeconds() === 0
      ) {
        verificarCotizacionHoy();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cada cambio de ruta
    verificarCotizacionHoy();
  }, [location.pathname]);

  return (
    <CotizacionContext.Provider value={{ mostrarModal, setMostrarModal }}>
      {children}
    </CotizacionContext.Provider>
  );
};