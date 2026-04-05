import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRouter({ children }) {
  const { usuario, puntoSeleccionado, loading } = useContext(AuthContext);

  // Mientras carga usuario/puntos
  if (loading) return <Loader />;

  // Si no está logueado, va al login
  if (!usuario) return <Navigate to="/login" replace />;

  // Si no hay punto seleccionado, va a la selección de punto
  if (!puntoSeleccionado) return <Navigate to="/seleccionarPuntoExp" replace />;

  // Si todo está bien, renderiza la ruta protegida
  return children;
}