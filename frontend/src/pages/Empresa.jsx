import { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";
import { RiBankLine } from "react-icons/ri";
import { FaEdit, FaPlusSquare } from "react-icons/fa";
import SelectCustom from "../components/SelectCustom";
import Swal from "sweetalert2";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function Empresa() {
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

    const [empresaActiva, setEmpresaActiva] = useState();
    const [dataForm, setDataForm] = useState({
        razon_social: "",
        nombre_fantasia: "",
        ruc: "",
        dv: "",
        direccion: "",
        telefono: "",
        email: "",
        estado: "",
        cuenta_ingreso_venta: "",
        cuenta_gasto_compra: "",
        cuenta_iva_debito: "",
        cuenta_iva_credito: "",
        codigo_suc: ""
    });

    const handleNueva = () => {
        setEmpresaActiva(null);
        setDataForm({
            razon_social: "", nombre_fantasia: "", ruc: "", dv: "", direccion: "", telefono: "", email: "", estado: "ACTIVO", cuenta_ingreso_venta: "",
            cuenta_gasto_compra: "",
            cuenta_iva_debito: "",
            cuenta_iva_credito: "",
            codigo_suc: ""
        });
        setModalOpen(true)
    }
    const handleEditar = (e) => {
        setEmpresaActiva(e);
        setDataForm({
            razon_social: e.razon_social,
            nombre_fantasia: e.nombre_fantasia,
            ruc: e.ruc,
            dv: e.dv,
            direccion: e.direccion,
            telefono: e.telefono,
            email: e.email,
            estado: e.estado,
            cuenta_ingreso_venta: e.cuenta_ingreso_venta,
            cuenta_gasto_compra: e.cuenta_gasto_compra,
            cuenta_iva_debito: e.cuenta_iva_debito,
            cuenta_iva_credito: e.cuenta_iva_credito,
            codigo_suc: e.codigo_suc
        });
        setModalOpen(true)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${API}/api/empresa`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setEmpresa(response.data);
            } catch (error) {
                console.error("Error fetching empresa data:", error);
            }
        };

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
                await axios.put(`${API}/api/empresa/actualizarEmpresa/${empresaActiva.id}`,
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
                await axios.post(`${API}/api/empresa/agregarEmpresa`,
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
            razon_social: "",
            nombre_fantasia: "",
            ruc: "",
            dv: "",
            direccion: "",
            telefono: "",
            email: "",
            estado: "",
            cuenta_ingreso_venta: "",
            cuenta_gasto_compra: "",
            cuenta_iva_debito: "",
            cuenta_iva_credito: "",
            codigo_suc: ""
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
                            <RiBankLine />
                            Empresa
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Actualice los datos de la empresa para mantener su información al día. Asegúrese de que los datos sean precisos para una mejor gestión y comunicación con sus clientes.
                        </p>
                    </div>
                    <div>
                        {empresa &&
                            <button
                                onClick={handleNueva}
                                className="bg-[#35b9ac] hover:bg-[#35b9ac]/80 rounded-md gap-2 cursor-pointer flex justify-center items-center font-semibold p-2 text-white">
                                <FaPlusSquare />
                                Agregar Empresa
                            </button>}
                    </div>
                </div>
            </div>

            <div className=" rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">
                <DataTable
                    data={empresa}
                    initialSort={{ column: "id", direction: "ascending" }}
                    columns={[
                        { accessor: "id", header: "ID" },
                        { accessor: "razon_social", header: "Razón Social" },
                        { accessor: "nombre_fantasia", header: "Nombre Fantasia" },
                        { accessor: "ruc", header: "RUC", cell: (e) => { return <span>{e.ruc + '-' + e.dv}</span> } },
                        { accessor: "direccion", header: "Dirección" },
                        { accessor: "telefono", header: "Teléfono" },
                        { accessor: "email", header: "Email" },
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
                                {empresaActiva ? "Editando Empresa" : "Agregando Empresa"}
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
                                        <span className="text-gray-700">Razón Social</span>
                                        <input
                                            type="text"
                                            value={dataForm.razon_social}
                                            onChange={(e) => setDataForm({ ...dataForm, razon_social: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        <label className="flex flex-col w-full">
                                            <span className="text-gray-700">RUC</span>
                                            <input
                                                type="number"
                                                value={dataForm.ruc}
                                                onChange={(e) => setDataForm({ ...dataForm, ruc: e.target.value })}
                                                className="input w-full"
                                            />
                                        </label>

                                        <label className="flex flex-col w-24">
                                            <span className="text-gray-700">DV</span>
                                            <input
                                                type="number"
                                                value={dataForm.dv}
                                                onChange={(e) => setDataForm({ ...dataForm, dv: e.target.value })}
                                                className="input w-full"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* FILA 2 */}
                                <div className="flex flex-col md:flex-row gap-3">
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Nombre Fantasia</span>
                                        <input
                                            type="text"
                                            value={dataForm.nombre_fantasia}
                                            onChange={(e) => setDataForm({ ...dataForm, nombre_fantasia: e.target.value })}
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
                                        <span className="text-gray-700">Código Suc.</span>
                                        <input
                                            type="text"
                                            value={dataForm.codigo_suc}
                                            onChange={(e) => setDataForm({ ...dataForm, codigo_suc: e.target.value })}
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
                                            value={dataForm.email}
                                            onChange={(e) => setDataForm({ ...dataForm, email: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                </div>
                                <div className="flex w-full gap-3">
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Cuenta Ingreso Venta</span>
                                        <SelectCustom
                                            options={cuentaList.map((c) => (
                                                { value: c.id, label: c.nombre }
                                            ))}
                                            value={dataForm.cuenta_ingreso_venta}
                                            onChange={(e) => setDataForm({ ...dataForm, cuenta_ingreso_venta: e })}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Cuenta Gasto Compra</span>
                                        <SelectCustom
                                            options={cuentaList.map((c) => (
                                                { value: c.id, label: c.nombre }
                                            ))}
                                            value={dataForm.cuenta_gasto_compra}
                                            onChange={(e) => setDataForm({ ...dataForm, cuenta_gasto_compra: e })}
                                        />
                                    </label>
                                </div>
                                <div className="flex w-full gap-3">
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Cuenta IVA Crédito "Venta"</span>
                                        <SelectCustom
                                            options={cuentaList.map((c) => (
                                                { value: c.id, label: c.nombre }
                                            ))}
                                            value={dataForm.cuenta_iva_credito}
                                            onChange={(e) => setDataForm({ ...dataForm, cuenta_iva_credito: e })}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Cuenta IVA Débito "Compra"</span>
                                        <SelectCustom
                                            options={cuentaList.map((c) => (
                                                { value: c.id, label: c.nombre }
                                            ))}
                                            value={dataForm.cuenta_iva_debito}
                                            onChange={(e) => setDataForm({ ...dataForm, cuenta_iva_debito: e })}
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