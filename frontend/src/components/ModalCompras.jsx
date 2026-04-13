import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import DataTable from "./DataTable";
import axios from "axios";
import { formatearFecha, formatearNumero } from "./FormatoFV";
import { FaSearch } from "react-icons/fa";

export default function ModalCompras({ ventaSelect, setVentaSelect }) {
    const [ventas, setVentas] = useState([]);
    const [filtroTexto, setFiltroTexto] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
const API = import.meta.env.VITE_API_URL;
    // 🔹 Cargar ventas
    const cargarVentas = async () => {
        try {
            const token = localStorage.getItem("token");

            const { data } = await axios.get(`${API}/api/compras`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setVentas(data);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudieron cargar las compras", "error");
        }
    };

    useEffect(() => {
        if (modalOpen) {
            cargarVentas();
        }
    }, [modalOpen]);

    // 🔥 NORMALIZACIÓN CORRECTA (LOCAL, SIN UTC BUG)
    const normalizarFechaLocal = (fecha) => {
        if (!fecha) return "";

        const f = new Date(fecha);

        if (isNaN(f)) {
            console.warn("Fecha inválida:", fecha);
            return "";
        }

        const year = f.getFullYear();
        const month = String(f.getMonth() + 1).padStart(2, "0");
        const day = String(f.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // 🔹 FILTRO
    const ventasFiltradas = ventas.filter((v) => {
        const texto = filtroTexto.toLowerCase();

        const numero = (v.numero_factura || "").toLowerCase();
        const cliente = (v.entidad_nombre || "").toLowerCase();

        const coincideTexto =
            numero.includes(texto) ||
            cliente.includes(texto);

        const fechaVenta = normalizarFechaLocal(v.fecha);

        const dentroFecha =
            (!fechaInicio || fechaVenta >= fechaInicio) &&
            (!fechaFin || fechaVenta <= fechaFin);

        return coincideTexto && dentroFecha;
    });

    const seleccionarVenta = (venta) => {
        setVentaSelect(venta.id);
        setModalOpen(false);
    };

    return (
        <>
            {/* BOTÓN */}
            <button
                onClick={() => setModalOpen(true)}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-md
                bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white
                hover:brightness-105 transition-all duration-200
                shadow-md cursor-pointer font-semibold text-sm"
            >
                <FaSearch /> Buscar compra
            </button>

            {/* MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md w-11/12 md:w-full max-h-[100vh] overflow-y-auto shadow-lg p-6 relative">

                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#359bac]">
                                Seleccionar Compra
                            </h2>

                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 font-bold text-xl cursor-pointer"
                            >
                                x
                            </button>
                        </div>

                        {/* FILTROS */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">

                            <div className="flex-1">
                                <label className="flex flex-col">
                                    <span className="text-gray-700">
                                        Buscar por factura o cliente
                                    </span>

                                    <input
                                        type="text"
                                        value={filtroTexto}
                                        onChange={(e) => setFiltroTexto(e.target.value)}
                                        className="input w-full"
                                        placeholder="Ej: 000-000-00001 o Juan Pérez"
                                    />
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <label className="flex flex-col">
                                    <span className="text-gray-700">Fecha inicio</span>

                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="input"
                                    />
                                </label>

                                <label className="flex flex-col">
                                    <span className="text-gray-700">Fecha fin</span>

                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="input"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* TABLA */}
                        <DataTable
                            data={ventasFiltradas}
                            columns={[
                                { header: "ID", accessor: "id", sortable: true },

                                {
                                    header: "Fecha",
                                    accessor: "fecha",
                                    sortable: true,
                                    cell: (row) => formatearFecha(row.fecha),
                                },

                                { header: "Estado", accessor: "estado", sortable: true },

                                { header: "Tipo", accessor: "tipo", sortable: true },

                                {
                                    header: "Número Factura",
                                    accessor: "numero_factura",
                                    sortable: true,
                                },

                                {
                                    header: "Cliente",
                                    accessor: "entidad_nombre",
                                    sortable: true,
                                },

                                {
                                    header: "Total",
                                    accessor: "total_detalle",
                                    align: "end",
                                    sortable: true,
                                    cell: (row) => formatearNumero(row.total_detalle),
                                },

                                {
                                    header: "Acción",
                                    accessor: "accion",
                                    cell: (row) => (
                                        <button
                                            onClick={() => seleccionarVenta(row)}
                                            className="px-2 py-1 bg-green-500 text-white rounded-xl hover:bg-green-600"
                                        >
                                            Seleccionar
                                        </button>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </div>
            )}
        </>
    );
}