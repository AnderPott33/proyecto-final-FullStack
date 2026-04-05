import { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";

import { FaEdit, FaPlusSquare, FaMapMarkerAlt } from "react-icons/fa";
import SelectCustom from "../components/SelectCustom";
import Swal from "sweetalert2";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function PuntoExpedicion() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("contabilidad")
    useEffect(() => {
          if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const [modalOpen, setModalOpen] = useState(false);
    const [empresa, setEmpresa] = useState([]);
    const [cuentaList, setCuentaList] = useState([]);
    const [timbradoList, setTimbradoList] = useState([]);

    const [empresaActiva, setEmpresaActiva] = useState();
    const [empresaList, setEmpresaList] = useState([]);
    const [dataForm, setDataForm] = useState({
        empresa_id: "",
        nombre: "",
        codigo: "",
        direccion: "",
        telefono: "",
        correo: "",
        estado: "",
        timbrado: ""
    });

    const handleNueva = () => {
        setEmpresaActiva(null);
        setDataForm({
            empresa_id: "",
            nombre: "",
            codigo: "",
            direccion: "",
            telefono: "",
            correo: "",
            estado: "",
            timbrado: ""
        });
        setModalOpen(true)
    }
    const handleEditar = (e) => {
        setEmpresaActiva(e);
        setDataForm({
            empresa_id: e.empresa_id,
            nombre: e.nombre,
            codigo: e.codigo,
            direccion: e.direccion,
            telefono: e.telefono,
            correo: e.correo,
            estado: e.estado,
            timbrado: e.timbrado
        });
        setModalOpen(true)
    }

    const buscarTimbrados = async () => {
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/timbrados`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setTimbradoList(result.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarTimbrados();
    }, [])


    const buscarEmpresa = async () => {
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/empresa`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEmpresaList(result.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarEmpresa();
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API}/api/empresa/puntoExpedicion`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setEmpresa(response.data);
        } catch (error) {
            console.error("Error fetching empresa data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const buscarCuenta = async () => {
        try {
            const token = localStorage.getItem("token");
            const result = await axios.get(`${API}/api/cuenta`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setCuentaList(result.data);

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        buscarCuenta();
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (empresaActiva) {
                await axios.put(`${API}/api/empresa/actualizarPuntoExpedicion/${empresaActiva.id}`,
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
                await axios.post(`${API}/api/empresa/agregarPuntoExpedicion`,
                    dataForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                Swal.fire({
                    title: "Nueva empresa agregada",
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
            empresa_id: "",
            nombre: "",
            codigo: "",
            direccion: "",
            telefono: "",
            correo: "",
            estado: "",
            timbrado: ""
        });
        setModalOpen(false);
        fetchData();
    }

    return (
        <>
            <div className="mb-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                    bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                    rounded-md p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
                            <FaMapMarkerAlt />
                            Punto Expedición
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Administre los puntos de expedición.
                        </p>
                    </div>
                    <div>

                        <button
                            onClick={handleNueva}
                            className="bg-[#35b9ac] hover:bg-[#35b9ac]/80 rounded-md gap-2 cursor-pointer flex justify-center items-center font-semibold p-2 text-white">
                            <FaPlusSquare />
                            Agregar Punto Expedición
                        </button>
                    </div>
                </div>
            </div>

            <div className=" rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">
                <DataTable
                    data={empresa}
                    initialSort={{ column: "id", direction: "ascending" }}
                    columns={[
                        { accessor: "id", header: "ID" },
                        { accessor: "empresa_id", header: "ID Empresa" },
                        { accessor: "nombre", header: "Nombre" },
                        { accessor: "codigo", header: "Código" },
                        { accessor: "direccion", header: "Dirección" },
                        { accessor: "telefono", header: "Teléfono" },
                        { accessor: "correo", header: "Email" },
                        { accessor: "fecha_creacion", header: "Fecha de Creación", cell: (e) => formatearFecha(e.fecha_creacion) },
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
                        }
                    ]}
                />
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4">

                    <div className="bg-white rounded-md w-full max-w-[1000px] 
                    max-h-[90vh] flex flex-col shadow-xl">

                        {/* HEADER */}
                        <div className="flex justify-between items-center p-4 shrink-0">
                            <span className="text-lg md:text-2xl font-bold text-gray-800">
                                {empresaActiva ? "Editando Punto Expedición" : "Agregando Punto Expedición"}
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
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Nombre</span>
                                        <input
                                            type="text"
                                            value={dataForm.nombre}
                                            onChange={(e) => setDataForm({ ...dataForm, nombre: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-60">
                                        <span className="text-gray-700">Estado</span>
                                        <SelectCustom
                                            options={[
                                                { value: "ACTIVO", label: "ACTIVO" },
                                                { value: "INACTIVO", label: "INACTIVO" }
                                            ]}
                                            value={dataForm.estado}
                                            onChange={(e) => setDataForm({ ...dataForm, estado: e })}
                                        />
                                    </label>
                                    <label className="flex flex-col w-60">
                                        <span className="text-gray-700">Código</span>
                                        <input
                                            type="text"
                                            value={dataForm.codigo}
                                            onChange={(e) => setDataForm({ ...dataForm, codigo: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                </div>

                                {/* FILA 3 */}
                                <div className="flex flex-col md:flex-row gap-3">
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Dirección</span>
                                        <input
                                            type="text"
                                            value={dataForm.direccion}
                                            onChange={(e) => setDataForm({ ...dataForm, direccion: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>

                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Teléfono</span>
                                        <input
                                            type="text"
                                            value={dataForm.telefono}
                                            onChange={(e) => setDataForm({ ...dataForm, telefono: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>

                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">E-mail</span>
                                        <input
                                            type="email"
                                            value={dataForm.correo}
                                            onChange={(e) => setDataForm({ ...dataForm, correo: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                </div>
                                <div className="flex w-full gap-3">
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Empresa</span>
                                        <SelectCustom
                                            options={empresaList?.map((c) => (
                                                { value: c.id, label: c.razon_social }
                                            ))}
                                            value={dataForm.empresa_id}
                                            onChange={(e) => setDataForm({ ...dataForm, empresa_id: e })}
                                        />
                                    </label>
                                    <label className="flex hidden flex-col w-full md:w-full">
                                        <span className="text-gray-700">Timbrado</span>
                                        <SelectCustom
                                            options={timbradoList.filter(t => t.estado === 'ACTIVO').map((c) => (
                                                { value: c.numero_timbrado, label: `${c.codigo_emp}-${c.codigo_suc}: ${c.numero_timbrado}` }
                                            ))}
                                            value={dataForm.timbrado}
                                            onChange={(e) => setDataForm({ ...dataForm, timbrado: e })}
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
                                    {empresaActiva ? "Guardar Cambios" : "Agregar"}
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

