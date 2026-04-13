import { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [puntosUsuario, setPuntosUsuario] = useState([]);

  const avisoTimeout = useRef(null);
  const logoutTimeout = useRef(null);

const API = import.meta.env.VITE_API_URL;

  // =========================
  // 🔐 Inicialización al montar
  // =========================
  useEffect(() => {
    const fetchUsuario = async () => {
      const token = localStorage.getItem('token');
      const expireAt = localStorage.getItem('expireAt');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Obtener datos del usuario
        const res = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuario(res.data);

        // Limpiar punto anterior si pertenece a otro usuario
        const puntoLS = JSON.parse(localStorage.getItem('puntoSeleccionado') || 'null');
        if (puntoLS?.usuarioId === res.data.id) {
          setPuntoSeleccionado(puntoLS);
        } else {
          localStorage.removeItem('puntoSeleccionado');
          setPuntoSeleccionado(null);
        }

        // Traer puntos habilitados para este usuario
        const puntosRes = await axios.get(`${API}/api/auth/puntos/usuario/${res.data.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPuntosUsuario(puntosRes.data);

        if (expireAt) iniciarTemporizador(Number(expireAt));
      } catch (err) {
        console.error(err);
        limpiarSesion();
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, []);

  const actualizarUsuario = (nuevoUsuario) => {
  setUsuario(nuevoUsuario);
};
  // =========================
  // ⏱ Temporizador de sesión
  // =========================
  const iniciarTemporizador = (expireAt) => {
    clearTimeout(avisoTimeout.current);
    clearTimeout(logoutTimeout.current);

    const tiempoRestante = expireAt - Date.now();
    const aviso = 5 * 60 * 1000; // 5 minutos

    if (tiempoRestante <= 0) {
      logout();
      window.location.href = "/login";
      return;
    }

    if (tiempoRestante > aviso) {
      avisoTimeout.current = setTimeout(() => {
        Swal.fire({
          title: "Aviso!",
          text: "La sesión expirará en 5 minutos. Finalice sus tareas.",
          icon: "warning",
          iconColor: "#35b9ac",
          background: "#1f2937",
          color: "white",
          buttonsStyling: false,
          customClass: {
            confirmButton: "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-2xl text-white"
          }
        });
      }, tiempoRestante - aviso);
    }

    logoutTimeout.current = setTimeout(() => {
      alert("Sesión expirada");
      logout();
      window.location.href = "/login";
    }, tiempoRestante);
  };

  // =========================
  // 🧹 Limpieza de sesión
  // =========================
  const limpiarSesion = () => {
    clearTimeout(avisoTimeout.current);
    clearTimeout(logoutTimeout.current);

    localStorage.removeItem('token');
    localStorage.removeItem('expireAt');
    localStorage.removeItem('puntoSeleccionado');

    setUsuario(null);
    setPuntoSeleccionado(null);
    setPuntosUsuario([]);
  };

  // =========================
  // 🔑 Login
  // =========================
  const login = async (email, password) => {
    // limpiar cualquier sesión anterior
    limpiarSesion();

    const res = await axios.post(`${API}/api/auth/login`, { email, password });
    const { token, expireAt, usuario } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('expireAt', expireAt);

    setUsuario(usuario);

    // Traer puntos del usuario actual
    const puntosRes = await axios.get(`${API}/api/auth/puntos/usuario/${usuario.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPuntosUsuario(puntosRes.data);

    iniciarTemporizador(expireAt);

    return token;
  };

  // =========================
  // 🚪 Logout
  // =========================
  const logout = () => {
    limpiarSesion();
  };

  // =========================
  // 📍 Selección de punto
  // =========================
  const seleccionarPunto = (punto) => {
    setPuntoSeleccionado(punto);
    // Guardamos también el usuarioId para evitar conflictos
    localStorage.setItem('puntoSeleccionado', JSON.stringify({ ...punto, usuarioId: usuario.id }));
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        loading,
        puntoSeleccionado,
        puntosUsuario,
        seleccionarPunto,
        actualizarUsuario
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};