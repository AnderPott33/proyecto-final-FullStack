import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { RiFileSearchFill } from "react-icons/ri";
import { FaMagnifyingGlassArrowRight } from "react-icons/fa6";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function CuentasCobrarPagar() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("saldos_cobrar_pagar")
  useEffect(() => {
      if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [cuentasList, setCuentasList] = useState([]);
  const [entidadesList, setEntidadesList] = useState([]);
  const [cuentaSelect, setCuentaSelect] = useState("");
  const [entidadSelect, setEntidadSelect] = useState("");

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [fechaInicio, setFechaInicio] = useState(primerDiaMes.toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [datos, setDatos] = useState([]);

  const obtenerCuentas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/cuenta/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data || [];
    } catch (error) {
      console.error("Error al traer cuentas:", error);
      return [];
    }
  };

  const obtenerEntidades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/entidad/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data || [];
    } catch (error) {
      console.error("Error al traer entidades:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const cuentas = await obtenerCuentas();
      const entidades = await obtenerEntidades();

      setCuentasList(cuentas);
      setEntidadesList(entidades);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleFiltrar = async () => {
    if (!fechaInicio) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/cuenta/saldoEntidad`,
        {
          cuentaId: null,
          entidadId: entidadSelect || null,
          fechaInicio,
          fechaFin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDatos(res.data ?? []);
    } catch (error) {
      console.error("Error al traer saldo analítico:", error);
      setDatos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      {/* HEADER */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-2xl md:text-4xl flex gap-2 font-bold text-white tracking-wide">
              <RiFileSearchFill />
              Saldos por Cobrar y Pagar
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Verifique los saldos en las cuentas.
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

          {/* ENTIDAD */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <div className="w-full h-[52px]">
              <SelectCustom
                options={entidadesList.map(e => ({ value: e.id, label: e.nombre }))}
                value={entidadSelect}
                onChange={(option) => setEntidadSelect(option)}
              />
            </div>

            {/* <button
              onClick={() => setEntidadSelect("")}
              className="px-3 py-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600 whitespace-nowrap"
            >
              Limpiar
            </button> */}
          </div>

          {/* FECHA INICIO */}
          <input
            type="date"
            value={fechaInicio}
            onChange={d => setFechaInicio(d.target.value)}
            className="w-full bg-neutral-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-md
                       focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                       shadow-inner transition-colors duration-300 font-bold text-sm"
          />

          {/* FECHA FIN */}
          <input
            type="date"
            value={fechaFin}
            onChange={d => setFechaFin(d.target.value)}
            className="w-full bg-neutral-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-md
                       focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                       shadow-inner transition-colors duration-300 font-bold text-sm"
          />

          {/* BOTÓN */}
          <button
            onClick={handleFiltrar}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md 
                        bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white
                        hover:scale-105 hover:brightness-105 transition-all duration-200
                        shadow-md font-semibold text-sm w-full
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaMagnifyingGlassArrowRight />
            Filtrar
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            data={datos}
            columns={[
              { accessor: "cuenta_id", header: "ID" },
              { accessor: "entidad", header: "Entidad" },
              { accessor: "cuenta", header: "Cuenta" },
              { accessor: "saldo_anterior", header: "Saldo Anterior", align: "end", cell: r => formatearNumero(r.saldo_anterior, r.moneda) },
              { accessor: "total_debito", header: "Total Débito", align: "end", className: "text-end font-semibold text-green-500", cell: r => formatearNumero(r.total_debito, r.moneda) },
              { accessor: "total_credito", header: "Total Crédito", align: "end", className: "text-end font-semibold text-red-500", cell: r => formatearNumero(r.total_credito, r.moneda) },
              { accessor: "saldo", header: "Saldo", align: "end", cell: r => (
                <span className={r.saldo > 0 ? "text-green-500" : "text-red-500"}>
                  {formatearNumero(r.saldo_final, r.moneda)}
                </span>
              )},
            ]}
          />
        </div>
      </div>
    </>
  );
}