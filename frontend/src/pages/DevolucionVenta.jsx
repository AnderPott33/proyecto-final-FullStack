import { useState, useEffect, useContext } from "react";
import { GrMoney } from "react-icons/gr";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { MdKeyboardReturn } from "react-icons/md";
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

export default function DevolucionVenta() {
    const API = import.meta.env.VITE_API_URL;
    const [modalOpen, setModalOpen] = useState(false)
    const [editandoId, setEditandoId] = useState(null);
    const [filtroTexto, setFiltroTexto] = useState("");
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { puedeAcceder, puede } = usePermiso();
    const tienePermiso = puedeAcceder("venta")
    useEffect(() => {
        if (!tienePermiso) { navigate("/error-permiso"); }
    }, [navigate, tienePermiso])
    if (!tienePermiso) return null;
    const { usuario, puntoSeleccionado } = useContext(AuthContext);
    const timbradosSelect = puntoSeleccionado?.timbrados?.find(
        t => t.tipo_documento === "NOTA CRÉDITO"
    );
    const timbrado = timbradosSelect?.numero_timbrado || "";
    // Solo se ejecuta una vez o cuando timbrado cambia
    useEffect(() => {
        if (!timbrado) {
            Swal.fire({
                title: `No podes generar devoluciones, no tenes timbrado habilitado para NOTA CRÉDITO, en ${puntoSeleccionado.nombre}`,
                icon: 'info',
                showConfirmButton: true
            });
        }
    }, [timbrado, puntoSeleccionado.nombre]);


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
    const [comprasList, setComprasList] = useState([]);

    const [fecha, setFecha] = useState(() => {
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = String(ahora.getMonth() + 1).padStart(2, "0");
        const day = String(ahora.getDate()).padStart(2, "0");
        const hours = String(ahora.getHours()).padStart(2, "0");
        const minutes = String(ahora.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    });

    const [devolucionesAnt, setDevolucionesAnt] = useState({});

    const [cuotas, setCuotas] = useState(1);

    const buscarCompras = async () => {
        setLoading(true)
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/ventas/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setComprasList(result.data.filter(f => f.tipo === 'VENTA'));

        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    }

    useEffect(() => {
        buscarCompras();
    }, [])

    const buscarNuevaSeqVenta = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/ventas/nuevaSeqVenta/${timbrado}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFormEncabezado(prev => ({
                ...prev,
                timbrado: timbrado,
                numero_factura: result.data.numero_factura
            }));

        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    }


    useEffect(() => {
        if (timbrado) {
            buscarNuevaSeqVenta()
        }
    }, [])


    const buscarDevolucionesAnt = async () => {
        setLoading(true)
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/ventas/buscarVentasYDevoluciones`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const mapa = {};
            result.data
                .filter(d => d.tipo === 'NOTA CRÉDITO')
                .forEach(d => {
                    const ref = d.referencia_id;
                    mapa[ref] = (mapa[ref] || 0) + Number(d.total_detalle);
                });

            setDevolucionesAnt(mapa);

        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    }
    useEffect(() => {
        buscarDevolucionesAnt()
    }, [comprasList])

    const comprasDisponibles = comprasList.filter(compra => {
        const totalFactura = Number(compra.total_detalle);
        const totalDevuelto = devolucionesAnt[compra.id] || 0;

        return totalDevuelto < totalFactura;
    });

    /* Formulario Encabezado */
    const [formEncabezado, setFormEncabezado] = useState({
        tipo: "NOTA CRÉDITO",
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
        numero_cheque: "",
        referencia_id: ""
    });
    const [itemsPago, setItemsPago] = useState([]);


    const [entidad, setEntidad] = useState([]);
    const [entidadSelect, setEntidadSelect] = useState();


    const buscarCuentas = async () => {
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/cuenta/`,
                { headers: { Authorization: `Bearer ${token}` } })
            setListaCuentas(result.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarCuentas();
    }, [])

    const buscarFormasPago = async (e) => {
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/formaPago/`,
                { headers: { Authorization: `Bearer ${token}` } })
            setListaFormaPago(result.data);

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarFormasPago();
    }, [])

    /* Buscar Artículos */
    const buscarArticulos = async () => {
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/articulo`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setArticulos(result.data);

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarArticulos();
    }, [])

    const agregarDetalle = () => {
        if (!detalle.producto_id || detalle.cantidad <= 0) {
            alert("Completa los datos");
            return;
        }

        const precio = Number(detalle.precio_unitario);
        const cantidad = Number(detalle.cantidad);

        const subtotal = precio * cantidad;
        const impuesto_por = detalle.impuesto_por === "10%" ? 11 : 21;
        const impuesto = subtotal / impuesto_por;
        const total = subtotal;

        const nuevoDetalle = {
            id_unico: editandoId || Date.now(),
            producto_id: detalle.producto_id,
            producto_nombre: detalle.producto_nombre,
            cantidad,
            impuesto_por: detalle.impuesto_por,
            precio_unitario: precio,
            subtotal,
            impuesto,
            total
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

        setDetalle({
            producto_id: '',
            cantidad: 1,
            precio_unitario: 0
        });

        setArticuloSelect();
    };
    const editarItem = (row) => {
        setDetalle({
            producto_id: row.producto_id,
            producto_nombre: row.producto_nombre,
            cantidad: row.cantidad,
            precio_unitario: row.precio_unitario,
            impuesto_por: row.impuesto_por,
            impuesto: row.impuesto
        });

        setArticuloSelect(`${row.producto_id} - ${row.producto_nombre}`);
        setEditandoId(row.id_unico);

        // foco en cantidad
        setTimeout(() => {
            document.getElementById("inputCantidad")?.focus();
        }, 100);
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
                precio_unitario: art.precio_venta,
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
    const handleEnterArticulo = (input) => {
        if (!input) return;

        let cantidad = 1;
        let codigo = input.trim();

        // Detecta si es cantidad*código
        if (codigo.includes("*")) {
            const partes = codigo.split("*");
            cantidad = Number(partes[0]) || 1;
            codigo = partes[1] || partes[0];
        }

        // Limpiar código para evitar caracteres no válidos
        codigo = codigo.replace(/[^0-9a-zA-Z]/g, "");

        // Buscar artículo en la lista cargada localmente
        const articulo = articulos.find(a => String(a.id) === String(codigo));
        if (!articulo) {
            Swal.fire("Error", "Artículo no encontrado", "error");
            return;
        }

        const precio = Number(articulo.precio_venta);
        const cantidadd = Number(cantidad);

        const subtotal = precio * cantidadd;
        const impuesto_por = articulo.impuesto_por === "10%" ? 11 : 21;
        const impuesto = subtotal / impuesto_por;
        const total = subtotal;

        // Crear objeto detalle
        const detalleItem = {
            id_unico: Date.now(),
            producto_id: articulo.id,
            producto_nombre: articulo.nombre_articulo,
            cantidad,
            precio_unitario: articulo.precio_venta,
            impuesto_por: articulo.tipo_impuesto || 0,
            impuesto,
            total,
        };

        // Agregar al listado
        setItemsLista(prev => [...prev, detalleItem]);

        // Limpiar input y enfocar nuevamente
        setArticuloSelect("");
        setTimeout(() => document.getElementById("inputArticulo")?.focus(), 10);
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
            const formaCredito = listaFormaPago.find(f => f.id === 8); // id do crédito
            const cuentaCredito = listaCuentas.find(c => c.id === 8); // id da conta padrão



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
                cuenta_id: 1,         // ou algum valor default
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

    useEffect(() => {
        if (formEncabezado.referencia_id) {
            const buscarReferencia = async () => {
                const token = localStorage.getItem("token");
                try {
                    const result = await axios.get(
                        `${API}/api/compras/devolver/${formEncabezado.referencia_id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const { encabezado, detalle, pagos } = result.data;


                    // ✅ 1. Completar encabezado
                    setFormEncabezado(prev => ({
                        ...prev,
                        entidad_id: encabezado.cliente_id,
                        moneda: encabezado.moneda,
                        condicion_pago: encabezado.condicion_pago,
                        observacion: encabezado.observacion || "",
                    }));

                    setEntidadSelect(encabezado.cliente_id);

                    // ✅ 2. Cargar detalle como itemsLista
                    const detalleFormateado = detalle.map((d) => ({
                        id_unico: Date.now() + Math.random(),
                        producto_id: d.producto_id,
                        producto_nombre: d.producto_nombre,
                        cantidad: Number(d.cantidad),
                        precio_unitario: Number(d.precio_unitario),
                        impuesto_por: d.impuesto_por,
                        impuesto: Number(d.impuesto),
                        total: Number(d.total)
                    }));

                    setItemsLista(detalleFormateado);

                    // ✅ 3. Cargar pagos
                    const pagosFormateados = pagos.map((p) => ({
                        id_unico: Date.now() + Math.random(),
                        fecha_pago: p.fecha_pago,
                        moneda: p.moneda,
                        cuenta_id: p.cuenta_id,
                        cuenta_nombre: p.cuenta_nombre,
                        forma_pago: p.forma_pago_nombre,
                        monto: Number(p.monto),
                        banco: p.banco || "",
                        numero_cheque: p.numero_cheque || ""
                    }));

                    setItemsPago(pagosFormateados);

                } catch (error) {
                    console.error(error);
                }
            };

            buscarReferencia();
        }
    }, [formEncabezado.referencia_id]);


    const confirmarVenta = async () => {
        if (loading) return
        setLoading(true)
        try {
            if (timbrado) {
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
                    title: "Procesando nota de crédito...",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const referenciaId = formEncabezado.referencia_id;
                if (referenciaId) {
                    const ventaOriginal = comprasList.find(c => c.id === referenciaId);
                    if (ventaOriginal) {
                        const totalDevuelto = devolucionesAnt[referenciaId] || 0;
                        const disponible = Number(ventaOriginal.total_detalle) - totalDevuelto;

                        if (totalGeneral > disponible) {
                            Swal.fire(
                                "Error",
                                `El monto de la devolución (${formatearNumero(totalGeneral)}) excede lo disponible (${formatearNumero(disponible)})`,
                                "error"
                            );
                            return; // 🔹 salir sin guardar
                        }
                    }
                }

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
                        `${API}/api/ventas/nuevaDevolucionVenta`,
                        payload,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    Swal.fire("Éxito", "La Nota Crédito fue registrada correctamente", "success");

                    // Limpiar formularios y estados
                    setItemsLista([]);
                    setItemsPago([]);
                    setFormEncabezado({
                        ...formEncabezado,
                        entidad_id: null,
                        condicion_pago: "CONTADO",
                        observacion: "",
                        numero_factura: "", // incrementar o generar dinámicamente
                        timbrado: "", // incrementar o generar dinámicamente
                        referencia_id: ""
                    });
                    /*             buscarNuevaSeqVenta(); */
                    setEntidadSelect();
                    setRegistro("active");
                    setMovimientos("");
                    setPagoVenta("");
                    buscarCompras();
                    buscarNuevaSeqVenta()

                } catch (error) {
                    console.error(error);
                    Swal.fire("Error", "No se pudo registrar la nota de crédito", "error");
                }
            } else {
                Swal.fire("Atención", "No podes guardar la Nota de Crédito porque no tenes timbrado habilitado!", "error");
            }
        } catch {
            Swal.fire("Error", "No se pudo registrar la nota de crédito", "error");

        } finally {
            setLoading(false)
        }
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
                            <MdKeyboardReturn />
                            Nueva Nota Crédita Emitida
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Emita notas de crédito.
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
                            Confirmar Devolución Venta
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
                        Pago Venta
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
                                        <span className="text-gray-700">Cliente</span>
                                        <SelectCustom
                                            options={entidad?.map(a => ({ value: a.id, label: `${a.ruc} - ${a.nombre}` })) || []}
                                            value={entidadSelect}
                                            disabled
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
                                                    disabled
                                                    value={formEncabezado.timbrado || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, timbrado: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </label>

                                            <label className="flex flex-col w-full md:w-1/3">
                                                <span className="text-gray-700">Número Nota Crédito</span>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={formEncabezado.numero_factura || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, numero_factura: e.target.value })}
                                                    className="input w-full"
                                                />
                                            </label>
                                            <label className="flex flex-col w-full md:w-1/3">
                                                <span className="text-gray-700">Número Ref Id</span>
                                                <SelectCustom
                                                    options={comprasDisponibles.map((c) => (
                                                        {
                                                            value: c.id, label: `${c.timbrado} - ${c.numero_factura} - Disponible: ${formatearNumero(
                                                                c.total_detalle - (devolucionesAnt[c.id] || 0)
                                                            )}`
                                                        }
                                                    ))}
                                                    value={formEncabezado.referencia_id || ""}
                                                    onChange={(e) => setFormEncabezado({ ...formEncabezado, referencia_id: e })}

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
                                    <label className="flex flex-col w-full md:w-1/2">
                                        <span className="text-gray-700">Artículo (código o cantidad*código o F2 para buscar)</span>
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
                                            id="inputCantidad"
                                            type="number"
                                            value={detalle.cantidad || ""}
                                            onChange={(e) => setDetalle({ ...detalle, cantidad: e.target.value })}
                                            className="input w-full"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    agregarDetalle();
                                                }
                                            }}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-1/5">
                                        <span className="text-gray-700">Precio</span>
                                        <input
                                            type="number"
                                            value={detalle.precio_unitario || ""}
                                            onChange={(e) => setDetalle({ ...detalle, precio_unitario: e.target.value })}
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