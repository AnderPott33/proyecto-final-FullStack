import { useState, useEffect, useContext } from "react";
import { GrMoney } from "react-icons/gr";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { MdCleaningServices } from "react-icons/md";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearNumero, formatearNumeroSimple } from "../components/FormatoFV";
import Swal from "sweetalert2";
import { GiConfirmed } from "react-icons/gi";
import { useCaja } from "../context/CajaContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function RegistrarVenta() {
    const API = import.meta.env.VITE_API_URL;
    const [modalOpen, setModalOpen] = useState(false)
    const [filtroTexto, setFiltroTexto] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { puedeAcceder, puede } = usePermiso();
    const tienePermiso = puedeAcceder("compra")
    useEffect(() => {
        if (!tienePermiso) { navigate("/error-permiso"); }
    }, [navigate, tienePermiso])
    if (!tienePermiso) return null;
    const { usuario, puntoSeleccionado } = useContext(AuthContext);


    const { caja } = useCaja();
    const [articulos, setArticulos] = useState([]);
    useEffect(() => {
        if (!caja) {
            navigate("/cajas/registrar");
        }
    }, [navigate])
    /* Secciones */
    const [registro, setRegistro] = useState("active");
    const [movimientos, setMovimientos] = useState("");
    const [pagoVenta, setPagoVenta] = useState("");

    const [fecha, setFecha] = useState(() => {
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = String(ahora.getMonth() + 1).padStart(2, "0");
        const day = String(ahora.getDate()).padStart(2, "0");
        const hours = String(ahora.getHours()).padStart(2, "0");
        const minutes = String(ahora.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    });

    const [cuotas, setCuotas] = useState(1);

    /* Formulario Encabezado */
    const [formEncabezado, setFormEncabezado] = useState({
        tipo: "COMPRA",
        usuario_id: usuario.id,
        estado: "ACTIVO",
        fecha: fecha,
        entidad_id: null,
        moneda: "PYG",
        condicion_pago: "CONTADO",
        observacion: "",
        timbrado: "",
        numero_factura: "",
        punto_exp: puntoSeleccionado.id,
        caja_id: caja?.id
    });

    /* Formulario Detalle */
    const [detalle, setDetalle] = useState({
        producto_id: "",
        producto_nombre: "",
        cantidad: 1,
        precio_unitario: 0,
        impuesto_por: "10%",
        impuesto: 0,
        total: 0
    });

    const [itemsLista, setItemsLista] = useState([]);
    const [articuloSelect, setArticuloSelect] = useState();

    const [listaCuentas, setListaCuentas] = useState([]);
    /* Formulario Pago */
    /*     const [formaPagoSelect, setFormaPagoSelect] = useState(1); */
    const [listaFormaPago, setListaFormaPago] = useState([]);
    const [formPago, setFormPago] = useState({
        fecha_pago: formEncabezado.fecha,
        moneda: formEncabezado.moneda,
        cuenta_id: "",
        cuenta_nombre: "",
        forma_pago: 1,
        monto: 0,
        banco: "",
        numero_cheque: ""
    });
    const [itemsPago, setItemsPago] = useState([]);


    const [entidad, setEntidad] = useState([]);
    const [entidadSelect, setEntidadSelect] = useState();


    const buscarCuentas = async () => {
        setLoading(true)
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/cuenta/`,
                { headers: { Authorization: `Bearer ${token}` } })
            setListaCuentas(result.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    }

    useEffect(() => {
        buscarCuentas();
    }, [])

    const buscarFormasPago = async (e) => {
        setLoading(true)
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/formaPago/`,
                { headers: { Authorization: `Bearer ${token}` } })
            setListaFormaPago(result.data);

        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    }

    useEffect(() => {
        buscarFormasPago();
    }, [])

    /* Buscar Artículos */
    const buscarArticulos = async () => {
        setLoading(true)
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/articulo`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setArticulos(result.data);

        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    }

    useEffect(() => {
        buscarArticulos();
    }, [])

    const agregarDetalle = () => {
        setLoading(true)
        if (!detalle.producto_id || detalle.cantidad <= 0) {
            alert("Completa los datos del detalle");
            return;
        }

        // 🔢 Cálculos
        const cantidad = Number(detalle.cantidad);

        const total = detalle.total;
        const impuesto_por = detalle.impuesto_por === "10%" ? 11 : 21;
        const impuesto = total / impuesto_por;
        const subtotal = total - impuesto;

        // 📦 Crear objeto final
        const nuevoDetalle = {
            id_unico: Date.now(),
            producto_id: detalle.producto_id,
            producto_nombre: detalle.producto_nombre,
            cantidad,
            impuesto_por: detalle.impuesto_por,
            subtotal,
            precio_unitario: total / cantidad,
            impuesto,
            total: detalle.total
        };


       if (editandoId) {
            // ✏️ EDITAR
            setItemsLista(prev =>
                prev.map(item =>
                    item.id_unico === editandoId ? nuevoDetalle : item
                )
            );
            setEditandoId(null);
        } else {
            // ➕ NUEVO
            setItemsLista(prev => [...prev, nuevoDetalle]);
        }

        // 🔄 Limpiar
        setDetalle({
            producto_id: '',
            cantidad: 1,
            precio: 0
        });
        setLoading(false)
        setArticuloSelect()
    };
    // Totales dinámicos
    const totalIVA5 = itemsLista.reduce((acc, item) => acc + (item.impuesto_por === "5%" ? item.impuesto : 0), 0);
    const totalIVA10 = itemsLista.reduce((acc, item) => acc + (item.impuesto_por === "10%" ? item.impuesto : 0), 0);
    const totalGeneral = itemsLista.reduce((acc, item) => acc + item.total, 0);

    const eliminarDetalle = (id_unico) => {
        setItemsLista(prev => prev.filter(item => item.id_unico !== id_unico));
    };

    const agregarDetallePago = () => {
        setLoading(true)
        const novoformPago = {
            id_unico: Date.now(),
            fecha_pago: formEncabezado.fecha,
            moneda: formEncabezado.moneda,
            cuenta_id: formPago.cuenta_id,
            cuenta_nombre: listaCuentas.find(f => f.id === formPago.cuenta_id)?.nombre || "",
            forma_pago: listaFormaPago.find(f => f.id === formPago.forma_pago)?.nombre || "",
            monto: formPago.monto,
            banco: formPago.banco || "",
            numero_cheque: formPago.numero_cheque || "",
        }

        setItemsPago((prev) => [...prev, novoformPago]);

        setFormPago({
            fecha_pago: formEncabezado.fecha,
            moneda: formEncabezado.moneda,
            cuenta_id: "",
            cuenta_nombre: "",
            forma_pago: 1,
            monto: 0,
            banco: "",
            numero_cheque: ""
        })
        setLoading(false)
    }

    const totalPagar = totalGeneral;
    const totalPago = itemsPago.reduce((acc, p) => acc + Number(p.monto), 0);
    const pendiente = totalPagar - totalPago;

    const agregarPago = () => {
        if (pendiente > 0 && formPago.monto <= pendiente) {
            agregarDetallePago();
        } else {
            alert("El valor de pago super el monto de la venta!")
        }
    }


    useEffect(() => {
        setFormPago(prev => ({
            ...prev,
            monto: pendiente > 0 ? pendiente : 0
        }));
    }, [pendiente]);

    const eliminarDetallePago = (id_unico) => {
        setItemsPago(prev => prev.filter(item => item.id_unico !== id_unico));
    };

    useEffect(() => {
        if (formEncabezado.condicion_pago === "CRÉDITO") {
            // Definir forma de pago padrão para CRÉDITO
            const formaCredito = listaFormaPago.find(f => f.id === 7); // id do crédito
            const cuentaCredito = listaCuentas.find(c => c.id === 9); // id da conta padrão

            setFormPago(prev => ({
                ...prev,
                forma_pago: formaCredito ? formaCredito.id : prev.forma_pago,
                cuenta_id: cuentaCredito ? cuentaCredito.id : prev.cuenta_id,
                monto: totalGeneral,   // ou algum valor padrão
                banco: "",             // se precisar limpar
                numero_cheque: "",     // se precisar limpar
                cuotas: 1              // valor inicial de cuotas
            }));
        }

        if (formEncabezado.condicion_pago === "CONTADO") {
            // Resetar ou definir valores para CONTADO
            setFormPago(prev => ({
                ...prev,
                forma_pago: listaFormaPago.find(f => f.sub_tipo === "EFECTIVO")?.id || prev.forma_pago,
                cuenta_id: "",         // ou algum valor default
                monto: totalGeneral,
                banco: "",
                numero_cheque: "",
                cuotas: 1
            }));
        }
    }, [formEncabezado.condicion_pago, listaFormaPago, listaCuentas, totalGeneral]);

    /* Marca itenes duplicados en la venta */
    const esDuplicado = (item) => {
        return itemsLista.filter(i => i.producto_id === item.producto_id).length > 1;
    };


    /* Buscar datos de entidades */
    const buscarEntidad = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`${API}/api/entidad`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEntidad(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        buscarEntidad();
    }, []);


    const confirmarVenta = async () => {
        if (loading) return
        setLoading(true)
        try {

            // Validar que haya cliente, artículos y pagos
            if (!entidadSelect) {
                Swal.fire("Error", "Selecciona un proveedor", "error");
                return;
            }
            if (itemsLista.length === 0) {
                Swal.fire("Error", "Agrega al menos un artículo", "error");
                return;
            }
            if (itemsPago.length === 0) {
                Swal.fire("Error", "Agrega al menos un pago", "error");
                return;
            }
            Swal.fire({
                title: "Procesando compra...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Construir el payload
            const payload = {
                encabezado: {
                    ...formEncabezado,
                    entidad_id: entidadSelect, // asignar el cliente seleccionado
                    usuario_id: usuario.id,
                },
                detalle: itemsLista.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.total / item.cantidad,
                    impuesto_por: item.impuesto_por,
                    impuesto: item.impuesto,
                    total: item.total
                })),
                pagos: itemsPago.map(p => ({
                    fecha_pago: p.fecha_pago,
                    moneda: p.moneda,
                    cuenta_id: p.cuenta_id,
                    forma_pago: p.forma_pago,
                    monto: p.monto,
                    banco: p.banco,
                    numero_cheque: p.numero_cheque
                }))
            };

            try {
                const token = localStorage.getItem("token");
                const response = await axios.post(
                    `${API}/api/compras/nuevaCompra`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                Swal.fire("Éxito", "La compra fue registrada correctamente", "success");

                // Limpiar formularios y estados
                setItemsLista([]);
                setItemsPago([]);
                setFormEncabezado({
                    ...formEncabezado,
                    entidad_id: null,
                    condicion_pago: "CONTADO",
                    observacion: "",
                    numero_factura: "", // incrementar o generar dinámicamente
                    timbrado: "" // incrementar o generar dinámicamente
                });
                setEntidadSelect();
                setRegistro("active");
                setMovimientos("");
                setPagoVenta("");

            } catch (error) {
                console.error(error);
                Swal.fire("Error", "No se pudo registrar la compra", "error");
            }
        } catch {
            Swal.fire("Error", "No se pudo registrar la compra", "error");

        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        const handleModalKey = (e) => {
            if (e.key === "F2") {
                setModalOpen(true);
            }
        };
        window.addEventListener("keydown", handleModalKey);
        return () => {
            window.removeEventListener("keydown", handleModalKey);
        };
    }, []);
    
    const seleccionarArticulo = async (row) => {
        try {
            const token = localStorage.getItem("token");

            const result = await axios.get(
                `${API}/api/articulo/${row.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const art = result.data[0];

            setDetalle({
                producto_id: art.id,
                producto_nombre: art.nombre_articulo,
                precio_unitario: "",
                impuesto_por: art.tipo_impuesto,
                impuesto: art.impuesto,
                cantidad: 1
            });

            setArticuloSelect(`${art.id} - ${art.nombre_articulo}`);

            // cerrar modal
            setModalOpen(false);

            // 👉 opcional: enfocar cantidad automáticamente
            setTimeout(() => {
                document.getElementById("inputCantidad")?.focus();
            }, 100);

        } catch (error) {
            console.error(error);
        }
    };
    const articulosFilt = articulos.filter((v) => {
        const texto = filtroTexto.toLowerCase();

        const nombre = (v.nombre_articulo || "").toLowerCase();
        const tipo = (v.tipo_articulo || "").toLowerCase();

        const coincideTexto =
            nombre.includes(texto) ||
            tipo.includes(texto);

        return coincideTexto;
    });

    const handleEnterArticulo = async (input) => {
        try {
            const token = localStorage.getItem("token");

            const result = await axios.get(
                `${API}/api/articulo/${input}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const art = result.data[0];

            setDetalle({
                producto_id: art.id,
                producto_nombre: art.nombre_articulo,
                precio_unitario: "",
                impuesto_por: art.tipo_impuesto,
                impuesto: art.impuesto,
                cantidad: 1
            });

            // 👇 Mostrar ID + nombre en el input
            setArticuloSelect(`${art.id} - ${art.nombre_articulo}`);

            // 👇 Mover foco a cantidad
            setTimeout(() => {
                document.getElementById("inputCantidad")?.focus();
            }, 10);

        } catch (error) {
            console.error(error);
        }
    };
      const editarItem = (row) => {
        setDetalle({
            producto_id: row.producto_id,
            producto_nombre: row.producto_nombre,
            cantidad: row.cantidad,
            impuesto_por: row.impuesto_por,
            impuesto: row.impuesto,
            total: row.total
        });

        setArticuloSelect(`${row.producto_id} - ${row.producto_nombre}`);
        setEditandoId(row.id_unico);

        // foco en cantidad
        setTimeout(() => {
            document.getElementById("inputCantidad")?.focus();
        }, 100);
    };
    /* Activado de secciones */
    const activaRegistro = () => {
        setRegistro("active");
        setMovimientos("");
        setPagoVenta("");
    };
    const activaMovimientos = () => {
        setMovimientos("active");
        setRegistro("");
        setPagoVenta("");
    };
    const activaPagoVenta = () => {
        setPagoVenta("active");
        setRegistro("");
        setMovimientos("");
    };

    return (
        <>
            {/* Header */}
            <div className="mb-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
                            <GrMoney />
                            Nueva Compra
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Registre las compras del sistema.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    </div>
                    <div className="w-full md:w-1/5">
                        <button
                            onClick={confirmarVenta}
                            disabled={loading}
                            className="w-full p-3 rounded-md font-semibold flex justify-center gap-2 items-center
                              bg-white text-[#359bac] border-2 border-white shadow-md shadow-black">
                            <GiConfirmed className="text-lg" />
                            Confirmar Compra
                        </button>
                    </div>
                </div>
            </div>

            {/* Botones Registro / Movimientos */}
            <div className="bg-[#359bac]/50 gap-2 flex flex-wrap md:flex-nowrap rounded-t-2xl w-full pt-2 px-6">
                <button
                    className={`${registro === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} 
                     flex justify-center items-center w-full md:w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                    type="button"
                    onClick={activaRegistro}
                >
                    Registro
                </button>

                {entidadSelect && (
                    <button
                        className={`${movimientos === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} 
                       flex justify-center items-center w-full md:w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                        type="button"
                        onClick={activaMovimientos}
                    >
                        Artículos
                    </button>
                )}
                {entidadSelect && totalGeneral != 0 && (
                    <button
                        className={`${pagoVenta === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} 
                       flex justify-center items-center w-full md:w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                        type="button"
                        onClick={activaPagoVenta}
                    >
                        Pago Compra
                    </button>
                )}
            </div>

            {/* Formulario */}
            <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-b-2xl shadow-sm">
                <div className="w-full">
                    {/* Sección Registro */}
                    {registro === "active" && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
                                <div className="w-full md:w-full">
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Proveedor</span>
                                        <SelectCustom
                                            options={entidad?.map(a => ({ value: a.id, label: `${a.ruc} - ${a.nombre}` })) || []}
                                            value={entidadSelect}
                                            onChange={setEntidadSelect}
                                        />
                                    </label>
                                </div>

                            </div>

                            <div className="bg-white p-4 rounded-md shadow-sm">
                                <form
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") e.preventDefault();
                                    }}
                                >

                                    <div className="w-full flex flex-col gap-4 md:gap-6">
                                        <div className="flex flex-col md:flex-row gap-3 items-center">
                                            <label className="flex flex-col w-full md:w-1/3">
                                                <span className="text-gray-700">Fecha</span>
                                                <input
                                                    type="datetime-local"
                                                    value={formEncabezado.fecha || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, fecha: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </label>

                                            <label className="flex flex-col w-full md:w-1/3">
                                                <span className="text-gray-700">Tímbrado</span>
                                                <input
                                                    type="text"
                                                    value={formEncabezado.timbrado || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, timbrado: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </label>

                                            <label className="flex flex-col w-full md:w-1/3">
                                                <span className="text-gray-700">Número Factura</span>
                                                <input
                                                    type="text"
                                                    value={formEncabezado.numero_factura || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, numero_factura: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </label>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-3 items-center">
                                            <label className="flex flex-col w-full md:w-1/4">
                                                <span className="text-gray-700">Moneda</span>
                                                <SelectCustom
                                                    options={[
                                                        { value: "PYG", label: "PYG" },
                                                        { value: "USD", label: "USD" },
                                                        { value: "BRL", label: "BRL" },
                                                    ]}
                                                    disabled
                                                    value={formEncabezado.moneda}
                                                    onChange={(m) => setFormEncabezado({ ...formEncabezado, moneda: m })}
                                                />
                                            </label>

                                            <label className="flex flex-col w-full md:w-1/4">
                                                <span className="text-gray-700">Condición</span>
                                                <SelectCustom
                                                    options={[
                                                        { value: "CONTADO", label: "CONTADO" },
                                                        { value: "CRÉDITO", label: "CRÉDITO" },
                                                    ]}
                                                    disabled={totalPago > 0}
                                                    value={formEncabezado.condicion_pago}
                                                    onChange={(m) => setFormEncabezado({ ...formEncabezado, condicion_pago: m })}
                                                />
                                            </label>

                                            <label className="flex flex-col w-full md:w-1/2">
                                                <span className="text-gray-700">Observación</span>
                                                <input
                                                    type="text"
                                                    value={formEncabezado.observacion || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, observacion: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Sección Movimientos */}
                    {movimientos === "active" && (
                        <div className="flex flex-col gap-4">
                            <div className=" bg-white w-full flex flex-col gap-6 overflow-auto">
                                {/* DataTable placeholder */}
                                <div className="flex justify-center items-center gap-3">
                                    {/* <label className="flex flex-col w-full md:w-1/2">
                                        <span className="text-gray-700">Artículo</span>
                                        <SelectCustom
                                            options={articulos?.map((a) => (
                                                { value: a.id, label: `${a.id} - ${a.nombre_articulo} : ${formatearNumero(a.precio_compra)}` }
                                            ))}
                                            value={articuloSelect}
                                            onChange={setArticuloSelect}
                                        />
                                    </label> */}
                                    <label className="flex flex-col w-full md:w-1/2">
                                        <span className="text-gray-700">Artículo (código o F2 para buscar)</span>
                                        <input
                                            id="inputArticulo"
                                            value={articuloSelect || ""}
                                            onChange={(e) => setArticuloSelect(e.target.value)}
                                            className="input"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleEnterArticulo(articuloSelect);
                                                }
                                            }}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-1/5">
                                        <span className="text-gray-700">Cantidad</span>
                                        <input
                                            type="number"
                                            id="inputCantidad"
                                            value={detalle.cantidad || ""}
                                            onChange={(e) => setDetalle({ ...detalle, cantidad: e.target.value })}
                                            className="input w-full"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        document.getElementById("inputValor")?.focus();
                                                    }, 10);
                                                }
                                            }}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-1/5">
                                        <span className="text-gray-700">Precio</span>
                                        <input
                                            type="number"
                                            id="inputValor"
                                            value={detalle.total || ""}
                                            onChange={(e) => setDetalle({ ...detalle, total: e.target.value })}
                                            className="input w-full"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    agregarDetalle();
                                                }
                                            }}
                                        />
                                        <div className="hidden">
                                            <input
                                                type="text"
                                                value={detalle.impuesto_por || ""}
                                                onChange={(e) => setDetalle({ ...detalle, impuesto_por: e.target.value })}
                                                className="input w-full"
                                            />
                                            <input
                                                type="number"
                                                value={detalle.impuesto || ""}
                                                onChange={(e) => setDetalle({ ...detalle, impuesto: e.target.value })}
                                                className="input w-full"
                                            />
                                        </div>
                                    </label>
                                    <button
                                        onClick={agregarDetalle}
                                        className="w-1/5 flex justify-center outline-none items-center gap-2 bg-[#35b9ac] hover:bg-[#35b9ac]/80 text-white font-semibold rounded-md p-3 mt-5 cursor-pointer "><FaPlus /> Agregar</button>
                                </div>
                                <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-x-auto">
                                    <DataTable
                                        data={itemsLista}
                                        initialSort={{ column: "producto_id", direction: "ascending" }}
                                        columns={[
                                            {
                                                header: "Producto",
                                                accessor: "producto_id",
                                                cell: (row) => (
                                                    <div className={esDuplicado(row) ? "bg-yellow-200 p-1 rounded" : ""}>
                                                        {row.producto_id} - {row.producto_nombre}
                                                    </div>
                                                )
                                            },
                                            { header: "IVA %", accessor: "impuesto_por", sortable: true },
                                            { header: "Precio Uni", accessor: "precio_unitario", align: "end", sortable: true, cell: (row) => formatearNumero(row.precio_unitario) },
                                            { header: "Cantidad", accessor: "cantidad", align: "end", sortable: true, cell: (row) => formatearNumeroSimple(row.cantidad) },
                                            { header: "Total", accessor: "total", align: "end", sortable: true, cell: (row) => formatearNumero(row.total) },
                                            {
                                                header: "Editar",
                                                accessor: "editar",
                                                cell: (row) => (
                                                    <button
                                                        className="bg-blue-500 text-white px-2 py-1 rounded"
                                                        onClick={() => editarItem(row)}
                                                    >
                                                        Editar
                                                    </button>
                                                )
                                            },
                                            {
                                                header: "Acción",
                                                accessor: "accion",
                                                align: "center",
                                                cell: (row) => (
                                                    <button
                                                        className="bg-red-500 cursor-pointer text-white px-3 py-1 rounded hover:bg-red-600"
                                                        onClick={() => eliminarDetalle(row.id_unico)}
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
                                                )
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end text-[#359bac] font-semibold gap-6 mt-4">
                                <div>Total IVA 5%: {formatearNumero(totalIVA5)}</div>
                                <div>Total IVA 10%: {formatearNumero(totalIVA10)}</div>
                                <div>Total General: {formatearNumero(totalGeneral)}</div>
                            </div>
                        </div>
                    )}
                    {pagoVenta === "active" && (
                        <div className="flex flex-col gap-4">
                            <div className=" bg-white w-full flex flex-col gap-6 overflow-auto">
                                {/* DataTable placeholder */}
                                {formEncabezado.condicion_pago === "CONTADO" &&
                                    <div className="flex justify-center items-center gap-3">
                                        <label className="flex flex-col w-full md:w-1/2">
                                            <span className="text-gray-700">Forma Pago</span>
                                            <SelectCustom
                                                options={listaFormaPago?.filter(f => f.sub_tipo === "EFECTIVO" || f.sub_tipo === "BANCO").map((a) => (
                                                    { value: a.id, label: `${a.id} - ${a.nombre}` }
                                                ))}
                                                value={formPago.forma_pago}
                                                onChange={(f) => setFormPago({ ...formPago, forma_pago: f })}
                                            />
                                        </label>
                                        <label className="flex flex-col w-full md:w-1/2">
                                            <span className="text-gray-700">Cuenta</span>
                                            <SelectCustom
                                                options={listaCuentas?.filter(c => c.sub_tipo === listaFormaPago.find(f => f.id === formPago.forma_pago)?.sub_tipo).map((a) => (
                                                    { value: a.id, label: `${a.id} - ${a.nombre}` }
                                                ))}
                                                value={formPago.cuenta_id}
                                                onChange={(c) => setFormPago({ ...formPago, cuenta_id: c })}
                                            />
                                        </label>
                                        <label className="flex flex-col w-full md:w-1/4">
                                            <span className="text-gray-700">Valor</span>
                                            <input
                                                type="number"
                                                value={formPago.monto || 0}
                                                onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                                                className="input w-full"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        agregarPago();
                                                    }
                                                }}
                                            />
                                        </label>
                                        <div className="w-1/2 flex gap-3">
                                            <label className="flex flex-col w-full md:w-full">
                                                <span className="text-gray-700">Banco</span>
                                                <input
                                                    type="text"
                                                    disabled={formPago.forma_pago != 11}
                                                    value={formPago.banco || ""}
                                                    onChange={(e) => setFormPago({ ...formPago, banco: e.target.value })}
                                                    className="input w-full disabled:opacity-45"
                                                />

                                            </label>
                                            <label className="flex flex-col w-full md:w-full">
                                                <span className="text-gray-700">Nº Cheque</span>
                                                <input
                                                    type="text"
                                                    disabled={formPago.forma_pago != 11}
                                                    value={formPago.numero_cheque || ""}
                                                    onChange={(e) => setFormPago({ ...formPago, numero_cheque: e.target.value })}
                                                    className="input w-full disabled:opacity-45"
                                                />

                                            </label>
                                        </div>
                                        <button
                                            onClick={agregarPago}
                                            className="w-1/5 flex justify-center outline-none items-center gap-2 bg-[#35b9ac] hover:bg-[#35b9ac]/80 text-white font-semibold rounded-md p-3 mt-5 cursor-pointer "><FaPlus /> Agregar</button>
                                    </div>}
                                {formEncabezado.condicion_pago === "CRÉDITO" && (
                                    <div className="flex flex-col md:flex-row gap-3 items-center">
                                        <label className="flex flex-col w-full md:w-1/3">
                                            <span className="text-gray-700">Forma Pago</span>
                                            <SelectCustom
                                                options={listaFormaPago?.filter(f => f.id === 7)
                                                    .map(a => ({ value: a.id, label: `${a.id} - ${a.nombre}` }))}
                                                value={formPago.forma_pago}
                                                disabled
                                                onChange={(f) => setFormPago({ ...formPago, forma_pago: f })}
                                            />
                                        </label>

                                        <label className="flex flex-col w-full md:w-1/3">
                                            <span className="text-gray-700">Cuenta</span>
                                            <SelectCustom
                                                options={listaCuentas?.filter(c => c.id === 9)
                                                    .map(a => ({ value: a.id, label: `${a.id} - ${a.nombre}` }))}
                                                value={formPago.cuenta_id}
                                                disabled
                                                onChange={(c) => setFormPago({ ...formPago, cuenta_id: 9 })}
                                            />
                                        </label>

                                        <label className="flex flex-col w-full md:w-1/6">
                                            <span className="text-gray-700">Valor Total</span>
                                            <input
                                                type="number"
                                                value={formPago.monto || totalGeneral}
                                                disabled
                                                className="input w-full"
                                            />
                                        </label>

                                        <label className="flex flex-col w-full md:w-1/6">
                                            <span className="text-gray-700">Cuotas</span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={cuotas}
                                                onChange={(e) => setCuotas(Number(e.target.value))}
                                                className="input w-full"
                                            />
                                        </label>

                                        <button
                                            onClick={() => {
                                                // Distribuir el monto total en las cuotas
                                                const valorCuota = totalGeneral / cuotas;
                                                let nuevosPagos = [];
                                                for (let i = 0; i < cuotas; i++) {
                                                    nuevosPagos.push({
                                                        id_unico: Date.now() + i,
                                                        fecha_pago: formEncabezado.fecha,
                                                        moneda: formEncabezado.moneda,
                                                        cuenta_id: formPago.cuenta_id,
                                                        cuenta_nombre: listaCuentas.find(f => f.id === formPago.cuenta_id)?.nombre || "",
                                                        forma_pago: listaFormaPago.find(f => f.id === formPago.forma_pago)?.nombre || "",
                                                        monto: valorCuota,
                                                        banco: "",
                                                        numero_cheque: ""
                                                    });
                                                }
                                                setItemsPago(nuevosPagos);
                                            }}
                                            className="w-1/5 flex justify-center items-center gap-2 bg-[#35b9ac] hover:bg-[#35b9ac]/80 text-white font-semibold rounded-md p-3 mt-5"
                                        >
                                            <FaPlus /> Agregar Cuotas
                                        </button>
                                    </div>
                                )}
                                <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-x-auto">
                                    <DataTable
                                        data={itemsPago}
                                        initialSort={{ column: "id_unico", direction: "ascending" }}
                                        columns={[
                                            {
                                                header: "Forma Pago",
                                                accessor: "forma_pago",
                                                cell: (row) => (
                                                    <div className={esDuplicado(row) ? "bg-yellow-200 p-1 rounded" : ""}>
                                                        {row.forma_pago}
                                                    </div>
                                                )
                                            },
                                            { header: "Cuenta", accessor: "cuenta_nombre", sortable: true },
                                            { header: "Banco", accessor: "banco", align: "end", sortable: true },
                                            { header: "Nº Cheque", accessor: "numero_cheque", align: "end", sortable: true },
                                            { header: "Monto", accessor: "monto", align: "end", sortable: true, cell: (row) => formatearNumero(row.monto) },
                                            {
                                                header: "Acción",
                                                accessor: "accion",
                                                align: "center",
                                                cell: (row) => (
                                                    <button
                                                        className="bg-red-500 text-white cursor-pointer px-3 py-1 rounded hover:bg-red-600"
                                                        onClick={() => eliminarDetallePago(row.id_unico)}
                                                    >

                                                        <FaTrashAlt />
                                                    </button>
                                                )
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end text-[#359bac] font-semibold gap-6 mt-4">
                                <div>Total Pagar: {formatearNumero(totalPagar)}</div>
                                <div>Total Pago: {formatearNumero(totalPago)}</div>
                                <div>Diferencia: {formatearNumero(pendiente)}</div>
                            </div>
                        </div>
                    )}
                    {modalOpen && movimientos && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-md w-11/12 md:w-full max-h-[100vh] overflow-y-auto shadow-lg p-6 relative">

                                {/* HEADER */}
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-[#359bac]">
                                        Seleccionar Artículo
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
                                                Buscar artículo
                                            </span>

                                            <input
                                                type="text"
                                                value={filtroTexto}
                                                onChange={(e) => setFiltroTexto(e.target.value)}
                                                className="input w-full"
                                                placeholder="Busque por tipo o nombre artículo"
                                            />
                                        </label>
                                    </div>

                                </div>

                                {/* TABLA */}
                                <DataTable
                                    data={articulosFilt}
                                    columns={[
                                        { header: "ID", accessor: "id", sortable: true },

                                        { header: "Estado", accessor: "estado", sortable: true },

                                        { header: "Tipo", accessor: "tipo_articulo", sortable: true },

                                        {
                                            header: "Nombre",
                                            accessor: "nombre_articulo",
                                            sortable: true,
                                        },

                                        {
                                            header: "Precio",
                                            accessor: "precio_venta",
                                            sortable: true,
                                            cell: (row) => formatearNumero(row.precio_venta)
                                        },

                                        {
                                            header: "Acción",
                                            accessor: "accion",
                                            cell: (row) => (
                                                <button
                                                    onClick={() => seleccionarArticulo(row)}
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
                </div>
            </div>
        </>
    );
}