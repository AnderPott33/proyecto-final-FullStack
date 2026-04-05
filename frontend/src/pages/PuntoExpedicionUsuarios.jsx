import { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";

import { FaEdit, FaPlusSquare, FaMapMarkerAlt } from "react-icons/fa";
import { FaLocationPinLock } from "react-icons/fa6";
import SelectCustom from "../components/SelectCustom";
import Swal from "sweetalert2";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function PuntoExpedicionUsuarios() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const { puedeAcceder, puede } = usePermiso();
    const tienePermiso = puedeAcceder("contabilidad")
    useEffect(() => {
        if (!tienePermiso) { navigate("/error-permiso"); }
    }, [navigate, tienePermiso])
    if (!tienePermiso) return null;
    const [modalOpen, setModalOpen] = useState(false);
    const [usuariosList, setUsuariosList] = useState([]);
    const [puntosList, setPuntosList] = useState([]);
    const [editActivo, setEditActivo] = useState([]);

    const [authPuntos, setAuthPuntos] = useState([]);

    const [dataForm, setDataForm] = useState({
        usuario_id: "",
        punto_id: "",
        activo: ""
    });


    const [usuarioFilter, setUsuarioFilter] = useState("");
    const [puntoFilter, setPuntoFilter] = useState("");

    const handleNueva = () => {
        setEditActivo(null);
        setDataForm({
            usuario_id: "",
            punto_id: "",
            activo: 1
        });
        setModalOpen(true)
    }
    const handleEditar = (e) => {
        setEditActivo(e);
        setDataForm({
            usuario_id: e.usuario_id,
            punto_id: e.punto_id,
            activo: e.activo
        });
        setModalOpen(true)
    }

    const buscarAuthPuntos = async () => {
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/authPuntos/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setAuthPuntos(result.data)

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarAuthPuntos();
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API}/api/empresa/puntoExpedicion`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setPuntosList(response.data);
        } catch (error) {
            console.error("Error fetching empresa data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    const buscarUsuarios = async () => {
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/auth/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUsuariosList(result.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarUsuarios();
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (editActivo) {
                await axios.put(`${API}/api/authPuntos/actualizarAuthPuntos/${editActivo.id}`,
                    dataForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                Swal.fire({
                    title: "Datos actualizados",
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
                await axios.post(`${API}/api/authPuntos/agregarAuthPuntos`,
                    dataForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                Swal.fire({
                    title: "Nueva autorización agregada",
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
        setDataForm({
            usuario_id: "",
            punto_id: "",
            activo: ""
        });
        setModalOpen(false);
        buscarAuthPuntos();
    }


    const handleEliminar = async (registro) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar autorización?",
            text: `¿Seguro que querés eliminar a ${registro.usuario_nombre} del punto ${registro.punto_nombre}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            background: "#1f2937",
            color: "white",
            customClass: {
                confirmButton:
                    "bg-red-600 px-4 py-2 rounded-md text-white hover:brightness-110 transition cursor-pointer",
                cancelButton:
                    "bg-gray-500 px-4 py-2 rounded-md text-white hover:brightness-110 transition cursor-pointer",
            },
        });

        if (confirm.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API}/api/authPuntos/eliminarAuthPuntos/${registro.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    title: "Eliminado",
                    icon: "success",
                    iconColor: "#35b9ac",
                    background: "#1f2937",
                    color: "white",
                });
                // Actualiza la lista
                buscarAuthPuntos();
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: "Error al eliminar",
                    text: "No se pudo eliminar la autorización",
                    icon: "error",
                    background: "#1f2937",
                    color: "white",
                });
            }
        }
    };

    const authFiltradas = authPuntos.filter((a) => {
        // Filtra por usuario (string)
        const cumpleUser = (usuarioFilter || "") === ""
            ? true
            : (a.usuario_nombre || "").toLowerCase().includes(usuarioFilter.toLowerCase());

        // Filtra por punto (objeto {value, label})
        const cumplePunto = !puntoFilter
            ? true
            : a.punto_id === puntoFilter;

        return cumpleUser && cumplePunto;
    });




    return (
        <>
            <div className="mb-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                    bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                    rounded-md p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
                            <FaLocationPinLock />
                            Autorización Punto Expedición
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Administre los usuarios de los puntos de expedición.
                        </p>
                    </div>
                    <div>

                        <button
                            onClick={handleNueva}
                            className="bg-[#35b9ac] hover:bg-[#35b9ac]/80 rounded-md gap-2 cursor-pointer flex justify-center items-center font-semibold p-2 text-white">
                            <FaPlusSquare />
                            Agregar Autorización
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row  items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
                <input
                    type="text"
                    placeholder="Usuario"
                    value={usuarioFilter || ""}
                    onChange={(u) => setUsuarioFilter(u.target.value)}
                    className="input w-full"
                />
                <SelectCustom
                    options={[
                        { value: null, label: "Todos" }, // opción vacía
                        ...(puntosList?.map((p) => ({ value: p.id, label: p.nombre })) || [])
                    ]}
                    value={puntoFilter}
                    onChange={(p) => setPuntoFilter(p)}
                />
            </div>

            <div className=" rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">
                <DataTable
                    data={authFiltradas}
                    initialSort={{ column: "id", direction: "ascending" }}
                    columns={[
                        { accessor: "id", header: "ID" },
                        { accessor: "usuario_nombre", header: "Usuario" },
                        { accessor: "punto_nombre", header: "Punto" },
                        {
                            accessor: "activo",
                            header: "Activo",
                            cell: (e) => (
                                <span className={`
            px-2 py-1 rounded-full text-xs font-semibold
            ${e.activo
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"}
        `}>
                                    {e.activo ? "Activo" : "Inactivo"}
                                </span>
                            )
                        },
                        {
                            accessor: "editar", header: "Editar", cell: (e) => (
                                <button
                                    onClick={() => handleEditar(e)}
                                    className="p-2 rounded-md bg-blue-50 text-[#35b9ac]
                                                hover:bg-[#35b9ac] hover:text-white
                                                transition-transform duration-200 cursor-pointer"
                                >
                                    <FaEdit />
                                </button>)
                        },
                        {
                            accessor: "eliminar",
                            header: "Eliminar",
                            cell: (e) => (
                                <button
                                    onClick={() => handleEliminar(e)}
                                    className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                                >
                                    Eliminar
                                </button>
                            )
                        }
                    ]}
                />
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4">

                    <div className="bg-white rounded-md w-full max-w-[800px] 
                    max-h-[90vh] flex flex-col shadow-xl">

                        {/* HEADER */}
                        <div className="flex justify-between items-center p-4 shrink-0">
                            <span className="text-lg md:text-2xl font-bold text-gray-800">
                                {editActivo ? "Editando Autorización" : "Agregando Autorización"}
                            </span>

                            <button
                                onClick={() => setModalOpen(false)}
                                className=" p-2 hover:bg-gray-100 rounded-lg text-lg cursor-pointer hover:text-red-600">
                                x
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                }
                            }}
                        >
                            {/* CONTENIDO SCROLL */}
                            <div className="p-4 md:p-6 flex flex-col gap-4">

                                {/* FILA 1 */}
                                <div className="flex flex-col md:flex-row gap-3">
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Usuario</span>
                                        <SelectCustom
                                            options={usuariosList?.filter(u => u.estado === 'ACTIVO').map((u) => (
                                                { value: u.id, label: u.nombre }
                                            )) || []}
                                            value={dataForm.usuario_id}
                                            onChange={(e) => setDataForm({ ...dataForm, usuario_id: e })}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Punto Exp.</span>
                                        <SelectCustom
                                            options={puntosList?.map((p) => (
                                                { value: p.id, label: p.nombre }
                                            )) || []}
                                            value={dataForm.punto_id}
                                            onChange={(e) => setDataForm({ ...dataForm, punto_id: e })}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Punto Exp.</span>
                                        <input
                                            type="checkbox"
                                            checked={dataForm.activo || false}
                                            onChange={(e) =>
                                                setDataForm({ ...dataForm, activo: e.target.checked })
                                            }
                                        />
                                    </label>

                                </div>
                            </div>

                            {/* FOOTER FIJO */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 shrink-0">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="w-full sm:w-auto p-2 cursor-pointer bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600">
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="w-full sm:w-auto p-2 cursor-pointer bg-[#35b9ac] hover:bg-[#35b9ac]/80 text-white rounded-md font-semibold">
                                    {editActivo ? "Guardar Cambios" : "Agregar"}
                                </button>
                            </div>
                        </form>

                    </div>
                </div >
            )
            }
        </>
    );
}

