import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { RiFileSearchFill } from "react-icons/ri";
import { FaMagnifyingGlassArrowRight } from "react-icons/fa6";

export default function AnaliticoCuenta() {
  const [loading, setLoading] = useState(true);
  const [cuentasList, setCuentasList] = useState([]);
  const [cuentaSelect, setCuentaSelect] = useState("");
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes.toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [datos, setDatos] = useState([]);

  // Trae las cuentas de la API
  const obtenerCuentasCobrarPagar = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/cuenta", {
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
        "http://localhost:5000/api/cuenta/analitico", // URL
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
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                      bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                      rounded-3xl p-8 shadow-lg shadow-gray-300/30">

          {/* Título e subtítulo */}
          <div>
            <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
              <RiFileSearchFill />
              Analitico Cuenta
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Verifique los registros en las cuentas.
            </p>
          </div>

          {/* Seção de filtros e botões */}
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-start md:items-center">
          <div className="w-full md:w-80 h-[52px]">
            {/* Selección de cuenta */}
            <SelectCustom
              options={cuentasList.map(c => ({
                value: c.id,
                label: c.nombre
              }))}
              value={cuentaSelect}
              onChange={setCuentaSelect}
            />
          </div>
          {/* Fecha inicio */}
          <input
            type="date"
            value={fechaInicio}
            onChange={d => setFechaInicio(d.target.value)}
            className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-2xl
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
            placeholder="Fecha Inicio"
          />

          {/* Fecha fin */}
          <input
            type="date"
            value={fechaFin}
            onChange={d => setFechaFin(d.target.value)}
            className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-2xl
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
            placeholder="Fecha Fin"
          />

          {/* Botón filtrar */}
          <button
            onClick={handleFiltrar}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl
                         bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white
                         hover:scale-105 hover:brightness-105 transition-all duration-200
                         shadow-md cursor-pointer font-semibold text-sm"
          >
            <FaMagnifyingGlassArrowRight />
            Filtrar
          </button>
        </div>


      </div>

      <div className=" rounded-2xl bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">
        {!datos ? <p className=" text-3xl bg-red-300 p-8 rounded-2xl text-white text-center italic">No se contraron registros!</p> :
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
          />}
      </div>
    </>
  );
}