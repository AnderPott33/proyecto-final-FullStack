import { useCaja } from "../context/CajaContext";
import { useState, useEffect, useContext } from "react";
import Loader from "../components/Loader";
import axios from "axios";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import DataTable from "../components/DataTable";
import { FaMoneyBillWheat } from "react-icons/fa6";
import SelectCustom from "../components/SelectCustom";
import { AuthContext } from "../context/AuthContext";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from 'react-router-dom'
import  imprimirMovimiento  from '../impresion/ImpresionMovimientos'

export default function MovimientosFinancieros() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const { puedeAcceder, puede } = usePermiso();
    const tienePermiso = puedeAcceder("movimientos_financieros")
    useEffect(() => {
        if (!tienePermiso) { navigate("/error-permiso"); }
    }, [navigate, tienePermiso])
    if (!tienePermiso) return null;
    const { puntosUsuario, puntoSeleccionado, seleccionarPunto } = useContext(AuthContext);
    const [puntosIds, setPuntosIds] = useState([]);

    useEffect(() => {
        if (puntosUsuario && puntosUsuario.length > 0) {
            const ids = puntosUsuario.map((pu) => pu.id);
            setPuntosIds(ids);
        } else {
            setPuntosIds([]); // limpiar si no hay puntos
        }
    }, [puntosUsuario]);


    const { caja, loading } = useCaja();

    const [listaMovimientos, setListaMovimientos] = useState([]);
    const [cargandoMov, setCargandoMov] = useState(true);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [movSeleccionado, setMovSeleccionado] = useState(null);
    const [movimiento, setMovimiento] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    // 🔹 Filtros
    const [filtroId, setFiltroId] = useState("");
    const [filtroUsuario, setFiltroUsuario] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
    const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

    const [modalMotivoOpen, setModalMotivoOpen] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [modoMotivo, setModoMotivo] = useState("EDIT");

    const handleInactivar = (mov) => {
        if (mov.estado === "ACTIVO") {
            setModoMotivo("EDIT");
            setMotivo("");
        } else {
            setModoMotivo("VIEW");
            setMotivo(mov.motivo_inac || "Sin motivo registrado");
        }

        setMovimiento(mov);
        setModalMotivoOpen(true);
    };

    const guardarInactivacion = async () => {
        try {
            const token = localStorage.getItem("token");

            await axios.put(
                `${API}/api/movimientos/inactivar/${movimiento.id}`,
                { motivo },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 🔹 Cerrar modal motivo
            setModalMotivoOpen(false);

            // 🔹 Refrescar lista
            await obtenerMovimientos();

            // 🔹 Refrescar detalle (FORZADO)
            setMovSeleccionado(null);
            setTimeout(() => {
                setMovSeleccionado(movimiento.id);
            }, 100);

            // 🔥 SWAL SOLO AQUÍ (después de inactivar)
            Swal.fire({
                title: "Movimiento inactivado",
                text: "El movimiento fue inactivado correctamente",
                icon: "success",
                confirmButtonColor: "#ef4444",
                background: "#1f2937",
                color: "#fff",
            });

        } catch (error) {
            console.error("Error al inactivar:", error);

            Swal.fire({
                title: "Error",
                text: "No se pudo inactivar el movimiento",
                icon: "error",
                confirmButtonColor: "#ef4444",
                background: "#1f2937",
                color: "#fff",
            });
        }
    };

    // 🔹 Obtener movimientos
    const obtenerMovimientos = async () => {
        try {
            setCargandoMov(true);
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API}/api/movimientos/`, {
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
        obtenerMovimientos();
    }, []);

    // 🔹 Obtener detalle de un movimiento cuando se selecciona
    useEffect(() => {
        if (!movSeleccionado) return;

        const obtenerDetalleMovimiento = async () => {
            try {
                setLoadingDetalle(true);
                const token = localStorage.getItem("token");

                const res = await axios.get(
                    `${API}/api/movimientos/${movSeleccionado}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setMovimiento(res.data.movimiento);
            } catch (error) {
                console.error("Error al obtener movimiento completo:", error);
                setMovimiento(null);
            } finally {
                setLoadingDetalle(false);
            }
        };

        obtenerDetalleMovimiento();
    }, [movSeleccionado]);

    if (loading || cargandoMov) return <Loader />;



    // 🔹 Aplicar filtros localmente
    // Para fecha desde → 00:00:00
    const fechaDesde = filtroFechaDesde ? new Date(filtroFechaDesde + "T00:00:00") : null;

    // Para fecha hasta → 23:59:59
    const fechaHasta = filtroFechaHasta ? new Date(filtroFechaHasta + "T23:59:59") : null;

    const movimientosFiltrados = listaMovimientos.filter((m) => {
        const cumplePuntos = puntosIds.length > 0 ? puntosIds.includes(m.punto_id) : true;

        const cumpleId = filtroId ? String(m.movimiento_id).includes(filtroId) : true;
        const cumpleUsuario = filtroUsuario ? m.usuario.toLowerCase().includes(filtroUsuario.toLowerCase()) : true;
        const cumpleEstado = filtroEstado ? m.estado.toLowerCase() === filtroEstado.toLowerCase() : true;

        const fechaMovimiento = new Date(m.fecha);

        const cumpleFechaDesde = fechaDesde ? fechaMovimiento >= fechaDesde : true;
        const cumpleFechaHasta = fechaHasta ? fechaMovimiento <= fechaHasta : true;

        return cumplePuntos && cumpleId && cumpleUsuario && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta;
    });


    return (
        <>
            {/* Header */}
            <div className="mb-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
                            <FaMoneyBillWheat />
                            Movimientos Financieros
                        </h1>
                        <p className="text-white/80 text-sm mt-1">
                            Revise los movimientos en financiero.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
                <input
                    type="text"
                    placeholder="Filtrar por ID"
                    value={filtroId}
                    onChange={(e) => setFiltroId(e.target.value)}
                    className="input w-full"
                />
                <input
                    type="text"
                    placeholder="Filtrar por Usuario"
                    value={filtroUsuario}
                    onChange={(e) => setFiltroUsuario(e.target.value)}
                    className="input w-full"
                />
                <div className="w-50 w-full">
                    <SelectCustom
                        options={[
                            { value: "", label: "Todos" },
                            { value: "ACTIVO", label: "ACTIVO" },
                            { value: "INACTIVO", label: "INACTIVO" },
                        ]}
                        value={filtroEstado}
                        onChange={setFiltroEstado}
                    />

                </div>
                <input
                    type="date"
                    placeholder="Desde"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    className="input w-full"
                />
                <input
                    type="date"
                    placeholder="Hasta"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    className="input w-full"
                />
                <button
                    onClick={() => {
                        setFiltroId("");
                        setFiltroUsuario("");
                        setFiltroEstado("");
                        setFiltroFechaDesde("");
                        setFiltroFechaHasta("");
                    }}
                    className="bg-red-500 w-full hover:bg-red-600 text-white px-3 py-3 font-semibold rounded-md cursor-pointer transition-all"
                >
                    Limpiar filtros
                </button>
            </div>

            {/* Tabla */}
            <div className="rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">

                <DataTable
                    data={movimientosFiltrados}
                    initialPageSize={15}
                    pageSizeOptions={[10, 15, 25, 50]}
                    columns={[
                        { accessor: "movimiento_id", header: "ID", sortable: true },
                        { accessor: "usuario", header: "Usuario", className: "text-center", sortable: true },
                        { accessor: "punto_exp", header: "Punto Exp", align: "center", sortable: true },
                        {
                            accessor: "fecha",
                            header: "Fecha",
                            className: "text-center",
                            cell: (row) => formatearFecha(row.fecha),
                            sortable: true,
                            sortType: "date",
                        },
                        { accessor: "movimiento_descripcion", header: "Descripción", sortable: true },
                        { accessor: "moneda_principal", header: "Moneda", className: "text-center", sortable: true },
                        {
                            accessor: "estado",
                            header: "Estado",
                            align: "center",
                            sortable: true,
                            cell: (row) => (
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium
                                        ${row.estado === "ACTIVO" && "bg-green-100 text-green-700"}
                                        ${row.estado === "INACTIVO" && "bg-red-100 text-red-700"}`}
                                >
                                    {row.estado}
                                </span>
                            ),
                        },
                        {
                            accessor: "total_monto",
                            header: "Valor",
                            className: "text-end font-semibold",
                            align: "end",
                            cell: (row) => (
                                <span
                                    className={
                                        row.total_monto > 0 ? "text-blue-500 font-bold" : "text-red-500"
                                    }
                                >
                                    {formatearNumero(row.total_monto, row.moneda_principal)}
                                </span>
                            ),
                        },
                        {
                            accessor: "acciones",
                            header: "",
                            className: "text-center",
                            cell: (row) => (
                                <button
                                    onClick={() => {
                                        setMovSeleccionado(row.movimiento_id);
                                        setModalOpen(true);
                                    }}
                                    className="bg-[#3ba0b4] hover:bg-[#359bac] cursor-pointer text-white px-2 py-1 rounded text-sm"
                                >
                                    Ver
                                </button>
                            ),
                        },
                    ]}
                />

            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-[1500px] rounded-md shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Visualizar Movimiento</h2>
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setMovimiento(null);
                                    setMovSeleccionado(null);
                                }}
                                className="text-gray-500 hover:text-red-700 mr-3 text-xl font-bold cursor-pointer"
                            >
                                x
                            </button>
                        </div>

                        {loadingDetalle ? (
                            <p>Cargando...</p>
                        ) : !movimiento ? (
                            <p>No se encontró el movimiento</p>
                        ) : (
                            <>
                                {/* Encabezado */}
                                <div className="bg-[#f0f9fa] rounded-md p-4 mb-2 shadow-inner border border-gray-200">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                        {/* Izquierda: Info principal */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 px-2 text-xs uppercase">ID</span>
                                                <span className="text-gray-800 px-2 bg-blue-500 rounded-md text-white font-semibold">{movimiento.id}</span>
                                            </div>
                                            <div className="flex justify-end mt-4 gap-2">
                                                <button
                                                    onClick={() => imprimirMovimiento(movimiento)}
                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md"
                                                >
                                                    Imprimir Movimiento
                                                </button>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase">Fecha</span>
                                                <span className="text-gray-800 font-semibold">{formatearFecha(movimiento.fecha)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase">Usuario</span>
                                                <span className="text-gray-800 font-semibold">{movimiento.usuario_nombre}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase">Referencia</span>
                                                <span className="text-gray-800 font-semibold">{movimiento.referencia || "-"}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase">Moneda Base</span>
                                                <span className="text-gray-800 font-semibold">{movimiento.moneda_principal}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase">Tipo</span>
                                                <span className={`text-gray-800 font-semibold rounded-md px-2 ${movimiento.tipo_operacion === "INGRESO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {movimiento.tipo_operacion}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase">Punto Exp</span>
                                                <span className={`text-purple-800 font-semibold rounded-md px-2 bg-purple-100 text-purple-700"`}>
                                                    {movimiento.punto_exp}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Derecha: Estado */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 text-xs uppercase">Estado</span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${movimiento.estado === "ACTIVO"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {movimiento.estado}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="mt-4 border-t border-gray-200 pt-3">
                                        <span className="text-gray-500 text-xs uppercase">Descripción</span>
                                        <p className="text-gray-800 mt-1">{movimiento.descripcion}</p>
                                    </div>
                                </div>

                                {/* Tabla Detalle */}
                                <div className="w-full overflow-x-auto rounded-md shadow-md border border-gray-100">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-[#359bac] text-white uppercase text-xs tracking-wide">
                                            <tr>
                                                <th className="px-4 py-2">Cuenta</th>
                                                <th className="px-4 py-2">Forma Pago</th>
                                                <th className="px-4 py-2">Tipo Doc</th>
                                                <th className="px-4 py-2">Documento</th>
                                                <th className="px-4 py-2">Entidad</th>
                                                <th className="px-4 py-2">Descripción</th>
                                                <th className="px-4 py-2">Moneda</th>
                                                <th className="px-4 py-2 text-right">Cambio</th>
                                                <th className="px-4 py-2 text-right">Débito</th>
                                                <th className="px-4 py-2 text-right">Crédito</th>
                                                <th className="px-4 py-2 text-right">Monto Cuenta</th>
                                            </tr>
                                        </thead>

                                        <tbody className="bg-white">
                                            {movimiento.detalles.map((d, i) => (
                                                <tr
                                                    key={d.id}
                                                    className={`border-b border-gray-100 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                        } hover:bg-[#359bac]/10`}
                                                >
                                                    <td className="px-4 py-2">{d.cuenta_nombre || d.cuenta_id}</td>

                                                    <td className="px-4 py-2">{d.forma_pago || "-"}</td>
                                                    <td className="px-4 py-2">{d.tp_doc || "-"}</td>
                                                    <td className="px-4 py-2">{d.documento || "-"}</td>
                                                    <td className="px-4 py-2">{d.entidad || "-"}</td>
                                                    <td className="px-4 py-2">{d.descripcion || "-"}</td>
                                                    <td className="px-4 py-2 text-center">{movimiento.moneda_principal}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        {d.cambio != null && d.cambio !== ""
                                                            ? Number(d.cambio).toFixed(6)
                                                            : "-"}
                                                    </td>
                                                    {/* Débito / Crédito */}
                                                    <td className="px-4 py-2 text-right font-semibold text-green-600">
                                                        {d.tipo === "DÉBITO" ? formatearNumero(d.monto, movimiento.moneda_principal) : "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold text-red-600">
                                                        {d.tipo === "CRÉDITO" ? formatearNumero(d.monto, movimiento.moneda_principal) : "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">{formatearNumero(d.monto_moneda_cuenta, d.moneda)}</td>
                                                </tr>
                                            ))}
                                        </tbody>

                                        {/* FOOTER CON TOTALES */}
                                        <tfoot className="bg-gray-50 text-gray-700 font-semibold border-t">
                                            <tr>

                                                <td className="px-4 py-2 text-right">

                                                </td>
                                                <td colSpan={5}></td>
                                                <td className="px-4 py-2 text-right" colSpan={2}>Totales:</td>
                                                <td className="px-4 py-2 text-right text-green-600">
                                                    {formatearNumero(
                                                        movimiento.detalles
                                                            .filter(d => d.tipo.toUpperCase() === "DÉBITO")
                                                            .reduce((sum, d) => sum + Number(d.monto || 0), 0),
                                                        movimiento.moneda_principal
                                                    )}
                                                </td>

                                                <td className="px-4 py-2 text-right text-red-600">
                                                    {formatearNumero(
                                                        movimiento.detalles
                                                            .filter(d => d.tipo.toUpperCase() === "CRÉDITO")
                                                            .reduce((sum, d) => sum + Number(d.monto || 0), 0),
                                                        movimiento.moneda_principal
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">-</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                        {modalMotivoOpen && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="bg-white w-full max-w-md rounded-md shadow-xl p-6">

                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">
                                            {modoMotivo === "EDIT" ? "Motivo de Inactivación" : "Motivo Registrado"}
                                        </h2>
                                        <button
                                            onClick={() => setModalMotivoOpen(false)}
                                            className="text-gray-500 hover:text-red-600 cursor-pointer"
                                        >
                                            x
                                        </button>
                                    </div>

                                    <textarea
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        disabled={modoMotivo === "VIEW"}
                                        placeholder="Ingrese el motivo..."
                                        className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:border-[#35b9ac]"
                                        rows={4}
                                    />

                                    {modoMotivo === "EDIT" && (
                                        <div className="flex justify-end mt-4">
                                            <button
                                                onClick={guardarInactivacion}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl cursor-pointer"
                                            >
                                                Confirmar Inactivación
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-2 p-4 bg-[#f0f9fa] rounded-md shadow-inner border border-gray-200">
                            <div>
                                {movimiento?.estado === "INACTIVO" && (
                                    <button
                                        className="px-4 py-2 text-red-500 hover:text-red-600 bg-white shadow-sm font-semibold rounded-md cursor-pointer"
                                        onClick={() => handleInactivar(movimiento)}
                                    >
                                        Ver Motivo
                                    </button>
                                )}
                            </div>
                            <div>


                                {movimiento?.estado === "ACTIVO" && (
                                    <button
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-no-drop text-white font-semibold rounded-md cursor-pointer"
                                        onClick={() => handleInactivar(movimiento)}
                                        disabled={!puede("inactivar_financiero")}
                                    >
                                        Inactivar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}