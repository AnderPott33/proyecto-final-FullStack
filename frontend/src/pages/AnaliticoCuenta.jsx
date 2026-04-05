import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"
import Loader from "../components/Loader";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { RiFileSearchFill } from "react-icons/ri";
import { FaMagnifyingGlassArrowRight } from "react-icons/fa6";
import { usePermiso } from "../hooks/usePermiso";

export default function AnaliticoCuenta() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("analitico");
  useEffect(() => {
        if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [cuentasList, setCuentasList] = useState([]);
  const [cuentaSelect, setCuentaSelect] = useState("");
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes.toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [datos, setDatos] = useState([]);

  // Trae las cuentas de la API
  const obtenerCuentas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/cuenta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data || [];
    } catch (error) {
      console.error("Error al traer cuentas:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchCuentas = async () => {
      const data = await obtenerCuentas();
      setCuentasList(data);
      setLoading(false);
    };
    fetchCuentas();
  }, []);


  const handleFiltrar = async () => {
    if (!cuentaSelect || !fechaInicio) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/cuenta/analitico`, // URL
        { cuentaId: cuentaSelect, fechaInicio, fechaFin }, // cuerpo del POST
        { headers: { Authorization: `Bearer ${token}` } } // headers correctos
      );

      // Si tu API devuelve un arreglo con los movimientos y saldo acumulado
      setDatos(res.data ?? []);

    } catch (error) {
      console.error("Error al traer saldo analítico:", error);
      setDatos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 200)
  }, [])

  if (loading) return <Loader />

  return (
    <>
      {/* HEADER */}
      <div className="mb-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                    bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                    rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">

          <div>
            <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
              <RiFileSearchFill />
              Analitico Cuenta
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Verifique los registros en las cuentas.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto"></div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

          {/* Cuenta */}
          <div className="w-full">
            <SelectCustom
              options={cuentasList.map(c => ({
                value: c.id,
                label: c.nombre
              }))}
              value={cuentaSelect}
              onChange={setCuentaSelect}
              className="w-full"
            />
          </div>

          {/* Fecha inicio */}
          <input
            type="date"
            value={fechaInicio}
            onChange={d => setFechaInicio(d.target.value)}
            className="input w-full"
          />

          {/* Fecha fin */}
          <input
            type="date"
            value={fechaFin}
            onChange={d => setFechaFin(d.target.value)}
            className="input w-full"
          />

          {/* Botón */}
          <button
            onClick={handleFiltrar}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md
                     bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white
                     hover:brightness-105 transition-all shadow-md font-semibold text-sm cursor-pointer"
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
              { accessor: "id_movimiento", header: "ID" },
              { accessor: "usuario", header: "Usuario", className: "text-center" },
              {
                accessor: "fecha",
                header: "Fecha",
                className: "text-center",
                cell: (row) => formatearFecha(row.fecha),
                sortable: true,
                sortType: "date"
              },
              { accessor: "descripcion", header: "Descripción" },
              { accessor: "forma_pago", header: "Forma Pago", className: "text-center" },
              { accessor: "moneda", header: "Moneda", className: "text-center" },
              {
                accessor: "debito",
                header: "Ingreso",
                className: "text-end font-semibold text-green-500",
                align: 'end',
                cell: (row) => formatearNumero(row.debito, row.moneda),
              },
              {
                accessor: "credito",
                header: "Salida",
                className: "text-end font-semibold text-red-500",
                align: 'end',
                cell: (row) => formatearNumero(row.credito, row.moneda),
              },
              {
                accessor: "saldo",
                header: "Saldo",
                className: "text-end font-semibold",
                align: 'end',
                cell: (row) => (
                  <span className={row.saldo > 0 ? "text-green-500" : "text-red-500"}>
                    {formatearNumero(row.saldo, row.moneda)}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}