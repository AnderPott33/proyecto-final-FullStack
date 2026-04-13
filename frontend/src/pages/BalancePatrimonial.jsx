
import ImpresionBalance from '../impresion/ImpresionBalance'
import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import Swal from "sweetalert2";
import axios from "axios";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { Cell } from "jspdf-autotable";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";
import { FaBalanceScale } from "react-icons/fa";

export default function BalancePatrimonial() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const { puedeAcceder, puede } = usePermiso();
  const [balance, setBalance] = useState([]);
  const tienePermiso = puedeAcceder("balance")
  useEffect(() => {
    if (!tienePermiso) { navigate("/error-permiso"); }
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState();
  const [cuentas, setCuentas] = useState([]);
  const getPrimerDiaAnio = () => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  };

  const getHoy = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  const [fechaInicio, setFechaInicio] = useState(getPrimerDiaAnio());
  const [fechaFin, setFechaFin] = useState(getHoy());
  const [moneda, setMoneda] = useState("PYG");
  const [estado, setEstado] = useState("");

  // --- Obtener saldos desde backend ---
  const obtenerSaldos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/cuenta/balance`,
        { fecha_inicio: fechaInicio, fecha_fin: fechaFin, moneda }, // si tu endpoint POST no requiere body, envía un objeto vacío
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBalance(res.data);


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
  }, [moneda]);

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
              <FaBalanceScale />
              Balance Patrimonial
            </h1>
            <p className="text-white/80 text-sm mt-1">Visualización de saldos actuales</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols- lg:grid-cols-5 gap-4 w-full">
          <input
            type="date"
            placeholder="Fecha Inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="input"
          />
          <input
            type="date"
            placeholder="Fecha Fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="input"
          />
          <div>
            <SelectCustom
              options={[
                { value: 'PYG', label: "PYG" },
                { value: 'USD', label: "USD" },
                { value: 'BRL', label: "BRL" },
              ]}
              value={moneda}
              onChange={m => setMoneda(m)}
            />
          </div>

          <button
            onClick={() => {
              obtenerSaldos()
            }}
            className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-3 py-2  w-full rounded-md font-semibold transition-all"
          >
            Filtrar
          </button>
          <button
            onClick={() => {
              ImpresionBalance(balance)
            }}
            className="bg-[#35b9ac] hover:bg-[#35b9ac]/80 cursor-pointer text-white px-3 py-2  w-full rounded-md font-semibold transition-all"
          >
            Imprimir
          </button>
        </div>
      </div>


      {/* Tabla de saldos */}
      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            data={cuentas}
            pageSizeOptions={[25, 50, 100, 250]}
            initialPageSize={50}
            initialSort={{ column: "codigo", direction: "ascending" }}
            columns={[
              { header: "ID", accessor: "cuenta_id" },
              {
                header: "Código",
                accessor: "codigo",
                cell: e => (
                  // Enfatizamos el código con una fuente monoespaciada para que los números alineen siempre
                  <span style={{ fontFamily: 'monospace', fontWeight: e.tipo_contable === 'SINTÉTICA' ? 'bold' : 'normal', color: '#4b5563' }}>
                    {e.codigo}
                  </span>
                )
              },
              {
                header: "Cuenta",
                accessor: "cuenta",
                cell: e => {
                  // Calculamos el nivel basado en los puntos del código (ej: 1.1.001 -> nivel 2)
                  const nivel = (e.codigo.match(/\./g) || []).length;
                  const esSintetica = e.tipo_contable === 'SINTÉTICA';

                  return (
                    <div style={{
                      paddingLeft: `${nivel * 16}px`, // Sangría dinámica
                      fontWeight: esSintetica ? '800' : '400', // Negrita extra para sintéticas
                      textTransform: esSintetica ? 'uppercase' : 'none', // Mayúsculas para resaltar jerarquía
                      fontSize: esSintetica ? '0.9rem' : '0.85rem'
                    }}>
                      {e.cuenta}
                    </div>
                  );
                }
              },
              { header: "Moneda", accessor: "moneda" },
              {
                header: "Saldo Anterior",
                accessor: "saldo_anterior",
                align: "end",
                cell: e => (
                  <span style={{ fontWeight: e.tipo_contable === 'SINTÉTICA' ? 'bold' : 'normal' }}>
                    {formatearNumero(e.saldo_anterior, moneda)}
                  </span>
                )
              },
              {
                header: "Débito",
                accessor: "total_debito",
                align: "end",
                cell: e => formatearNumero(e.total_debito, moneda)
              },
              {
                header: "Crédito",
                accessor: "total_credito",
                align: "end",
                cell: e => formatearNumero(e.total_credito, moneda)
              },
              {
                header: "Saldo",
                accessor: "saldo_actual",
                align: "end",
                cell: e => (
                  <span style={{
                    fontWeight: e.tipo_contable === 'SINTÉTICA' ? 'bold' : 'normal',
                    color: parseFloat(e.saldo_actual) < 0 ? 'green' : 'inherit' // Rojo si es negativo
                  }}>
                    {formatearNumero(e.saldo_actual, moneda)}
                  </span>
                )
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}