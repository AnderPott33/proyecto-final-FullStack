import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import Swal from "sweetalert2";
import axios from "axios";
import { FaSitemap } from "react-icons/fa6";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { Cell } from "jspdf-autotable";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function SaldosCuentas() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("saldos_cuentas")
  useEffect(() => {
      if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [cuentas, setCuentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaId, setBusquedaId] = useState("");
  const [estado, setEstado] = useState("");

  // --- Obtener saldos desde backend ---
  const obtenerSaldos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/cuenta/saldos`,
        {}, // si tu endpoint POST no requiere body, envía un objeto vacío
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (Array.isArray(res.data)) setCuentas(res.data);
      else setCuentas([]);
    } catch (error) {
      console.error("Error al obtener saldos de cuentas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerSaldos();
  }, []);

  // --- Filtrar cuentas ---
  const cuentasFiltradas = cuentas.filter((u) => {
    const matchId =
      !busquedaId || u.cuenta_id?.toString().includes(busquedaId);
    const matchNombre =
      !busqueda || u.cuenta?.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = estado === "" || u.estado === estado;
    return matchId && matchNombre && matchEstado;
  });

  if (loading) return <Loader />;

  return (
    <>
      {/* Encabezado */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
              <FaSitemap />
              Saldos de Cuentas
            </h1>
            <p className="text-white/80 text-sm mt-1">Visualización de saldos actuales</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
<div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols- lg:grid-cols-3 gap-4 w-full">
          <input
            type="number"
            placeholder="Buscar Id..."
            value={busquedaId}
            onChange={(e) => setBusquedaId(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Buscar Nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input"
          />
          {/*  <SelectCustom
          options={[
            { value: "", label: "Todos" },
            { value: "ACTIVA", label: "Activa" },
            { value: "INACTIVA", label: "Inactiva" },
          ]}
          value={estado}
          onChange={setEstado}
        /> */}
          <button
            onClick={() => {
              setBusqueda("");
              setBusquedaId("");
              setEstado("");
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2  w-full rounded-md font-semibold transition-all"
          >
            Limpiar filtros
          </button>
        </div>
      </div>


      {/* Tabla de saldos */}
      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            data={cuentasFiltradas}
            initialSort={{ column: "cuenta_id", direction: "ascending" }}
            columns={[
              { header: "ID", accessor: "cuenta_id", sortable: true },
              { header: "Código", accessor: "codigo", sortable: true },
              { header: "Cuenta", accessor: "cuenta", sortable: true },
              { header: "Moneda", accessor: "moneda", sortable: true },
              { header: "Naturaleza", accessor: "naturaleza", sortable: true },
              {
                header: "Saldo Actual", accessor: "saldo_cuenta", align: "end", sortable: true,
                cell: (row) => formatearNumero(row.saldo_cuenta, row.moneda),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}