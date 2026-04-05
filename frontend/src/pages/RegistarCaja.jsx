import { useState, useContext, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useCaja } from "../context/CajaContext";
import Loader from "../components/Loader";
import { AuthContext } from "../context/AuthContext";
import SelectCustom from "../components/SelectCustom";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { usePermiso } from "../hooks/usePermiso";

export default function RegistrarCaja() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("registrar_caja")
  useEffect(() => {
      if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const { usuario: usuarioLogueado, loading: authLoading } = useContext(AuthContext);
  const { obtenerCaja, caja } = useCaja();
  const [loading, setLoading] = useState(true);

  const [saldoInicial, setSaldoInicial] = useState(0);
  const [moneda, setMoneda] = useState("PYG");

  const toDateTimeLocal = (isoString) => {
    const fecha = new Date(isoString);
    const offset = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const getNowLocal = () => {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [fechaApertura, setFechaApertura] = useState(getNowLocal);


  useEffect(() => {
    const fetchCaja = async () => {
      try {
        setLoading(true);
        await obtenerCaja();
      } catch (error) {
        console.error("Error obteniendo caja:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCaja();
  }, []);

  // 🔹 Sincronizar estado con caja (ÚNICO punto de verdad)
  useEffect(() => {
    if (caja) {
      setSaldoInicial(caja.saldo_inicial);
      setMoneda(caja.moneda);

      if (caja.fecha_apertura) {
        setFechaApertura(toDateTimeLocal(caja.fecha_apertura));
      }
    } else {
      // No hay caja → fecha actual
      setFechaApertura(getNowLocal());
      setSaldoInicial(0);
      setMoneda("PYG");
    }
  }, [caja]);

  const abrirCaja = async (e) => {
    e.preventDefault();
    if (saldoInicial === "" || isNaN(saldoInicial)) {
      Swal.fire({ icon: "error", title: "Error", text: "Debes ingresar un saldo inicial válido", background: "#121926", color: "white" });
      return;
    }
    if (caja) {
      Swal.fire({ icon: "info", title: "Atención", text: "Ya tienes una caja abierta. Cierra la caja actual para abrir una nueva.", background: "#121926", color: "white" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/api/caja/abrir`,
        { saldo_inicial: Number(saldoInicial), moneda, fecha_apertura: fechaApertura },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "Caja abierta",
        text: `Caja #${res.data.caja.id} abierta correctamente`,
        background: "#121926",
        color: "white",
        timer: 1500,
        showConfirmButton: false,
      });

      setSaldoInicial(0);
      setFechaApertura(new Date().toISOString().slice(0, 16));
      await obtenerCaja();
    } catch (error) {
      console.error("Error al abrir caja:", error);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo abrir la caja", background: "#121926", color: "white" });
    } finally {
      setLoading(false);
    }
  };

  const actualizarCaja = async () => {
    if (!caja) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API}/api/caja/actualizar/${caja.id}`,
        { fecha_apertura: fechaApertura, moneda },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: "success", title: "Caja actualizada", text: `Caja #${res.data.caja.id} actualizada correctamente`, background: "#121926", color: "white", timer: 1500, showConfirmButton: false });
      await obtenerCaja();
    } catch (error) {
      console.error("Error actualizando caja:", error);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar la caja", background: "#121926", color: "white" });
    } finally {
      setLoading(false);
    }
  };
  

  const handleCerrarCaja = async (caja) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/api/caja/cerrar/${caja.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({ title: "Caja cerrada correctamente", icon: "success", background: "#1f2937", color: "white" });

      await obtenerCaja();
      setSaldoInicial(0);
      setMoneda("PYG");
      setFechaApertura(new Date().toISOString().slice(0, 16));
    } catch (error) {
      console.error("Error cerrando caja:", error);
      Swal.fire({ title: "Error al cerrar la caja", text: error.response?.data?.error || error.message, icon: "error", background: "#1f2937", color: "white" });
    }
  };

  if (loading || authLoading) return <Loader />;

  const esCajaAbierta = caja && caja.estado === "ABIERTA";

  return (
    <>
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
              <FaPlus />
              Registrar Caja
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {esCajaAbierta ? "Visualiza la caja abierta y realiza operaciones" : "Registre un caja para realizar movimientos financieros"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={abrirCaja} className="rounded-md bg-white shadow-sm p-8 w-full flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-2">
          <label className="flex flex-col w-full  md:w-1/3 text-gray-600">
            ID Caja
            <input
              type="text"
              value={caja?.id ?? ""}
              readOnly
              className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
            />
          </label>

          <label className="flex flex-col w-full md:w-1/3 text-gray-600">
            Usuario
            <input
              type="text"
              value={usuarioLogueado?.nombre ?? ""}
              readOnly
              className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
            />
          </label>

          <label className="flex flex-col w-full md:w-1/3 text-gray-600">
            Estado
            <input
              type="text"
              value={caja?.estado ?? ""}
              readOnly
              className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
            />
          </label>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-2">
          <label className="flex flex-col w-full md:w-1/3 text-gray-600">
            Apertura
            <input
              type="datetime-local"
              disabled={!puede("alterar_fecha_caja")}
              value={fechaApertura}
              onChange={(e) => setFechaApertura(e.target.value)}
              className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
            />
          </label>

          <label className="flex flex-col w-full md:w-1/3 text-gray-600">
            Saldo Inicial
            <input
              type="number"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              readOnly={esCajaAbierta}
              disabled={!puede("puede_alterar_valor_inicial_caja")}
              placeholder="Ingrese el saldo inicial"
              className="bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] hover:border-[#35b9ac]/80 outline-none
                         shadow-inner transition-colors duration-300 font-bold text-sm placeholder:text-gray-400"
              min="0"
              step="0.01"
            />
          </label>

          <label className="flex flex-col w-full md:w-1/3 text-gray-600">
            Moneda
            <SelectCustom
              options={[
                { value: "PYG", label: "PYG" },
                { value: "USD", label: "USD" },
                { value: "BRL", label: "BRL" },
              ]}
              value={moneda}
              onChange={(e) => setMoneda(e)}
              className="text-black w-full"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row justify-start sm:justify-around items-center gap-4 flex-wrap">
          <button
            type="submit"
            className="flex justify-center items-center gap-2 p-4 cursor-pointer rounded-md
                         bg-gradient-to-r outline-none from-[#35b9ac] to-[#2da89c] text-white 
                         hover:brightness-105 shadow-md transition-all text-sm font-medium w-full sm:w-auto"
          >
            Abrir Caja
          </button>
          <button
            type="button"
            onClick={() => actualizarCaja()}
            disabled={!esCajaAbierta}
            className="flex justify-center outline-none items-center gap-2 p-4 cursor-pointer rounded-md
                           bg-gradient-to-r from-yellow-500 to-yellow-600 text-white disabled:bg-yellow-400 disabled:cursor-not-allowed
                           hover:brightness-105 shadow-md transition-all text-sm font-medium w-full sm:w-auto"
          >
            Actualizar de Caja
          </button>
          <button
            type="button"
            onClick={() => handleCerrarCaja(caja)}
            disabled={!esCajaAbierta}
            className="flex justify-center outline-none items-center gap-2 p-4 cursor-pointer rounded-md
                           bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white disabled:bg-red-400 disabled:cursor-not-allowed
                           hover:brightness-105 shadow-md transition-all text-sm font-medium w-full sm:w-auto"
          >
            Cerrar Sesión de Caja <span className="text-xs italic">(Caja #{caja?.id ?? ""})</span>
          </button>
        </div>
      </form>

      {!caja && (
        <div className="bg-red-400 mt-2 rounded-md p-6 text-white text-center">
          <h1 className="font-bold text-2xl">
            No puedes realizar movimientos financieros sin un caja registrada!!
          </h1>
          <p className="italic">Registre un caja para continuar</p>
          <div className="mt-2 bg-red-300 p-2 rounded-md">
            <p>Si ya tienes una caja registrada, por favor inicia sesión.</p>
            <button
              onClick={() => navigate("/cajas/informe")}
              className="bg-white outline-none m-2 cursor-pointer text-red-500 hover:bg-gray-200 py-2 px-4 rounded-lg transition-colors"
            >
              Ir a Cajas
            </button>
          </div>
        </div>
      )}
    </>
  );
}