// Cotizaciones.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import DataTable from "../components/DataTable";
import { RiFileSearchFill } from "react-icons/ri";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { useCotizacion } from "../context/CotizacionContext";
import usFlag from "../assets/flags/us.svg";
import pyFlag from "../assets/flags/py.svg";
import brFlag from "../assets/flags/br.svg";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

const BANDERAS = {
  USD: usFlag,
  PYG: pyFlag,
  BRL: brFlag,
};

export default function Cotizaciones() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("cotizaciones")
  useEffect(() => {
        if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [cotizaciones, setCotizaciones] = useState([]);
  const { mostrarModal, setMostrarModal } = useCotizacion();

// --- Obtener fecha actual en formato datetime-local ---
const ahoraT = () => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");
  const hours = String(ahora.getHours()).padStart(2, "0");
  const minutes = String(ahora.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const [fecha, setFecha] = useState(ahoraT());
const [formData, setFormData] = useState({
  USD_PYG: 0,
  USD_BRL: 0,
  BRL_PYG: 0,
  fecha: ahoraT(), // <-- sincronizado con el input
});

  // --- Cargar cotizaciones desde backend ---
  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/cambio/cambios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCotizaciones(
        res.data.map((c) => ({
          ...c,
          cambio: c.cambio ? Number(c.cambio) : 0,
          cambio_inverso: c.cambio ? 1 / Number(c.cambio) : 0,
        }))
      );
    } catch (err) {
      console.error("Error al cargar cotizaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  // --- Guardar cotizaciones desde modal ---
  const guardarCotizaciones = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const usdPyg = Number(formData.USD_PYG);
      const usdBrl = Number(formData.USD_BRL);
      const brlPyg = Number(formData.BRL_PYG);

      let cotizacionesAGuardar = [
        { moneda_origen: "USD", moneda_destino: "PYG", cambio: usdPyg },
        { moneda_origen: "USD", moneda_destino: "BRL", cambio: usdBrl },
        { moneda_origen: "BRL", moneda_destino: "PYG", cambio: brlPyg },
        // Inversas
        { moneda_origen: "PYG", moneda_destino: "USD", cambio: usdPyg ? 1 / usdPyg : null },
        { moneda_origen: "BRL", moneda_destino: "USD", cambio: usdBrl ? 1 / usdBrl : null },
        { moneda_origen: "PYG", moneda_destino: "BRL", cambio: brlPyg ? 1 / brlPyg : null },
        // Mismas monedas
        { moneda_origen: "USD", moneda_destino: "USD", cambio: 1 },
        { moneda_origen: "PYG", moneda_destino: "PYG", cambio: 1 },
        { moneda_origen: "BRL", moneda_destino: "BRL", cambio: 1 },
      ];

      cotizacionesAGuardar = cotizacionesAGuardar.filter(
        (c) => c.cambio && Number(c.cambio) > 0
      );

      if (cotizacionesAGuardar.length === 0) {
        alert("No hay cotizaciones válidas");
        return;
      }

      await axios.post(
        `${API}/api/cambio/actualizar`,
        { cotizaciones: cotizacionesAGuardar, fecha: formData.fecha },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Cotizaciones guardadas correctamente");
      setMostrarModal(false);
      cargarCotizaciones();
    } catch (err) {
      console.error(err);
      alert("Error al guardar cotizaciones");
    }
  };

  // --- Eliminar cotización ---
  const eliminarCotizacion = async (id) => {
    if (!window.confirm("¿Seguro que desea eliminar esta cotización?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/cambio/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarCotizaciones();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar cotización");
    }
  };


  const cotizacionesFilt = cotizaciones

  if (loading) return <Loader />;

  return (
    <>
      {/* Encabezado */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
              <RiFileSearchFill />
              Cotizaciones
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Visualice las cotizaciones actuales. Actualice usando el botón "Actualizar Cotizaciones".
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setMostrarModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Actualizar Cotizaciones
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de cotizaciones */}
      <div className="rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">
        <DataTable
          data={cotizacionesFilt}
          initialSort={{ column: "id", direction: "ascending" }}
          columns={[
            { header: "id", accessor: "id", sortable: true, align: "center" },
            {
              header: "Fecha",
              accessor: "fecha_inicio",
              sortable: true,
              cell: (row) => <span className="flex items-center justify-center gap-1">{formatearFecha(row.fecha_inicio)}</span>,
              align: "center",
            },
            {
              header: "Moneda Origen",
              accessor: "moneda_origen",
              sortable: true,
              cell: (row) => (
                <span className="flex items-center justify-center gap-1">
                  <img src={BANDERAS[row.moneda_origen]} alt={row.moneda_origen} className="w-5 h-5 rounded-full object-cover" />
                  {row.moneda_origen}
                </span>
              ),
              align: "center",
            },
            {
              header: "Moneda Destino",
              accessor: "moneda_destino",
              sortable: true,
              cell: (row) => (
                <span className="flex items-center justify-center gap-1">
                  <img src={BANDERAS[row.moneda_destino]} alt={row.moneda_destino} className="w-5 h-5 rounded-full object-cover" />
                  {row.moneda_destino}
                </span>
              ),
              align: "center",
            },
            {
              header: "Cotización",
              accessor: "cambio",
              sortable: true,
              cell: (row) => (formatearNumero(row.cambio, row.moneda_destino) ? formatearNumero(Number(row.cambio), row.moneda_destino) : "0.0000"),
              align: "end",
            },
            {
              header: "Acciones",
              accessor: "acciones",
              cell: (row) => (
                <button
                  onClick={() => eliminarCotizacion(row.id)}
                  disabled={!puede("eliminar_cambio")}
                  className="text-red-500 hover:text-red-700 font-semibold disabled:opacity-50 disabled:cursor-no-drop"
                >
                  Eliminar
                </button>
              ),
              align: "center",
            },
          ]}
        />
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Actualizar Cotizaciones</h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-500 hover:text-red-700 text-xl font-bold cursor-pointer"
              >
                x
              </button>
            </div>

            <form onSubmit={guardarCotizaciones} className="flex flex-col justify-center items-center gap-4">
              <label className="flex flex-col gap-2 w-full">
                <span className="text-gray-700 font-medium">Fecha</span>
                <input
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="input w-full"
                  required
                />
              </label>

              {/* Inputs de monedas */}
              {["USD_PYG", "USD_BRL", "BRL_PYG"].map((key) => (
                <label key={key} className="flex gap-2 w-full">
                  <span className="text-gray-700 font-medium flex items-center gap-1 w-1/3">
                    <img src={BANDERAS[key.split("_")[0]]} alt={key.split("_")[0]} className="w-15 h-10 rounded-sm object-cover" /> →
                    <img src={BANDERAS[key.split("_")[1]]} alt={key.split("_")[1]} className="w-15 h-10 rounded-sm object-cover" />
                  </span>
                  <input
                    type="number"
                    step={key === "USD_BRL" ? "0.0001" : "0.01"}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="input w-2/3"
                    required
                  />
                </label>
              ))}

              <div className="flex justify-end gap-3 pt-4 w-full">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-[#35b9ac] cursor-pointer to-[#2da89c] text-white"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}