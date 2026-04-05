import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import Swal from "sweetalert2";
import { useCaja } from "../context/CajaContext";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { FaListUl } from "react-icons/fa";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function ListaCajas() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const { puedeAcceder, puede } = usePermiso();

  // Bloquear acceso completo a la página
const tienePermiso = puedeAcceder("caja")
  useEffect(() => {
      if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [listaCajas, setListaCajas] = useState([]);
  const [cajaId, setCajaId] = useState(null);

  const { obtenerCaja, caja } = useCaja();

  const [filtroEstado, setFiltroEstado] = useState("ABIERTA");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  useEffect(() => {
    obtenerCajas();
  }, []);

  const loguearCaja = async (cajaId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API}/api/caja/loguear`,
        { cajaId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await obtenerCaja();
      Swal.fire({
        icon: "success",
        title: "Caja logueada",
        text: `Caja #${cajaId} logueada correctamente`,
        timer: 1500,
        iconColor: "blue",
        background: "#121926",
        color: "white",
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo loguear la caja",
      });
    }
  };

  const reabrirCaja = async (cajaId) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API}/api/caja/reabrir/${cajaId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await obtenerCajas();
      Swal.fire({
        icon: "success",
        title: "Caja reabierta",
        text: `Caja #${cajaId} ahora está abierta`,
        timer: 1500,
        iconColor: "orange",
        background: "#121926",
        color: "white",
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo reabrir la caja",
      });
    }
    setLoading(false);
  };

  const obtenerCajas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/caja`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) setListaCajas(res.data);
      else if (Array.isArray(res.data.cajas)) setListaCajas(res.data.cajas);
      else setListaCajas([]);
    } catch (error) {
      console.error("Error al obtener cajas:", error);
    } finally {
      setLoading(false);
    }
  };

  const cajasFiltradas = listaCajas.filter((c) => {
    const estadoOk = filtroEstado === "TODAS" ? true : c.estado === filtroEstado;
    const usuarioOk = c.usuario?.toLowerCase().includes(filtroUsuario.toLowerCase());

    const fecha = new Date(c.fecha_apertura);
    const desdeOk = filtroDesde ? fecha >= new Date(filtroDesde) : true;
    const hastaOk = filtroHasta ? fecha <= new Date(filtroHasta) : true;

    return estadoOk && usuarioOk && desdeOk && hastaOk;
  });

  const columns = [
    { header: "ID", accessor: "id", sortable: true },
    { header: "Usuario", accessor: "usuario", sortable: true },
    {
      header: "Fecha Apertura",
      accessor: "fecha_apertura",
      sortable: true,
      sortType: "date",
      cell: (c) => formatearFecha(c.fecha_apertura),
    },
    {
      header: "Fecha Cierre",
      accessor: "fecha_cierre",
      sortable: true,
      sortType: "date",
      cell: (c) => formatearFecha(c.fecha_cierre),
    },
    { header: "Moneda", accessor: "moneda", sortable: true },
    {
      header: "Saldo Apertura",
      accessor: "saldo_inicial",
      sortable: true,
      cell: (c) => formatearNumero(c.saldo_inicial, c.moneda),
    },
    {
      header: "Saldo Cierre",
      accessor: "saldo_final",
      sortable: true,
      cell: (c) => formatearNumero(c.saldo_final, c.moneda),
    },
    {
      header: "Estado",
      accessor: "estado",
      sortable: true,
      cell: (c) => (
        <span
          className={`px-2 py-1 font-semibold rounded-lg text-xs ${c.estado === "ABIERTA"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
            }`}
        >
          {c.estado}
        </span>
      ),
    },
    {
      header: "Acciones",
      accessor: "acciones",
      cell: (c) => (
        <div className="flex flex-col sm:flex-row gap-1 justify-center">
          <button
            onClick={() => {
              setCajaId(c.id);
              loguearCaja(c.id);
            }}
            className={`p-1 cursor-pointer rounded-lg font-semibold text-white ${caja?.id === c.id ? "bg-green-600" : "bg-blue-500"
              }`}
          >
            {caja?.id === c.id ? "Activa" : "Loguear"}
          </button>

          {c.estado === "CERRADA" && (
            <button
              onClick={() => reabrirCaja(c.id)}
              className="p-1 cursor-pointer rounded-lg font-semibold bg-orange-500 text-white"
            >
              Reabrir
            </button>
          )}
        </div>
      ),
    },
  ];

  const estadoCajaOptions = [
    { value: "ABIERTA", label: "ABIERTA" },
    { value: "CERRADA", label: "CERRADA" },
    { value: "TODAS", label: "TODAS" },
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      {/* HEADER */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
          bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
          rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">

          <div>
            <h1 className="text-3xl md:text-4xl flex gap-2 font-bold text-white tracking-wide">
              <FaListUl />
              Cajas del Sistema
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Gestión de cajas del sistema
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">

          <SelectCustom
            options={estadoCajaOptions}
            value={filtroEstado}
            onChange={setFiltroEstado}
            className="w-full"
          />

          <input
            type="text"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            placeholder="Buscar usuario..."
            className="input w-full"
          />

          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="input w-full"
          />

          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="input w-full"
          />

          <button
            onClick={() => {
              setFiltroUsuario("");
              setFiltroEstado("ABIERTA");
              setFiltroDesde("");
              setFiltroHasta("");
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-3 font-semibold rounded-md"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <DataTable
              data={cajasFiltradas}
              columns={columns}
              initialSort={{ column: "id", direction: "descending" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}