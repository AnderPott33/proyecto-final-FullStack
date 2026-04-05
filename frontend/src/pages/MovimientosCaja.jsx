import { useCaja } from "../context/CajaContext";
import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import axios, { isCancel } from "axios";
import Swal from "sweetalert2";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { FaTrash, FaLock } from "react-icons/fa";
import DataTable from "../components/DataTable";
import SelectCustom from "../components/SelectCustom";
import { FaMoneyBillWheat } from "react-icons/fa6";
import { usePermiso } from "../hooks/usePermiso";

export default function MovimientosCaja() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("movimientos_caja")
    useEffect(() => {
          if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const { caja, loading, obtenerCaja } = useCaja();
    const [cuentasList, setCuentasList] = useState([]);
    const [cuentaSelect, setCuentaSelect] = useState();

    const [formaPago, setFormaPago] = useState([]);
    const [formaPagoId, setFormaPagoId] = useState('EFECTIVO');

    const [cargandoMov, setCargandoMov] = useState(true);
    const [listaMovimientos, setListaMovimientos] = useState([]);

    useEffect(() => {
        if (caja) {
            obtenerMovimientos();
        }
    }, [caja]);

    // 🔹 Obtener formas de pago
    const encontformaPago = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API}/api/formaPago`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data || [];
        } catch (error) {
            console.error("No se encontraron formas de pagos:", error);
            return [];
        }
    };

    useEffect(() => {
        const fetchFormas = async () => {
            const data = await encontformaPago();
            setFormaPago(data || []);
        };
        fetchFormas();
    }, []);

    // 🔹 Obtener cuentas según forma de pago
    const obtenerCuentas = async () => {
        if (!formaPagoId) return [];
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API}/api/cuenta/formaPago2`,
                { nombre: formaPagoId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return Array.isArray(res.data) ? res.data.flat() : [];
        } catch (error) {
            console.error("No se encontró la cuenta:", error);
            return [];
        }
    };

    // 🔹 Actualizar cuentasList y cuentaSelect al cambiar formaPagoId
    useEffect(() => {
        if (!formaPagoId) {
            setCuentasList([]);
            setCuentaSelect(undefined);
            return;
        }

        const fetchCuentas = async () => {
            const data = await obtenerCuentas();
            setCuentasList(data || []);
            setCuentaSelect(data?.[0]?.id || undefined); // seleccionar la primera cuenta por defecto
        };

        fetchCuentas();
    }, [formaPagoId]);

    // 🔹 Obtener movimientos
    const obtenerMovimientos = async () => {
        if (!caja?.id) return;

        try {
            setCargandoMov(true);
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API}/api/caja/registros/`, {
                params: { caja: caja.id, formaPago: formaPagoId },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (Array.isArray(res.data.movimientos)) {
                setListaMovimientos(res.data.movimientos);
            } else {
                setListaMovimientos([]);
                console.error("Formato inesperado:", res.data);
            }
        } catch (error) {
            console.error("Error al obtener Movimientos:", error);
            setListaMovimientos([]);
        } finally {
            setCargandoMov(false);
        }
    };

    useEffect(() => {
        if (!caja?.id) return;
        obtenerMovimientos();
    }, [caja?.id, formaPagoId]);

    // 🔹 Calcular saldo actual
    const calcularSaldoActual = () => {
        let saldo = 0;
        listaMovimientos.forEach((m) => {
            if (m.tipo === "INGRESO") saldo += Number(m.ingreso || 0);
            else if (m.tipo === "SALIDA") saldo -= Number(m.salida || 0);
        });
        return saldo;
    };

    // 🔹 Cerrar caja con modal
  const cerrarCaja = async () => {
    setCargandoMov(true);
    if (!caja) return;

    const saldoActual = calcularSaldoActual();

    // Obtener cuentas según forma de pago
    const cuentas = await obtenerCuentas();
    const opcionesCajas = cuentas.map(c => ({ value: c.id, label: c.nombre }));

    const { value: resultado } = await Swal.fire({
        title: `Cerrar Caja`,
        html: `
            <p style="color:white; margin-bottom:10px;">
                Saldo actual: <b>${formatearNumero(saldoActual, caja.moneda)}</b>
            </p>

            <input 
                id="swal-input-fecha" 
                type="datetime-local" 
                value="${new Date().toISOString().slice(0,16)}"
                style="width:60%; padding:10px; border-radius:8px; border:1px solid #555; background:#1a1f3a; color:white; margin-bottom:15px;" 
            />

            <input 
                id="swal-input1" 
                type="number" 
                value="${saldoActual}" 
                step="0.01"
                style="width:60%; padding:10px; border-radius:8px; border:1px solid #555; background:#1a1f3a; color:white; margin-bottom:15px;" 
            />

            <div style="margin-bottom:10px;">
                <label style="color:white; display:block; margin-bottom:5px;">Seleccionar Cuenta:</label>
                <select id="swal-select-cuenta" style="width:60%; padding:10px; border-radius:8px; border:1px solid #555; background:#1a1f3a; color:white;">
                    ${opcionesCajas.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                </select>
            </div>

            <div style="display:flex; gap:20px; justify-content:center; color:white; margin-bottom:10px;">
                <div style="background: green; padding:10px; border-radius: 1.5em; cursor:pointer">
                    <label style="display:flex; align-items:center; gap:5px">
                        <input type="radio" name="tipo" value="INGRESO" checked style="accent-color:green; cursor:pointer;"> 
                        Ingreso
                    </label>
                </div>
                <div style="background: red; padding:10px; border-radius: 1.5em; cursor:pointer">
                    <label style="display:flex; align-items:center; gap:5px;">
                        <input type="radio" name="tipo" value="SALIDA" style="accent-color:#ef4444; cursor:pointer;"> 
                        Salida
                    </label>
                </div>
            </div>

            <div style="display:flex; align-items:center; gap:10px; justify-content:center; color:white;">
                <label>
                    <input type="checkbox" id="swal-cerrar" style="accent-color:#f59e0b;" />
                    Cerrar?
                </label>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Procesar",
        cancelButtonText: "Cancelar",
        background: "#121926",
        color: "white",
        preConfirm: () => {
            const fechaAjuste = document.getElementById("swal-input-fecha").value;
            const inputRaw = document.getElementById("swal-input1").value.trim();
            const cuentaSelec = document.getElementById("swal-select-cuenta").value;
            const tipoRadios = document.getElementsByName("tipo");
            const cerrar = document.getElementById("swal-cerrar").checked;

            setCuentaSelect(cuentaSelec);

            const tipoSeleccionado =
                Array.from(tipoRadios).find(r => r.checked)?.value || "INGRESO";

            if (inputRaw === "" || isNaN(inputRaw)) {
                Swal.showValidationMessage("Debes ingresar un valor válido");
                return false;
            }

            if (!cuentaSelec) {
                Swal.showValidationMessage("Debes seleccionar una cuenta");
                return false;
            }

            if (!fechaAjuste) {
                Swal.showValidationMessage("Debes seleccionar una fecha");
                return false;
            }

            return {
                saldo: Number(inputRaw),
                tipo: tipoSeleccionado,
                cuenta: cuentaSelec,
                cerrar,
                fecha: fechaAjuste
            };
        },
    });

    if (!resultado) {
        setCargandoMov(false);
        return;
    }

    const { saldo, tipo, cuenta, cerrar, fecha } = resultado;

    try {
        const token = localStorage.getItem("token");

        await axios.post(
            `${API}/api/caja/registrarMovimiento`,
            {
                caja_id: caja.id,
                tipo: tipo,
                descripcion: 'DEPOSITO POR MODULO CAJA',
                forma_pago: formaPagoId,
                monto: saldo,
                moneda: caja.moneda,
                cuenta: cuenta,
                saldoActual: saldoActual - saldo,
                cerrar: cerrar,
                fecha // 🔹 enviar la fecha al backend
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
            icon: "success",
            title: "Operación exitosa",
            text: `Caja ${cerrar ? "cerrada" : "actualizada"} correctamente`,
            timer: 1500,
            showConfirmButton: false,
            background: "#121926",
            color: "white"
        });

        await obtenerCaja();
        await obtenerMovimientos();

    } catch (error) {
        console.error("Error completo:", error);

        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "No se pudo procesar la operación",
            background: "#121926",
            color: "white"
        });
    }

    setCargandoMov(false);
};

    useEffect(() => {
        setTimeout(() => {
            setCargandoMov(false);
        }, 500);
    }, [])

    if (loading || cargandoMov) return <Loader />;

