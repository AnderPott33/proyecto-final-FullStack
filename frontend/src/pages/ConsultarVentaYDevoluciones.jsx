import { useState, useEffect, useContext } from "react";
import { AiOutlineFileSearch } from "react-icons/ai";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearNumero, formatearNumeroSimple, formatearFechaInput, formatearFecha } from "../components/FormatoFV";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import axios from "axios";
import { usePermiso } from "../hooks/usePermiso";

import ModalVentas from "../components/ModalVentas";
import { useNavigate } from "react-router-dom";

export default function ConsultarVentaYDevoluciones() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("venta")
    useEffect(() => {
            if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const { usuario, puntoSeleccionado } = useContext(AuthContext);
    const timbradosSelect = puntoSeleccionado?.timbrados?.find(
        t => t.tipo_documento === "NOTA CRÉDITO"
    );
    const timbrado = timbradosSelect?.numero_timbrado || "";

    const [ventas, setVentas] = useState([]);
    const [ventaSelect, setVentaSelect] = useState(null);

    const [formEncabezado, setFormEncabezado] = useState({
        tipo: '',
        estado: '',
        cliente_nombre: '',
        fecha: '',
        timbrado: '',
        numero_factura: '',
        referencia_id: '',
        moneda: '',
        condicion_pago: '',
        observacion: '',
        usuario_id: null
    });

    const [itemsLista, setItemsLista] = useState([]);
    const [itemsPago, setItemsPago] = useState([]);

    const [registro, setRegistro] = useState("active");
    const [movimientos, setMovimientos] = useState("");
    const [pagoVenta, setPagoVenta] = useState("");
    const [datosForm, setDatosForm] = useState({
        timbrado: "",
        nota_credito_N: ""
    })

    const buscarNuevaSeqVenta = async () => {
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/ventas/nuevaSeqVenta/${timbrado}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setDatosForm(prev => ({
                ...prev,
                nota_credito_N: result.data.numero_factura
            }));

        } catch (error) {
            console.error(error);
        }
    }


    useEffect(() => {
        if (timbrado) {
            buscarNuevaSeqVenta()
        }
    }, [])

    const buscarVentas = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`${API}/api/ventas`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVentas(data);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudieron cargar las ventas", "error");
        }
    };

    useEffect(() => {
        buscarVentas();
    }, []);

    // Cuando se selecciona una venta
    useEffect(() => {
        if (ventaSelect) {
            const cargarVenta = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const { data } = await axios.get(`${API}/api/ventas/${ventaSelect}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    setFormEncabezado({
                        tipo: data.encabezado.tipo || '',
                        usuario_id: data.encabezado.usuario_id || null,
                        fecha: formatearFechaInput(data.encabezado.fecha) || '',
                        timbrado: data.encabezado.timbrado || '',
                        estado: data.encabezado.estado || '',
                        numero_factura: data.encabezado.numero_factura || '',
                        moneda: data.encabezado.moneda || '',
                        condicion_pago: data.encabezado.condicion_pago || '',
                        observacion: data.encabezado.observacion || '',
                        referencia_id: data.encabezado.referencia_id || '',
                        cliente_nombre: data.encabezado.cliente_nombre || ''
                    });

                    setItemsLista(data.detalle || []);
                    setItemsPago(data.pagos || []);

                    setRegistro("active");
                    setMovimientos("");
                    setPagoVenta("");
                } catch (error) {
                    console.error(error);
                    Swal.fire("Error", "No se pudo cargar la venta", "error");
                }
            };
            cargarVenta();
        }
    }, [ventaSelect]);

    const handleDevolucion = async () => {
        if (!ventaSelect || !timbrado) {
            Swal.fire("Error", "Primero selecciona una venta", "error");
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: `¿Seguro que querés generar la devolución y nota de crédito Nº: ${datosForm.nota_credito_N}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, devolver',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            focusCancel: true
        });

        if (!isConfirmed) return;

        try {
            const token = localStorage.getItem("token");

            // Solo enviamos los datos mínimos necesarios
            const payload = {
                timbrado: datosForm.timbrado,
                nota_credito_N: datosForm.nota_credito_N
            };

            const res = await axios.post(
                `${API}/api/ventas/devolverVenta/${ventaSelect}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.ok) {
                Swal.fire({
                    title: 'Devolución generada correctamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                // Recarga las ventas y limpia selección si quieres
                buscarVentas();
            } else {
                Swal.fire('Error', res.data.mensaje, 'error');
            }

        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Error al procesar la devolución', 'error');
        }
    };

const totalIVA5 = itemsLista.reduce(
  (acc, item) => acc + (item.impuesto_por === "5%" ? Number(item.impuesto || 0) : 0),
  0
);

const totalIVA10 = itemsLista.reduce(
  (acc, item) => acc + (item.impuesto_por === "10%" ? Number(item.impuesto || 0) : 0),
  0
);

const totalGeneral = itemsLista.reduce(
  (acc, item) => acc + Number(item.total || 0),
  0
);

    const eliminarDetalle = (id_unico) => setItemsLista(prev => prev.filter(item => item.id_unico !== id_unico));
    const eliminarDetallePago = (id_unico) => setItemsPago(prev => prev.filter(item => item.id_unico !== id_unico));

    const activaRegistro = () => { setRegistro("active"); setMovimientos(""); setPagoVenta(""); };
    const activaMovimientos = () => { setMovimientos("active"); setRegistro(""); setPagoVenta(""); };
    const activaPagoVenta = () => { setPagoVenta("active"); setRegistro(""); setMovimientos(""); };


    const imprimirPDF = async (idVenta, tipo) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${API}/api/ventas/imprimir/${tipo}/${idVenta}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob", // importante para PDF
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            window.open(url); // abre en nueva ventana para imprimir
        } catch (err) {
            console.error(err);
            alert("No se pudo generar el PDF");
        }
    };
    return (
        <div>
            <div className="mb-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
                            <AiOutlineFileSearch />
                            Consultar Venta
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Consulte las ventas del sistema.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto"></div>
                    <div className="w-full md:w-1/5">
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
                <div className="w-full hidden">
                    <SelectCustom
                        options={ventas.map(v => ({
                            value: v.id,
                            label: `ID: ${v.id} -> ${v.tipo}: ${v.numero_factura} - ${v.entidad_nombre} (${formatearFecha(v.fecha)}) ${formatearNumero(v.total_detalle || 0)}`,
                        }))}
                        value={ventaSelect}
                        onChange={setVentaSelect}
                    />
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-4 mb-4 px-6">
                    <button
                        className="w-full md:w-40 p-2 rounded-md bg-blue-500 text-white font-semibold shadow hover:bg-blue-600"
                        onClick={() => imprimirPDF(ventaSelect, "factura")}
                    >
                        Imprimir Factura
                    </button>

                    <button
                        className="w-full md:w-40 p-2 rounded-md bg-green-500 text-white font-semibold shadow hover:bg-green-600"
                        onClick={() => imprimirPDF(ventaSelect, "nota_credito")}
                    >
                        Imprimir Nota de Crédito
                    </button>
                </div>
                <div className="w-full">
                    <ModalVentas ventaSelect={ventaSelect} setVentaSelect={setVentaSelect} />
                </div>
            </div>

            {ventaSelect && (
                <>
                    {/* Botones Registro / Movimientos / Pagos */}
                    <div className="bg-[#359bac]/50 gap-2 flex flex-wrap md:flex-nowrap rounded-t-2xl w-full pt-2 px-6">
                        <button
                            className={`${registro === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} 
                            flex justify-center items-center w-full md:w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                            onClick={activaRegistro}
                        >Registro</button>

                        <button
                            className={`${movimientos === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} 
                            flex justify-center items-center w-full md:w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                            onClick={activaMovimientos}
                        >Artículos</button>

                        <button
                            className={`${pagoVenta === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} 
                            flex justify-center items-center w-full md:w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                            onClick={activaPagoVenta}
                        >Pagos</button>
                    </div>

                    {/* Sección Registro */}
                    {registro === "active" && (
                        <div className="bg-white p-4 rounded-b-md shadow-sm mb-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full md:w-1/3">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Fecha</span>
                                        <input type="datetime-local" value={formEncabezado.fecha} readOnly className="input w-full" />
                                    </label>
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Tímbrado</span>
                                        <input type="text" value={formEncabezado.timbrado} readOnly className="input w-full" />
                                    </label>
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Número Factura</span>
                                        <input type="text" value={formEncabezado.numero_factura} readOnly className="input w-full" />
                                    </label>
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Ref ID</span>
                                        <input type="text" value={formEncabezado.referencia_id} readOnly className="input w-full" />
                                    </label>
                                </div>
                            </div>
                            <div className="w-full md:w-full">
                                <label className="flex flex-col">
                                    <span className="text-gray-700">Cliente</span>
                                    <input type="text" value={formEncabezado.cliente_nombre} readOnly className="input w-full" />
                                </label>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 mt-4">
                                <div className="w-full md:w-1/2">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Condición</span>
                                        <input type="text" value={formEncabezado.condicion_pago} readOnly className="input w-full" />
                                    </label>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Estado</span>
                                        <input type="text" value={formEncabezado.estado} readOnly className="input w-full" />
                                    </label>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="flex flex-col">
                                        <span className="text-gray-700">Observación</span>
                                        <input type="text" value={formEncabezado.observacion} readOnly className="input w-full" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sección Artículos */}
                    {movimientos === "active" && (
                        <div className="bg-white p-4 rounded-b-md shadow-sm mb-4">
                            <DataTable
                                data={itemsLista}
                                columns={[
                                    { header: "Producto", accessor: "producto_nombre" },
                                    { header: "IVA %", accessor: "impuesto_por" },
                                    { header: "Precio Uni", accessor: "precio_unitario", cell: (row) => formatearNumero(row.precio_unitario || 0) },
                                    { header: "Cantidad", accessor: "cantidad", cell: (row) => formatearNumeroSimple(row.cantidad || 0) },
                                    { header: "Total", accessor: "total", cell: (row) => formatearNumero(row.total || 0) },
                                ]}
                            />
                            <div className="flex justify-end text-[#359bac] font-semibold gap-6 mt-4">
                                <div>Total IVA 5%: {formatearNumero(totalIVA5)}</div>
                                <div>Total IVA 10%: {formatearNumero(totalIVA10)}</div>
                                <div>Total General: {formatearNumero(totalGeneral)}</div>
                            </div>
                        </div>
                    )}

                    {/* Sección Pagos */}
                    {pagoVenta === "active" && (
                        <div className="bg-white p-4 rounded-b-md shadow-sm mb-4">
                            <DataTable
                                data={itemsPago}
                                columns={[
                                    { header: "Fecha", accessor: "fecha_pago", cell: (f) => formatearFecha(f.fecha_pago) },
                                    { header: "Moneda", accessor: "moneda" },
                                    { header: "Forma Pago", accessor: "forma_pago" },
                                    { header: "Cuenta", accessor: "cuenta_nombre" },
                                    { header: "Banco", accessor: "banco" },
                                    { header: "Nº Cheque", accessor: "numero_cheque" },
                                    { header: "Monto", accessor: "monto", cell: (row) => formatearNumero(row.monto || 0) },
                                ]}
                            />
                        </div>
                    )}

                </>
            )}
        </div>
    );
}