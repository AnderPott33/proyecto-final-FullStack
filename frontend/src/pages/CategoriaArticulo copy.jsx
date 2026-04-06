import { useState, useEffect } from "react";
import { TbTagStarred } from "react-icons/tb";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearNumero, formatearNumeroSimple } from "../components/FormatoFV";
import Swal from "sweetalert2";
import axios from "axios";

export default function CategoriaArticulo() {
    const [categorias, setCategorias] = useState([]);
    const [formData, setFormData] = useState({
        id: "",
        nombre_categoria: "",
    });
    const [articulo, setArticulo] = useState([]);
    const [categoriaSelect, setCategoriaSelect] = useState();
    const [stock, setStock] = useState([]);
    /* Secciones */
    const [registro, setRegistro] = useState("active");
    const [movimientos, setMovimientos] = useState("");

    /* Busca categorias para el select */
    const cargarCategorias = async () => {
        try {
            const token = localStorage.getItem('token');
            const result = await axios.get(`http://localhost:5000/api/categorias/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategorias(result.data);
        } catch (error) {
            console.log(error);
        }
    };

    // useEffect inicial
    useEffect(() => {
        cargarCategorias(); // Se llama al cargar la página
    }, []);

    /* Buscar articulos de la categoria*/
    useEffect(() => {
        if (categoriaSelect) {
            const buscarItems = async () => {
                try {
                    const token = localStorage.getItem("token");

                    const result = await axios.get(`http://localhost:5000/api/stock/categoria/${categoriaSelect}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    setArticulo(result.data);

                } catch (error) {
                    console.error(error);

                }
            }
            buscarItems()
        }
    }, [categoriaSelect])

    /* Busca Categorias para el por el select y completa form*/
    useEffect(() => {
        if (categoriaSelect) {

            const buscarItems = async () => {
                try {
                    const token = localStorage.getItem("token");

                    const result = await axios.get(`http://localhost:5000/api/categorias/${categoriaSelect}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )

                    setFormData({
                        id: result.data[0].id || "",
                        nombre_categoria: result.data[0].nombre_categoria || "",
                    });
                } catch (error) {
                    console.error(error);

                }
            }
            buscarItems()

        }
    }, [categoriaSelect])


    /* Agregar/Actualizar Categorias */
    const handleSubmitCategoria = (e) => {
        e.preventDefault();
        const submeter = async () => {
            try {
                const token = localStorage.getItem("token");
                if (categoriaSelect) {

                    const result = await axios.put(`http://localhost:5000/api/categorias/editarCategoria/${categoriaSelect}`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )

                    setCategoriaSelect(result.data.id)
                    cargarCategorias();

                    Swal.fire({
                        title: "Categoría actualizada correctamente",
                        icon: "success",
                        iconColor: "#35b9ac",
                        background: "#1f2937",
                        color: "white",
                        buttonsStyling: false,
                        customClass: {
                            confirmButton:
                                "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-2xl text-white hover:brightness-105 transition cursor-pointer",
                        },
                    });
                } else {
                    const result = await axios.post(`http://localhost:5000/api/categorias/nuevaCategoria`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                    setCategoriaSelect(result.data.id)
                    cargarCategorias();
                    Swal.fire({
                        title: "Categoría agregada correctamente",
                        icon: "success",
                        iconColor: "#35b9ac",
                        background: "#1f2937",
                        color: "white",
                        buttonsStyling: false,
                        customClass: {
                            confirmButton:
                                "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-2xl text-white hover:brightness-105 transition cursor-pointer",
                        },
                    });
                }
            } catch (error) {
                console.log(error);
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
                await axios.delete(`http://localhost:5000/api/categorias/deletarCategoria/${categoriaSelect}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                Swal.fire({
                    title: "Eliminada!",
                    text: "La categoría ha sido eliminada.",
                    icon: "success",
                    iconColor: "#35b9ac",
                    background: "#1f2937",
                    color: "white",
                    buttonsStyling: false,
                    customClass: {
                        confirmButton:
                            "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-2xl text-white hover:brightness-105 transition cursor-pointer",
                    },
                });

                // Limpiar selección y formulario
                setCategoriaSelect(null);
                setFormData({ id: "", nombre_categoria: "" });

                // Refrescar categorías
                cargarCategorias();
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
                                rounded-2xl p-6 md:p-8 shadow-lg shadow-gray-300/30">

                    <div>
                        <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
                            <TbTagStarred />
                            Categorías Artículos
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Agregue categorías para para organizar sus artículos.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto"></div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mb-2 bg-white p-4 rounded-2xl shadow-sm">
                <SelectCustom
                    options={categorias.map((a) => (
                        { value: a.id, label: a.id + " - " + a.nombre_categoria }
                    ))}
                    value={categoriaSelect}
                    onChange={setCategoriaSelect}
                />
            </div>

            <div className="bg-[#359bac]/50 gap-2 flex rounded-t-2xl w-full pt-2 px-6">
                <button
                    className={`${registro === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} flex justify-center items-center w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                    type="button"
                    onClick={activaRegistro}
                >
                    Registro
                </button>

                {categoriaSelect && (
                    <button
                        className={`${movimientos === "active" ? "bg-white text-[#359bac]" : "bg-[#359bac] text-white"} flex justify-center items-center w-40 p-2 font-semibold cursor-pointer rounded-t-2xl`}
                        type="button"
                        onClick={activaMovimientos}
                    >
                        Artículos
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-b-2xl shadow-sm">

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
                                            <span className="text-gray-700">Nombre Categoría</span>
                                            <input
                                                type="text"
                                                value={formData.nombre_categoria || ""}
                                                onChange={(e) => { setFormData({ ...formData, nombre_categoria: e.target.value }) }}
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
                                                nombre_categoria: "",
                                            });

                                            setCategoriaSelect(null);
                                        }}
                                        className="bg-[#35b9ac] outline-none rounded-2xl text-white font-semibold cursor-pointer p-2">Nuevo</button>
                                    <button className="bg-[#35b9ac] outline-none rounded-2xl text-white font-semibold cursor-pointer p-2">
                                        {categoriaSelect ? "Actualizar Articulo" : "Guardar Nuevo"}
                                    </button>
                                    <button
                                        onClick={(d) => handleDeletar(d)}
                                        type="button"
                                        disabled={!categoriaSelect}
                                        className={`rounded-2xl text-white font-semibold p-2 ${categoriaSelect ? "bg-red-500 cursor-pointer" : "bg-gray-400 cursor-not-allowed opacity-50"
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
                                        <span className="bg-[#359bac] p-2 text-white rounded-2xl mb-2">Artículos en esta categoría: {articulo.length}</span>
                                    </div>
                                <div className="rounded-2xl bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
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