import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useCotizacion } from '../context/CotizacionContext';
import CotizacionesForm from '../components/CotizacionesForm'; // modal de cotizaciones

export default function Layout() {
  const { usuario, logout } = useContext(AuthContext);
  const { mostrarModal } = useCotizacion(); // 🔹 control de modal
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("LOGOUT OK");
    logout();
    navigate("/login");
  };

  return (
    <div className="flex bg-[#359bac]/30 min-h-screen">

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-auto">

        {/* NAVBAR */}
        <Navbar
          nombreUsuario={usuario?.nombre}
          onLogout={handleLogout}
        />

        {/* AREA DE PÁGINA */}
        <div className="mt-17 ml-17 mr-1 mb-2">
          <Outlet /> {/* renderiza la página actual */}
        </div>
      </div>

      {/* MODAL GLOBAL DE COTIZACIONES */}
      {mostrarModal && <CotizacionesForm />}
    </div>
  );
}