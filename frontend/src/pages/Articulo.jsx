import { useState, useEffect, useContext } from "react";
import { FaTag } from "react-icons/fa";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import axios from "axios";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function Articulo() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("articulos")
    useEffect(() => {
            if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const { usuario } = useContext(AuthContext);
    const [modalOpen, setModalOpen] = useState(false)
    const [obligatorio, setObligatorio] = useState(false);
    // Primer día del mes
    const formatFecha = (fecha) => { const year = fecha.getFullYear(); const month = String(fecha.getMonth() + 1).padStart(2, "0"); const day = String(fecha.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; };


    const hoy = new Date();
    const [fechaInicio, setFechaInicio] = useState(formatFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    const [fechaFin, setFechaFin] = useState(formatFecha(hoy));

    const [formData, setFormData] = useState({
        id: "",
        nombre_articulo: "",
        codigo_barra: "",
        estado: "ACTIVO",
        precio_venta: "",
        tipo_articulo: "",
        marca_id: "",
        stock_minimo: 0,
        unidad_medida: "",
        proveedor_id: "",
        precio_compra: "",
        tipo_impuesto: "",
        categoria_id: ""
    });
    const [articulo, setArticulo] = useState([]);
    const [articuloSelect, setArticuloSelect] = useState();
    const [stock, setStock] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    /* Secciones */
    const [registro, setRegistro] = useState("active");
    const [movimientos, setMovimientos] = useState("");

    const [formAjuste, setFormAjuste] = useState({
        producto_id: articuloSelect,
        fecha: formatFecha(hoy),
        tipo: "AJUSTE",
        cantidad: "",
        observacion: "",
        signo: 1,
        costo_unitario: "",
        usuario_id: usuario.id,
    })

    const [entidad, setEntidad] = useState()

    useEffect(() => {
        const buscarCategoria = async () => {
            try {
                const token = localStorage.getItem('token');
                const result = await axios.get(`${API}/api/categorias/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setCategorias(result.data)
            } catch (error) {
                console.error(error);
            }
        }
        buscarCategoria()
    }, [])

    useEffect(() => {
        const buscarMarca = async () => {
            try {
                const token = localStorage.getItem('token');
                const result = await axios.get(`${API}/api/marcas/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setMarcas(result.data)
            } catch (error) {
                console.error(error);
            }
        }
        buscarMarca()
    }, [])


    useEffect(() => {
        const buscarItems = async () => {
            try {
                const token = localStorage.getItem("token");

                const result = await axios.get(`${API}/api/articulo`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setArticulo(result.data);
            } catch (error) {
                console.error(error);

            }
        }
        buscarItems()
    }, [articuloSelect])

    useEffect(() => {
        const buscarEntidad = async () => {
            try {
                const token = localStorage.getItem("token");

                const result = await axios.get(`${API}/api/entidad`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setEntidad(result.data);
            } catch (error) {
                console.error(error);

            }
        }
        buscarEntidad()
    }, [])


    useEffect(() => {
        if (articuloSelect) {

            const buscarItems = async () => {
                try {
                    const token = localStorage.getItem("token");

                    const result = await axios.get(`${API}/api/articulo/${articuloSelect}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )

                    setFormData({
                        id: result.data[0].id || "",
                        nombre_articulo: result.data[0].nombre_articulo || "",
                        codigo_barra: result.data[0].codigo_barra || "",
                        estado: result.data[0].estado || "ACTIVO",
                        precio_venta: result.data[0].precio_venta || "",
                        tipo_articulo: result.data[0].tipo_articulo || "",
                        marca_id: result.data[0].marca_id || "",
                        stock_minimo: result.data[0].stock_minimo || "",
                        unidad_medida: result.data[0].unidad_medida || "",
                        proveedor_id: result.data[0].proveedor_id || "",
                        precio_compra: result.data[0].precio_compra || "",
                        tipo_impuesto: result.data[0].tipo_impuesto || "",
                        categoria_id: result.data[0].categoria_id || "",
                    });

                } catch (error) {
                    console.error(error);

                }
            }
            buscarItems()

        }
    }, [articuloSelect])


    useEffect(() => {
        setFormAjuste(prev => ({
            ...prev,
            producto_id: articuloSelect
        }));
    }, [articuloSelect]);


    useEffect(() => {
        if (articuloSelect) {

            const buscarStock = async () => {
                try {
                    const token = localStorage.getItem("token");

                    const result = await axios.get(
                        `${API}/api/stock/${articuloSelect}`,
                        {
                            params: { fechaInicio, fechaFin },
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );

                    setStock(result.data)

                } catch (error) {
                    console.error(error);

                }
            }
            buscarStock()
        }
    }, [articuloSelect, fechaInicio, fechaFin])


    /* Agregar/Actualizar Artículo */
    const handleSubmitArticulo = (e) => {
        e.preventDefault();
        if (formData.estado === "" || formData.nombre_articulo === "" || formData.tipo_articulo === "" || formData.categoria_id === ""
            || formData.tipo_impuesto === "" || formData.precio_compra === "" || formData.precio_venta === ""
        ) {
            setObligatorio(true)
        } else {
            const submeter = async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (articuloSelect) {

                        const result = await axios.put(`${API}/api/articulo/actualizarArticulo/${articuloSelect}`,
                            formData,
                            { headers: { Authorization: `Bearer ${token}` } }
                        )

                        setArticuloSelect(result.data.id)
                        Swal.fire({
                            title: "Articulo actualizado correctamente",
                            icon: "success",
                            iconColor: "#35b9ac",
                            background: "#1f2937",
                            color: "white",
                            buttonsStyling: false,
                            customClass: {
                                confirmButton:
                                    "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-md text-white hover:brightness-105 transition cursor-pointer",
                            },
                        });
                    } else {
                        const result = await axios.post(`${API}/api/articulo/nuevoArticulo`,
                            formData,
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                        setArticuloSelect(result.data.id)
                        Swal.fire({
                            title: "Articulo agregado correctamente",
                            icon: "success",
                            iconColor: "#35b9ac",
                            background: "#1f2937",
                            color: "white",
                            buttonsStyling: false,
                            customClass: {
                                confirmButton:
                                    "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-md text-white hover:brightness-105 transition cursor-pointer",
                            },
                        });
                    }
                } catch (error) {
                    console.error(error);
                }
            }
            submeter();
        }
    };


    const handleAjustar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            const payload = {
                ...formAjuste,
                producto_id: parseInt(formAjuste.producto_id) || null,
                cantidad: parseFloat(formAjuste.cantidad) || 0,
                costo_unitario: parseFloat(formAjuste.costo_unitario) || 0,
                signo: parseInt(formAjuste.signo) || null,
            };

            const result = await axios.post(
                `${API}/api/stock/nuevoAjuste`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire({
                title: "Nuevo ajuste de stock agregado!",
                icon: "success",
                iconColor: "#35b9ac",
                background: "#1f2937",
                color: "white",
                buttonsStyling: false,
                customClass: {
                    confirmButton:
                        "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-md text-white hover:brightness-105 transition cursor-pointer",
                },
            });
            setFormAjuste({
                producto_id: articuloSelect,
                fecha: formatFecha(new Date()),
                tipo: "AJUSTE",
                cantidad: "",
                observacion: "",
                signo: "",
                costo_unitario: "",
                usuario_id: usuario.id,
            });


            setModalOpen(false);

        } catch (error) {
            console.error(error);
            Swal.fire({
                title: "Error al guardar ajuste!",
                icon: "error",
                iconColor: "#35b9ac",
                background: "#1f2937",
                color: "white",
                buttonsStyling: false,
                customClass: {
                    confirmButton:
                        "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-md text-white hover:brightness-105 transition cursor-pointer",
                },
            });
        }

    };


    /* Activado de secciones */
    const activaRegistro = () => {
        setRegistro("active");
        setMovimientos("");
    }
    const activaMovimientos = () => {
        setMovimientos("active");
        setRegistro("");
    }

    return (
        <>
            <div className="mb-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                                bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                                rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">

                    <div>
                        <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
                            <FaTag />
                            Artículo
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Agregue artículo para realizar ventas.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto"></div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
                <SelectCustom
                    options={articulo.map((a) => (
                        { value: a.id, label: a.id + " - " + a.nombre_articulo }
                    ))}
                    value={articuloSelect}
                    onChange={setArticuloSelect}
                />
            </div>

            <div className="bg-[#359bac]/50 gap-2 flex rounded-t-md w-full pt-2 px-6">
                <button
                    className={`${registro === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} flex justify-center items-center w-40 p-2 font-semibold cursor-pointer rounded-t-md`}
                    type="button"
                    onClick={activaRegistro}
                >
                    Registro
                </button>

                {articuloSelect && (
                    <button
                        className={`${movimientos === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} flex justify-center items-center w-40 p-2 font-semibold cursor-pointer rounded-t-md`}
                        type="button"
                        onClick={activaMovimientos}
                    >
                        Stock
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-b-md shadow-sm">

                <div className="w-full">
                    <form onSubmit={handleSubmitArticulo}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                            }
                        }}>

                        {/* Registro/Actualizar Sec-> 1 */}
                        {registro === "active" && (
                            <div>
                                <div className=" flex flex-col gap-4">
                                    <div className="flex gap-3">
                                        <label className="flex flex-col w-[30%]">
                                            <span className="text-gray-700">ID</span>
                                            <input
                                                type="number"
                                                value={formData.id || ""}
                                                onChange={(e) => { setFormData({ ...formData, id: e.target.value }) }}
                                                readOnly
                                                className="input w-full"
                                            />
                                        </label>
                                        <label className="flex flex-col  w-full">
                                            <span className="text-gray-700">Estado</span>
                                            <SelectCustom
                                                options={[
                                                    { value: "ACTIVO", label: "ACTIVO" },
                                                    { value: "INACTIVO", label: "INACTIVO" },
                                                ]}
                                                value={formData.estado}
                                                onChange={(e) => setFormData({ ...formData, estado: e })}
                                            />
                                            <span className="italic text-red-500 text-xs h-4">
                                                {obligatorio ? "*Campo Obligatório!" : " "}
                                            </span>
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <span className="text-gray-700">Tipo artículo</span>
                                            <SelectCustom
                                                options={[
                                                    { value: "SERVICIO", label: "SERVICIO" },
                                                    { value: "MERCADERIA", label: "MERCADERIA" },
                                                ]}
                                                value={formData.tipo_articulo}
                                                onChange={(e) => setFormData({ ...formData, tipo_articulo: e })}
                                            />
                                            <span className="italic text-red-500 text-xs h-4">
                                                {obligatorio ? "*Campo Obligatório!" : " "}
                                            </span>
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <span className="text-gray-700">Stock Minimo</span>
                                            <input
                                                type="number"
                                                value={formData.stock_minimo || ""}
                                                onChange={(e) => { setFormData({ ...formData, stock_minimo: e.target.value }) }}
                                                className="input w-full"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex gap-3">
                                        <label className="flex flex-col w-[50%]">
                                            <span className="text-gray-700">Nombre Artículo</span>
                                            <input
                                                type="text"
                                                value={formData.nombre_articulo || ""}
                                                onChange={(e) => { setFormData({ ...formData, nombre_articulo: e.target.value }) }}
                                                className="input w-full"
                                            />
                                            <span className="italic text-red-500 text-xs h-4">
                                                {obligatorio ? "*Campo Obligatório!" : " "}
                                            </span>
                                        </label>
                                        <label className="flex flex-col w-[50%]">
                                            <span className="text-gray-700">Códido de barra </span>
                                            <input
                                                type="text"
                                                value={formData.codigo_barra || ""}
                                                onChange={(e) => { setFormData({ ...formData, codigo_barra: e.target.value }) }}
                                                className="input w-full"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex gap-3">
                                        <label className="flex flex-col w-[50%]">
                                            <span className="text-gray-700">Marca </span>
                                            <SelectCustom
                                                options={marcas.map((m)=>(
                                                    {value: m.id, label: m.nombre_marca}
                                                ))}
                                                type="text"
                                                value={formData.marca_id || null}
                                                onChange={(e) => { setFormData({ ...formData, marca_id: e }) }}

                                            />
                                        </label>
                                        <label className="flex flex-col w-[50%]">
                                            <span className="text-gray-700">Categoria </span>
                                            <SelectCustom
                                                options={categorias.map((c) => (
                                                    { value: c.id, label: c.nombre_categoria }
                                                ))}
                                                type="text"
                                                value={formData.categoria_id || null}
                                                onChange={(e) => { setFormData({ ...formData, categoria_id: e }) }}

                                            />
                                            <span className="italic text-red-500 text-xs h-4">
                                                {obligatorio ? "*Campo Obligatório!" : " "}
                                            </span>
                                        </label>
                                        <div className="flex gap-3 w-[50%]">
                                            <label className="flex flex-col w-full">
                                                <span className="text-gray-700">Unidad de medida </span>
                                                <SelectCustom
                                                    options={[
                                                        { value: "KGS", label: "KILOGRAMOS" },
                                                        { value: "GR", label: "GRAMOS" },
                                                        { value: "UN", label: "UNIDAD/ES" },
                                                        { value: "LTS", label: "LITROS" },
                                                        { value: "ML", label: "MILILITROS" },
                                                        { value: "MTS", label: "METROS" },
                                                    ]}
                                                    type="text"
                                                    value={formData.unidad_medida || ""}
                                                    onChange={(e) => { setFormData({ ...formData, unidad_medida: e }) }}

                                                />
                                                <span className="italic text-red-500 text-xs h-4">
                                                    {obligatorio ? "*Campo Obligatório!" : " "}
                                                </span>
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="text-gray-700">Tipo Impuesto</span>
                                                <SelectCustom
                                                    options={[
                                                        { value: "EXENTO", label: "EXENTO" },
                                                        { value: "5%", label: "5%" },
                                                        { value: "10%", label: "10%" },
                                                    ]}
                                                    type="text"
                                                    value={formData.tipo_impuesto || null}
                                                    onChange={(e) => { setFormData({ ...formData, tipo_impuesto: e }) }}

                                                />
                                                <span className="italic text-red-500 text-xs h-4">
                                                    {obligatorio ? "*Campo Obligatório!" : " "}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <label className="flex flex-col w-[50%]">
                                            <span className="text-gray-700">Proveedor</span>
                                            <SelectCustom
                                                options={(entidad || []).map((e) => ({ value: e.id, label: e.nombre }))}
                                                type="text"
                                                value={formData.proveedor_id || ""}
                                                onChange={(e) => { setFormData({ ...formData, proveedor_id: e }) }}

                                            />
                                        </label>

                                        <div className="flex gap-3 w-[50%]">

                                            <label className="flex flex-col w-full">
                                                <span className="text-gray-700">Precio Compra </span>
                                                <input
                                                    type="text"
                                                    value={formData.precio_compra || ""}
                                                    onChange={(e) => { setFormData({ ...formData, precio_compra: e.target.value }) }}
                                                    className="input w-full"
                                                />
                                                <span className="italic text-red-500 text-xs h-4">
                                                    {obligatorio ? "*Campo Obligatório!" : " "}
                                                </span>
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="text-gray-700">Precio Venta </span>
                                                <input
                                                    type="text"
                                                    value={formData.precio_venta || ""}
                                                    onChange={(e) => { setFormData({ ...formData, precio_venta: e.target.value }) }}
                                                    className="input w-full"
                                                />
                                                <span className="italic text-red-500 text-xs h-4">
                                                    {obligatorio ? "*Campo Obligatório!" : " "}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="gap-3 flex justify-start mt-3 p-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                id: "",
                                                nombre_articulo: "",
                                                codigo_barra: "",
                                                estado: "ACTIVO",
                                                precio_venta: "",
                                                tipo_articulo: "",
                                                marca_id: "",
                                                stock_minimo: 0,
                                                unidad_medida: "",
                                                proveedor_id: null,
                                                precio_compra: "",
                                                tipo_impuesto: ""
                                            });

                                            setArticuloSelect(null);
                                            setObligatorio(false)
                                        }}
                                        className="bg-[#35b9ac] outline-none rounded-md text-white font-semibold cursor-pointer p-2">Nuevo</button>
                                    <button className="bg-[#35b9ac] outline-none rounded-md text-white font-semibold cursor-pointer p-2">
                                        {articuloSelect ? "Actualizar Articulo" : "Guardar Nuevo"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Sección 2 */}
                        {movimientos === "active" && (
                            <>
                                <div className="flex gap-3 m-3">
                                    {/* Fecha inicio */}
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={d => setFechaInicio(d.target.value)}
                                        className="input w-full"
                                    />

                                    {/* Fecha fin */}
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={d => setFechaFin(d.target.value)}
                                        className="input w-full"
                                    />
                                    <button
                                        type="button"
                                        disabled={!puede("realizar_ajuste_stock")}
                                        onClick={() => { setModalOpen(true) }}
                                        className="bg-[#35b9ac] w-full outline-none rounded-md disabled:opacity-50 disabled:cursor-no-drop text-white font-semibold cursor-pointer hover:bg-[#35b9ac]/80 p-2 flex justify-center items-center">
                                        Realizar ajuste
                                    </button>
                                </div>
                                <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
                                    <DataTable
                                        data={stock}
                                        columns={[
                                            { accessor: "id_movimiento", header: "ID" },
                                            { accessor: "referencia_id", header: "Ref. ID" },
                                            { accessor: "documento_ref", header: "Nº Factura" },
                                            { accessor: "fecha", header: "Fecha", cell: (row) => formatearFecha(row.fecha), },
                                            { accessor: "usuario_nombre", header: "Usuario", className: "text-center" },
                                            {
                                                accessor: "tipo", header: "Tipo", align: "center", cell: (u) => (
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium
                  ${u.tipo === "VENTA" && "bg-green-100 text-green-700"}
                  ${u.tipo === "COMPRA" && "bg-red-100 text-red-700"}
                  ${u.tipo === "AJUSTE" && "bg-yellow-100 text-yellow-700"}`}
                                                    >
                                                        {u.tipo}
                                                    </span>
                                                ),
                                            },
                                            { accessor: "observacion", header: "Observación", className: "text-center" },
                                            { accessor: "movimiento", header: "Movimiento", className: "text-center" },
                                            { accessor: "stock_acumulado", header: "Stock", className: "text-center" },
                                            { accessor: "costo_unitario", header: "Costo Unitario", align: "end", cell: (row) => formatearNumero(row.costo_unitario) },
                                            { accessor: "valor_movimiento", header: "Total", align: "end", cell: (row) => formatearNumero(row.valor_movimiento) },
                                        ]}
                                    />
                                </div>
                            </>
                        )}
                    </form>
                </div >
            </div >

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4">

                    <div className="bg-white rounded-md w-full max-w-[600px] 
                    max-h-[90vh] flex flex-col shadow-xl">

                        {/* HEADER */}
                        <div className="flex justify-between items-center p-4 shrink-0">
                            <span className="text-lg md:text-2xl font-bold text-gray-800">
                                Ajuste de Stock
                            </span>

                            <button
                                onClick={() => setModalOpen(false)}
                                className=" p-2 hover:bg-gray-100 rounded-lg text-lg cursor-pointer hover:text-red-600">
                                x
                            </button>
                        </div>

                        <form
                            onSubmit={handleAjustar}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                }
                            }}
                        >
                            {/* CONTENIDO SCROLL */}
                            <div className="p-4 md:p-6 flex flex-col gap-4">

                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <div className="w-full">
                                        <label className="flex flex-col w-full">
                                            <span className="text-gray-700">Tipo</span>
                                            <SelectCustom
                                                options={[
                                                    { value: -1, label: "SALIDA" },
                                                    { value: +1, label: "ENTRADA" }
                                                ]}
                                                value={formAjuste.signo}
                                                onChange={(e) => setFormAjuste({ ...formAjuste, signo: e })}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-center items-center gap-3">
                                        <label className="flex flex-col w-full">
                                            <span className="text-gray-700">Cantidad</span>
                                            <input
                                                type="number"
                                                value={formAjuste.cantidad}
                                                onChange={(e) => setFormAjuste({ ...formAjuste, cantidad: e.target.value })}
                                                className="input w-full"
                                            />
                                        </label>
                                        <label className="flex flex-col w-full">
                                            <span className="text-gray-700">Costo Unitário</span>
                                            <input
                                                type="number"
                                                value={formAjuste.costo_unitario}
                                                onChange={(e) => setFormAjuste({ ...formAjuste, costo_unitario: e.target.value })}
                                                className="input w-full"
                                            />
                                        </label>
                                    </div>
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Observación</span>
                                        <input
                                            type="text"
                                            value={formAjuste.observacion}
                                            onChange={(e) => setFormAjuste({ ...formAjuste, observacion: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                </div>


                            </div>

                            {/* FOOTER FIJO */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="w-full sm:w-auto p-2 cursor-pointer outline-none bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600">
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="w-full sm:w-auto p-2 cursor-pointer outline-none bg-[#35b9ac] hover:bg-[#35b9ac]/80 text-white rounded-md font-semibold">
                                    Guardar Ajuste
                                </button>
                            </div>
                        </form>

                    </div>
                </div >
            )
            }
        </>
    )
}