import { useState, useEffect } from "react";
import { FaCertificate } from "react-icons/fa";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearNumero, formatearNumeroSimple } from "../components/FormatoFV";
import Swal from "sweetalert2";
import axios from "axios";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from 'react-router-dom'

export default function MarcaArticulo() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("marcas")
    useEffect(() => {
          if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const [marcas, setMarcas] = useState([]);
    const [formData, setFormData] = useState({
        id: "",
        nombre_marca: "",
    });
    const [articulo, setArticulo] = useState([]);
    const [marcaselect, setMarcaselect] = useState();
    const [stock, setStock] = useState([]);
    /* Secciones */
    const [registro, setRegistro] = useState("active");
    const [movimientos, setMovimientos] = useState("");

    /* Busca marcas para el select */
    const cargarmarcas = async () => {
        try {
            const token = localStorage.getItem('token');
            const result = await axios.get(`${API}/api/marcas/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMarcas(result.data);
        } catch (error) {
            console.error(error);
        }
    };

    // useEffect inicial
    useEffect(() => {
        cargarmarcas(); // Se llama al cargar la página
    }, []);

    /* Buscar articulos de la categoria*/
    useEffect(() => {
        if (marcaselect) {
            const buscarItems = async () => {
                try {
                    const token = localStorage.getItem("token");

                    const result = await axios.get(`${API}/api/stock/marca/${marcaselect}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    setArticulo(result.data);

                } catch (error) {
                    console.error(error);

                }
            }
            buscarItems()
        }
    }, [marcaselect])

    /* Busca marcas para el por el select y completa form*/
    useEffect(() => {
        if (marcaselect) {

            const buscarItems = async () => {
                try {
                    const token = localStorage.getItem("token");

                    const result = await axios.get(`${API}/api/marcas/${marcaselect}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )

                    setFormData({
                        id: result.data[0].id || "",
                        nombre_marca: result.data[0].nombre_marca || "",
                    });
                } catch (error) {
                    console.error(error);

                }
            }
            buscarItems()

        }
    }, [marcaselect])


    /* Agregar/Actualizar marcas */
    const handleSubmitCategoria = (e) => {
        e.preventDefault();
        const submeter = async () => {
            try {
                const token = localStorage.getItem("token");
                if (marcaselect) {

                    const result = await axios.put(`${API}/api/marcas/editarMarca/${marcaselect}`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )

                    setMarcaselect(result.data.id)
                    cargarmarcas();

                    Swal.fire({
                        title: "Marca actualizada correctamente",
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
                    const result = await axios.post(`${API}/api/marcas/nuevaMarca`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    setMarcaselect(result.data.id)
                    cargarmarcas();
                    Swal.fire({
                        title: "Marca agregada correctamente",
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
    };

    const handleDeletar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            const result = await Swal.fire({
                title: "Deseas eliminar?",
                text: "Esta acción no puede deshacer!",
                icon: "warning",
                background: "#1f2937",
                showCancelButton: true,
                confirmButtonColor: "#35b9ac",
                color: "white",
                cancelButtonColor: "#d33",
                confirmButtonText: "Si, eliminar!",
                cancelButtonText: "Cancelar"
            });

            if (result.isConfirmed) {
                await axios.delete(`${API}/api/marcas/deletarCategoria/${marcaselect}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                Swal.fire({
                    title: "Eliminada!",
                    text: "La Marca ha sido eliminada.",
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

                // Limpiar selección y formulario
                setMarcaselect(null);
                setFormData({ id: "", nombre_marca: "" });

                // Refrescar Marcas
                cargarmarcas();
            }

        } catch (error) {
            console.error(error);
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
                            <FaCertificate />
                            Marca Artículos
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Agregue Marcas para para organizar sus artículos.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto"></div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
                <SelectCustom
                    options={marcas.map((a) => (
                        { value: a.id, label: a.id + " - " + a.nombre_marca }
                    ))}
                    value={marcaselect}
                    onChange={setMarcaselect}
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

                {marcaselect && (
                    <button
                        className={`${movimientos === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} flex justify-center items-center w-40 p-2 font-semibold cursor-pointer rounded-t-md`}
                        type="button"
                        onClick={activaMovimientos}
                    >
                        Artículos
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-b-md shadow-sm">

                <div className="w-full">
                    <form onSubmit={handleSubmitCategoria}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                            }
                        }}>

                        {/* Registro/Actualizar Sec-> 1 */}
                        {registro === "active" && (
                            <div>
                                <div className=" flex flex-col gap-4">
                                    <div className="flex gap-3 items-center">
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

                                        <label className="flex flex-col w-[50%]">
                                            <span className="text-gray-700">Nombre Marca</span>
                                            <input
                                                type="text"
                                                value={formData.nombre_marca || ""}
                                                onChange={(e) => { setFormData({ ...formData, nombre_marca: e.target.value }) }}
                                                className="input w-full"
                                            />
                                        </label>
                                    </div>

                                </div>
                                <div className="gap-3 flex justify-start mt-3 p-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                id: "",
                                                nombre_marca: "",
                                            });

                                            setMarcaselect(null);
                                        }}
                                        className="bg-[#35b9ac] outline-none rounded-md text-white font-semibold cursor-pointer p-2">Nuevo</button>
                                    <button className="bg-[#35b9ac] outline-none rounded-md text-white font-semibold cursor-pointer p-2">
                                        {marcaselect ? "Actualizar Articulo" : "Guardar Nuevo"}
                                    </button>
                                    <button
                                        onClick={(d) => handleDeletar(d)}
                                        type="button"
                                        disabled={!marcaselect || !puede("eliminar_marca")}
                                        className={`rounded-md text-white font-semibold disabled:opacity-50 disabled:cursor-no-drop p-2 ${marcaselect ? "bg-red-500 cursor-pointer" : "bg-gray-400 cursor-not-allowed opacity-50"
                                            }`}
                                    >
                                        Borrar Categoria
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Sección 2 */}
                        {movimientos === "active" && (
                            <>

                                    <div className="flex justify-end items-center">
                                        <span className="bg-[#359bac] p-2 text-white rounded-md mb-2">Artículos en esta Marca: {articulo.length}</span>
                                    </div>
                                <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
                                    <DataTable
                                        data={articulo}
                                        columns={[
                                            { accessor: "producto_id", header: "ID" },
                                            { accessor: "nombre_articulo", header: "Nombre", className: "text-center" },
                                            {
                                                accessor: "estado", header: "Estado", align: "center", cell: (u) => (
                                                    <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium
                                                        ${u.estado === "ACTIVO" && "bg-green-100 text-green-700"}
                                                        ${u.estado === "INACTIVO" && "bg-red-100 text-red-700"}`}
                                                        >
                                                        {u.estado}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: "tipo_articulo", header: "Tipo", align: "center", cell: (u) => (
                                                    <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium
                                                        ${u.tipo_articulo === "SERVICIO" && "bg-orange-100 text-orange-700"}
                                                        ${u.tipo_articulo === "MERCADERIA" && "bg-purple-100 text-purple-700"}`}
                                                        >
                                                        {u.tipo_articulo}
                                                    </span>
                                                ),
                                            },
                                            { accessor: "stock_total", header: "Stock",align:"end", cell: (row)=> formatearNumeroSimple(row.stock_total) },
                                            { accessor: "precio_compra", header: "Precio Compra", align: "end", cell: (row) => formatearNumero(row.precio_compra) },
                                            { accessor: "precio_venta", header: "Precio Venta", align: "end", cell: (row) => formatearNumero(row.precio_venta) },
                                        ]}
                                    />
                                </div>
                            </>
                        )}
                    </form>
                </div >
            </div >
        </>
    )
}