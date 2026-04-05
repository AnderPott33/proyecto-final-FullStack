import { FaWallet, FaSignOutAlt, FaUser, FaCog, FaMapMarkerAlt } from "react-icons/fa";
import { useCaja } from "../context/CajaContext";
import { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function Navbar({ nombreUsuario, onLogout }) {
  const navigate = useNavigate()
  const { caja, loading } = useCaja();
  const { puntoSeleccionado } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="
      fixed top-0 left-0 w-full h-16 z-50
      flex justify-between items-center px-6
      bg-[#020617]/80 backdrop-blur-2xl
      border-b border-white/10
      shadow-[0_8px_30px_rgba(0,0,0,0.5)]
    ">

      {/* BRAND */}
      <div className="flex items-center gap-3 select-none">
        <div className="
          w-9 h-9 rounded-md
          bg-[#35b9ac]/20
          flex items-center justify-center
          text-[#35b9ac] font-bold
          shadow-inner
        ">O</div>
        <span className="text-sm font-semibold tracking-wide text-gray-200">
          Owl<span className="text-[#35b9ac]">Soft</span>
        </span>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* CAJA */}
        {!loading && (
          <>
            <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs
            border transition-all duration-300
            ${caja
                ? "bg-[#35b9ac]/10 text-[#35b9ac] border-[#35b9ac]/20 shadow-inner"
                : "bg-white/5 text-gray-400 border-white/10"
              }
          `}>
              <FaWallet className="text-[11px]" />
              {caja ? `Caja: ${caja.id}` : "Sin caja"}
            </div>
            <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs
            border transition-all duration-300 bg-[#35b9ac]/10 text-[#35b9ac] border-[#35b9ac]/20 shadow-inner"
            `}>
              <FaMapMarkerAlt className="text-[11px]" />
              <span>Punto Exp: {puntoSeleccionado?.nombre}</span>

            </div>
          </>
        )}

        {/* USER DROPDOWN */}
        <div ref={dropdownRef} className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="
              flex items-center gap-3
              px-3 py-1.5 rounded-md
              hover:bg-white/10 transition-all duration-300
              cursor-pointer select-none
            "
          >
            {/* Avatar */}
            <div className="
              w-9 h-9 rounded-full
              bg-gradient-to-br from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
              flex items-center justify-center
              text-white text-sm font-semibold
              shadow-md
            ">
              {nombreUsuario?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Info */}
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-gray-200 font-medium">
                {nombreUsuario}
              </span>
              <span className="text-[11px] text-gray-500">
                Usuario activo
              </span>
            </div>
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="
              absolute right-0 mt-3 w-56
              bg-[#020617]/90 backdrop-blur-2xl
              border border-white/10
              rounded-md
              shadow-[0_20px_60px_rgba(0,0,0,0.6)]
              overflow-hidden
              animate-in fade-in zoom-in-95 duration-200
            ">

              {/* HEADER */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm text-gray-200 font-medium">{nombreUsuario}</p>
                <p className="text-xs text-gray-500">Sesión activa</p>
              </div>

              {/* OPTIONS */}
              <div className="p-1.5 space-y-1">


                <button
                  onClick={() => {
                    navigate("/perfil");
                    setOpen(false); // fecha o dropdown
                  }}
                  className="
        w-full flex items-center gap-3 px-3 py-2 rounded-md
        text-sm text-gray-300
        hover:bg-white/10 hover:text-white
        transition-all duration-200
        hover:translate-x-1
        cursor-pointer
      "
                >
                  <FaUser className="text-xs" />
                  Perfil
                </button>


                <div className="my-1 border-t border-white/10"></div>

                {/* LOGOUT */}
                <button
                  onClick={onLogout}
                  className="
                    w-full flex items-center gap-3 px-3 py-2 rounded-md
                    text-sm text-red-400
                    hover:bg-red-500/10 hover:text-red-300
                    transition-all duration-200
                    hover:translate-x-1
                    cursor-pointer
                  "
                >
                  <FaSignOutAlt className="text-xs" />
                  Cerrar sesión
                </button>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}