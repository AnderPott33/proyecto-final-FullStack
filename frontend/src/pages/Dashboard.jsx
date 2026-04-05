import { useEffect, useState, useContext } from "react";
import Loader from "../components/Loader";
import { FaTachometerAlt, FaWallet, FaUsers, FaMoneyBillWave } from "react-icons/fa";
import axios from "axios";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { AuthContext } from "../context/AuthContext";
import SelectCustom from "../components/SelectCustom";
import { usePermiso } from "../hooks/usePermiso";

const BANDERAS = {
  USD: "🇺🇸",
  PYG: "🇵🇾",
  BRL: "🇧🇷",
};


export default function Dashboard({ columns }) {
  const API = import.meta.env.VITE_API_URL;
  const {puede} = usePermiso();
  const { usuario, puntoSeleccionado, seleccionarPunto } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cuentas: 0,
    saldoPYG: 0,
    saldoUSD: 0,
    saldoBRL: 0,
    usuarios: 0,
    ultimosMovimientos: [],
    totalIngreso: 0,
    totalGasto: 0,
    totalCobrar: 0,
    totalPagar: 0
  });
  const [puntosUsuario, setPuntosUsuario] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // --- PUNTOS DEL USUARIO ---
        const puntosRes = await axios.get(`${API}/api/auth/puntos/usuario/${usuario.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPuntosUsuario(puntosRes.data || []);

        // --- CUENTAS ---
        const cuentasRes = await axios.post(`${API}/api/cuenta/saldos`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const cuentas = Array.isArray(cuentasRes.data) ? cuentasRes.data : [];
        let saldoPYG = 0, saldoUSD = 0, saldoBRL = 0;
        cuentas.forEach(c => {
          const monto = Number(c.saldo_cuenta || 0);
          if (c.sub_tipo === "EFECTIVO" || c.sub_tipo === "BANCO") {
            if (c.moneda === "PYG") saldoPYG += monto;
            if (c.moneda === "USD") saldoUSD += monto;
            if (c.moneda === "BRL") saldoBRL += monto;
          }
        });

        // --- USUARIOS ---
        const usuariosRes = await axios.get(`${API}/api/auth`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : [];
        const usuariosActivos = usuarios.filter(u => u.estado === "ACTIVO");

        // --- MOVIMIENTOS ---
        const movimientosRes = await axios.get(`${API}/api/movimientos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const movimientos = Array.isArray(movimientosRes.data.movimientos) ? movimientosRes.data.movimientos : [];
        movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        // --- A COBRAR / A PAGAR ---
        const aPagarCobrarRes = await axios.post(`${API}/api/cuenta/saldosCobrarPagar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const aCobrarPagar = Array.isArray(aPagarCobrarRes.data) ? aPagarCobrarRes.data : [];
        let totalCobrar = 0, totalPagar = 0;
        aCobrarPagar.forEach(m => {
          if (m.naturaleza === "DEUDORA") totalCobrar += Number(m.saldo_cuenta || 0);
          if (m.naturaleza === "ACREDORA") totalPagar += Number(m.saldo_cuenta || 0);
        });

        // --- INGRESOS Y GASTOS ---
        let totalIngreso = 0, totalGasto = 0;
        movimientos.forEach(m => {
          if (m.tipo_operacion === "INGRESO" || m.tipo_operacion === "VENTA")   totalIngreso += Number(m.total_monto || 0);
          if (m.tipo_operacion === "GASTO" || m.tipo_operacion === "COMPRA") totalGasto += Number(m.total_monto || 0);
        });
        totalIngreso -= totalCobrar;
        totalGasto -= totalPagar;

        const ultimosMovimientos = movimientos.slice(0, 5);

        setStats({
          cuentas: cuentas.length,
          saldoPYG,
          saldoUSD,
          saldoBRL,
          usuarios: usuariosActivos.length,
          ultimosMovimientos,
          totalIngreso,
          totalGasto,
          totalCobrar,
          totalPagar
        });

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar dashboard:", error.message);
        setLoading(false);
      }
    };

    if (usuario) fetchData();
  }, [usuario]);

  // --- COLUMNAS DATATABLE ---
  const localColumns = [
    { header: "ID", accessor: "movimiento_id", sortable: true, align: "center", cell: row => row.movimiento_id },
    { header: "Fecha", accessor: "fecha", sortable: true, align: "center", cell: row => formatearFecha(row.fecha) },
    { header: "Descripción", accessor: "movimiento_descripcion", sortable: true, align: "start", cell: row => row.movimiento_descripcion || "-" },
    {
      header: "Tipo", accessor: "tipo_operacion", sortable: true, align: "center", cell: row => {
        const tipo = row.tipo_operacion;
        const estilos = {
          INGRESO: "bg-green-100 text-green-700 border-green-200",
          GASTO: "bg-red-100 text-red-700 border-red-200",
          REGISTRO: "bg-blue-100 text-blue-700 border-blue-200",
          CAJA: "bg-blue-100 text-blue-700 border-blue-200"
        };
        return <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${estilos[tipo] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{tipo}</span>
      }
    },
    { header: "Monto", accessor: "total_monto", sortable: true, align: "right", cell: row => formatearNumero(row.total_monto, row.moneda_principal) },
    { header: "Moneda", accessor: "moneda", sortable: true, align: "center", cell: row => row.moneda_principal },
  ];

useEffect(() => {
  if (usuario && puntosUsuario?.length === 1) {
    seleccionarPunto(puntosUsuario[0]); // selecciona automáticamente
  }
}, [usuario, puntosUsuario]);

  if (loading) return <Loader />;

  const handleSeleccionPunto = (value) => {
    const punto = puntosUsuario.find((p) => p.id === Number(value));
    if (punto) seleccionarPunto(punto);
  };


  return (
    <>
      {/* --- MODAL PUNTO EXPEDICIÓN --- */}
      {usuario && !puntoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#111827]  rounded-md p-8 w-96 shadow-lg border-t-4 border-[#35b9ac]">
            <h2 className="text-xl font-bold text-center text-white mb-4">Selecciona tu punto</h2>


            <SelectCustom
              options={puntosUsuario
                .slice()
                .sort((a, b) => a.id - b.id)
                .map(p => ({ value: p.id, label: `${p.id} - ${p.nombre}` }))}
              value={puntoSeleccionado?.id || ""}
              onChange={handleSeleccionPunto}
              placeholder="-- Selecciona --"
              isClearable={false}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88] 
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-4xl md:text-3xl font-bold text-white flex items-center gap-2 tracking-wide">
              <FaTachometerAlt /> Dashboard
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Bienvenido al panel de control.
            </p>
          </div>
        </div>

        {/* --- ESTADÍSTICAS PRINCIPALES --- */}
        {puede("ver_relatorios_financieros") && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: <FaUsers />, label: "Usuarios activos", value: stats.usuarios, color: "bg-purple-100 text-purple-700" },
            { icon: <FaWallet />, label: "Cuentas activas", value: stats.cuentas, color: "bg-cyan-100 text-cyan-700" },
            { icon: <FaMoneyBillWave />, label: "Saldo PYG", value: formatearNumero(stats.saldoPYG, "PYG"), color: "bg-green-100 text-green-700" },
            { icon: <FaMoneyBillWave />, label: "Saldo USD", value: formatearNumero(stats.saldoUSD, "USD"), color: "bg-blue-100 text-blue-700" },
            { icon: <FaMoneyBillWave />, label: "Saldo BRL", value: formatearNumero(stats.saldoBRL, "BRL"), color: "bg-orange-100 text-orange-700" }
          ].map((item, i) => (
            <div key={i} className="rounded-md shadow-md hover:shadow-xl transition overflow-hidden">
              <div className={`p-5 flex flex-col items-start gap-2 bg-white/80 backdrop-blur-md`}>
                <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${item.color} shadow-inner`}>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <p className="text-gray-500 text-sm">{item.label}</p>
                <h2 className="text-xl font-bold text-gray-800">{item.value}</h2>
              </div>
            </div>
          ))}
        </div>}

        {/* --- RESUMEN FINANCIERO --- */}
      {puede("ver_relatorios_financieros") &&  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ingresos", value: formatearNumero(stats.totalIngreso, "PYG"), color: "from-green-500 to-green-400" },
            { label: "Gastos", value: formatearNumero(stats.totalGasto, "PYG"), color: "from-red-500 to-red-400" },
            { label: "A Cobrar", value: formatearNumero(stats.totalCobrar, "PYG"), color: "from-emerald-500 to-emerald-400" },
            { label: "A Pagar", value: formatearNumero(stats.totalPagar, "PYG"), color: "from-orange-500 to-orange-400" }
          ].map((item, i) => (
            <div key={i} className="rounded-md overflow-hidden shadow-md hover:shadow-xl transition">
              <div className={`p-5 bg-gradient-to-r ${item.color} text-white rounded-md flex flex-col gap-1`}>
                <p className="text-sm opacity-90">{item.label}</p>
                <h2 className="text-2xl font-bold">{item.value}</h2>
              </div>
            </div>
          ))}
        </div>}

        {/* --- ÚLTIMOS MOVIMIENTOS --- */}
      {puede("ver_relatorios_financieros") &&  <div className="bg-white rounded-md shadow-md border border-gray-100 p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Últimos Movimientos</h3>
            <span className="text-xs text-gray-400">Últimos 5 registros</span>
          </div>

          <DataTable
            data={stats.ultimosMovimientos}
            columns={localColumns}
            initialSort={{ column: "fecha", direction: "descending" }}
            initialPageSize={5}
            pageSizeOptions={[5, 10, 25]}
            showExcelButton={false}
            showPDFButton={false}
            selectable={false}
          />
        </div>}
      </div>
    </>
  );
}