return (
    <>
        {/* HEADER */}
        <div className="mb-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                            bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
                            rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">

                <div>
                    <h1 className="text-2xl md:text-4xl flex gap-2 font-bold text-white tracking-wide">
                        <FaMoneyBillWheat />
                        Movimientos Caja
                    </h1>
                    <p className="text-white/80 text-sm mt-1">
                        Revise los movimientos en Caja
                    </p>
                </div>

            </div>
        </div>

        {/* CONTROLES */}
        {caja && caja.estado === "ABIERTA" && (
            <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto] gap-4 items-center w-full">

                    <div className="w-full h-[52px]">
                        <SelectCustom
                            options={
                                formaPago?.filter(t => t.sub_tipo == 'EFECTIVO' || t.sub_tipo == 'BANCO')
                                    .map(f => ({ value: f.nombre, label: f.nombre })) || []
                            }
                            value={formaPagoId}
                            onChange={setFormaPagoId}
                        />
                    </div>

                  {puede("realizar_movimientos_caja") &&  <button
                        onClick={cerrarCaja}
                        className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 
                                   h-[52px] cursor-pointer rounded-md
                                   bg-gradient-to-r from-yellow-400 to-yellow-600 
                                   text-white font-semibold 
                                   hover:brightness-105 shadow-md transition-all text-sm"
                    >
                        <FaLock /> Realizar Movimiento
                    </button>}

                </div>
            </div>
        )}

        {/* TABLA */}
        <div className="rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">

          
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[900px]">
                        <DataTable
                            data={listaMovimientos}
                            columns={[
                                { accessor: "ref_financiero", header: "ID" },
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
                                    accessor: "ingreso",
                                    header: "Ingreso",
                                    className: "text-end font-semibold text-green-500",
                                    align: 'end',
                                    cell: (row) => formatearNumero(row.ingreso, row.moneda),
                                },
                                {
                                    accessor: "salida",
                                    header: "Salida",
                                    className: "text-end font-semibold text-red-500",
                                    align: 'end',
                                    cell: (row) => formatearNumero(row.salida, row.moneda),
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

        </div>
    </>
);
}