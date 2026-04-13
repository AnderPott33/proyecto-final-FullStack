import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, matchPath } from "react-router-dom";
import {
  FaTachometerAlt, FaCashRegister, FaListUl, FaPlus,
  FaMoneyBillWave, FaArrowDown, FaArrowUp, FaFileAlt,
  FaCogs, FaUserFriends, FaSitemap, FaUsers, FaDollarSign, FaFolderOpen,
  FaCertificate, FaShoppingCart ,FaCartPlus,FaMapMarkerAlt ,FaBoxOpen, FaBalanceScale
} from "react-icons/fa";
import { GrMoney } from "react-icons/gr";
import { MdReceiptLong  } from "react-icons/md";
import { FaLocationPinLock } from "react-icons/fa6";
import { FaMoneyBillWheat, FaArrowDownAZ } from "react-icons/fa6";
import { RiFileSearchFill, RiCoinsLine, RiBankLine, RiDatabaseLine  } from "react-icons/ri";
import { TbTagStarred } from "react-icons/tb";
import { MdKeyboardReturn } from "react-icons/md";
import { AiOutlineFileSearch } from "react-icons/ai";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submenuOpen, setSubmenuOpen] = useState(null);
  const submenuRef = useRef(null);

  const menu = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
    {
      name: "Cajas", icon: <FaCashRegister />,
      submenu: [
        {
          title: "Registros",
          items: [{ name: "Registrar", icon: <FaPlus />, path: "/cajas/registrar" }]
        },
        {
          title: "Informes",
          items: [
            { name: "Listar Cajas", icon: <FaListUl />, path: "/cajas/informe" },
            { name: "Movimientos Cajas", icon: <FaMoneyBillWheat />, path: "/cajas/informe/movimientos" }
          ]
        }
      ]
    },
    {
      name: "Cuentas", icon: <FaFolderOpen />,
      submenu: [
        {
          title: "Registros",
          items: [{ name: "Cuentas", icon: <FaSitemap />, path: "/cuenta" }]
        },
        {
          title: "Informes",
          items: [
            { name: "Analítico Cuenta", icon: <RiFileSearchFill />, path: "/cuenta/informe/analitico" },
            { name: "Saldos Cuentas", icon: <FaDollarSign />, path: "/cuenta/informe/saldos" }
          ]
        },
        {
          title: "Informes Contables",
          items: [
            { name: "Balance", icon: <FaBalanceScale />, path: "/cuenta/informe/balance" }
          ]
        }
      ]
    },
    {
      name: "Financiero", icon: <FaMoneyBillWave />,
      submenu: [
        {
          title: "Registros",
          items: [
            { name: "Recibe Valores", icon: <FaArrowUp />, path: "/movimientos/recibeValores" },
            { name: "Paga Valores", icon: <FaArrowDown />, path: "/movimientos/pagaValores" }
          ]
        },
        {
          title: "Informes",
          items: [
            { name: "Movimientos", icon: <FaFileAlt />, path: "/movimientos" },
            { name: "Analítico Cobrar/Pagar", icon: <FaArrowDownAZ />, path: "/movimientos/informe/analitico-cobrar-pagar" },
            { name: "Saldos Cobrar/Pagar", icon: <RiCoinsLine />, path: "/movimientos/informe/saldos-cobrar-pagar" }
          ]
        }
      ]
    },
    {
      name: "Comercial", icon: <FaShoppingCart />,
      submenu: [
        {
          title: "Clientes/Proveedores",
          items: [
            { name: "Entidades", icon: <FaUsers />, path: "/comercial/ClientesProveedores/entidades" },
          ]
        },
        {
          title: "Inventario",
          items: [
            { name: "Articulo", icon: <FaPlus />, path: "/comercial/inventario/articulo" },
            { name: "Categorias", icon: <TbTagStarred />, path: "/comercial/inventario/articulo/categorias" },
            { name: "Marcas", icon: <FaCertificate />, path: "/comercial/inventario/articulo/marcas" },
            { name: "Stock", icon: <FaBoxOpen  />, path: "/comercial/inventario/stock" },
            { name: "Stock Detallado", icon: <RiDatabaseLine  />, path: "/comercial/inventario/stockDetallado" },
          ]
        },
        {
          title: "Ventas",
          items: [
            { name: "Nueva Venta", icon: <GrMoney  />, path: "/comercial/ventas/registrarVenta" },
            { name: "Devolución Venta", icon: <MdKeyboardReturn  />, path: "/comercial/ventas/devolucionVenta" },
            { name: "Consultar Ventas", icon: <AiOutlineFileSearch  />, path: "/comercial/ventas/consultar" },
          ]
        },
        {
          title: "Compras",
          items: [
            { name: "Nueva Compra", icon: <FaCartPlus  />, path: "/comercial/compras/registrarCompra" },
            { name: "Devolución Compra", icon: <MdKeyboardReturn  />, path: "/comercial/compras/devolucionCompra" },
            { name: "Consultar Compras", icon: <AiOutlineFileSearch  />, path: "/comercial/compras/consultar" },
          ]
        },
      ]
    },
    {
      name: "Ajustes", icon: <FaCogs />,
      submenu: [
        {
          title: "Administración",
          items: [
            { name: "Usuarios", icon: <FaUserFriends />, path: "/ajustes/usuarios" }
          ]
        },
        {
          title: "Contable",
          items: [
            { name: "Cotizaciones", icon: <FaUserFriends />, path: "/ajustes/contable/cotizaciones" },
            { name: "Empresa", icon: <RiBankLine />, path: "/ajustes/contable/empresa" },
            { name: "Punto Expedición", icon: <FaMapMarkerAlt />, path: "/ajustes/contable/puntoExpedicion" },
            { name: "Puntos Usuarios", icon: <FaLocationPinLock />, path: "/ajustes/contable/puntoExpedicion/usuarios" },
            { name: "Timbrados", icon: <MdReceiptLong />, path: "/ajustes/contable/timbrados" }
          ]
        }
      ]
    }
  ];

  // Cierra submenú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        setSubmenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMainClick = (item) => {
    if (item.submenu) setSubmenuOpen(submenuOpen === item.name ? null : item.name);
    else { navigate(item.path); setSubmenuOpen(null); }
  };

  const handleSubClick = (path) => {
    navigate(path);
    setSubmenuOpen(null);
  };

  return (
    <div className="fixed mt-16 z-50 flex">

      {/* SIDEBAR PRINCIPAL */}
      <div className="flex flex-col w-16 bg-[#020617]/80 backdrop-blur-xl border-r border-white/10 min-h-screen items-center py-4 gap-3 shadow-2xl">
        {menu.map(item => {
          const isActive = item.submenu
            ? item.submenu.some(sec => sec.items.some(sub => matchPath({ path: sub.path, end: true }, location.pathname)))
            : !!matchPath({ path: item.path, end: true }, location.pathname);

          return (
            <div key={item.name} className="relative group w-full flex justify-center">
              {/* INDICADOR ACTIVO */}
              {isActive && (
                <>
                  <div className="absolute left-0 w-1 h-11 bg-[#35b9ac] rounded-r-full" />
                  <div className="absolute w-10 h-10 bg-[#35b9ac]/30 blur-2xl rounded-full" />
                </>
              )}
              <button
                onClick={() => handleMainClick(item)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-md transition-all duration-300 active:scale-95 cursor-pointer select-none
                  ${isActive
                    ? "bg-[#35b9ac]/20 text-[#35b9ac] shadow-inner scale-105"
                    : "text-gray-500 hover:text-white hover:bg-white/10 hover:scale-105"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
              </button>

              {/* TOOLTIP */}
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-md bg-[#0b1220]/90 backdrop-blur-md text-gray-200 text-[11px] tracking-wide opacity-0 group-hover:opacity-100 transition whitespace-nowrap border border-white/10 shadow-lg">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* SUBMENU */}
      {submenuOpen && (
        <div
          ref={submenuRef}
          className="absolute left-16 top-0 w-60 min-h-screen bg-[#0b1220]/90 backdrop-blur-2xl border border-white/10 rounded-r-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col py-4 animate-in slide-in-from-left-2 duration-200"
        >
          <h2 className="px-5 py-3 text-gray-400 uppercase text-xs font-semibold tracking-wider border-b border-white/10">
            {submenuOpen}
          </h2>

          <div className="mt-2 px-2 space-y-4">
            {menu.find(i => i.name === submenuOpen).submenu.map(section => (
              <div key={section.title}>
                <h3 className="px-4 py-2 text-gray-400 uppercase text-[10px] font-semibold tracking-wide">
                  {section.title}
                </h3>
                {section.items.map(sub => {
                  const isActive = !!matchPath({ path: sub.path, end: true }, location.pathname);
                  return (
                    <button
                      key={sub.name}
                      onClick={() => handleSubClick(sub.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-300 active:scale-95 cursor-pointer select-none
                        ${isActive
                          ? "bg-[#35b9ac]/20 text-[#35b9ac] shadow-inner"
                          : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                        }`}
                    >
                      <span className="text-base">{sub.icon}</span>
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}