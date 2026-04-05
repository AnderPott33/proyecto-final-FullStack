
import { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearFechaInput, formatearNumero } from "../components/FormatoFV";
import { RiBankLine } from "react-icons/ri";
import { MdReceiptLong } from "react-icons/md";
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
    const [puntoList, setPuntoList] = useState([]);
    const [cuentaList, setCuentaList] = useState([]);

    const [timbradoActivo, seTimbradoActivo] = useState();
    const [timbradoList, setTimbradoList] = useState([]);
    const [empresaList, setEmpresaList] = useState([]);
    const [dataForm, setDataForm] = useState({
        numero_timbrado: "",
        fecha_inicio: "",
        fecha_fin: "",
        tipo_documento: "",
        punto_expedicion_id: "",
        empresa_id: "",
        codigo_emp: "",
        codigo_suc: "",
        numero_inicio: "",
        numero_fin: "",
        numero_actual: "",
        estado: "ACTIVO"
    });

    const handleNueva = () => {
        seTimbradoActivo(null);
        setDataForm({
            numero_timbrado: "",
            fecha_inicio: "",
            fecha_fin: "",
            tipo_documento: "",
            punto_expedicion_id: "",
            empresa_id: "",
            codigo_emp: "",
            codigo_suc: "",
            numero_inicio: "",
            numero_fin: "",
            numero_actual: "",
            estado: "ACTIVO"
        });
        setModalOpen(true)
    }

    const handleEditar = (e) => {
        seTimbradoActivo(e);
        setDataForm({
            numero_timbrado: e.numero_timbrado,
            fecha_inicio: formatearFechaInput(e.fecha_inicio),
            fecha_fin: formatearFechaInput(e.fecha_fin),
            tipo_documento: e.tipo_documento,
            punto_expedicion_id: e.punto_expedicion_id,
            empresa_id: e.empresa_id,
            codigo_emp: e.codigo_emp,
            codigo_suc: e.codigo_suc,
            numero_inicio: e.numero_inicio,
            numero_fin: e.numero_fin,
            numero_actual: e.numero_actual,
            estado: e.estado
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

            setPuntoList(response.data);
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
            if (timbradoActivo) {
                await axios.put(`${API}/api/timbrados/actualizarTimbrado/${timbradoActivo.id}`,
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
                await axios.post(`${API}/api/timbrados/agregarTimbrado`,
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
        setDataForm(setDataForm({
            numero_timbrado: "",
            fecha_inicio: "",
            fecha_fin: "",
            tipo_documento: "",
            punto_expedicion_id: "",
            empresa_id: "",
            codigo_emp: "",
            codigo_suc: "",
            numero_inicio: "",
            numero_fin: "",
            numero_actual: "",
            estado: "ACTIVO"
        }));
        setModalOpen(false);
        buscarTimbrados();
    }


    return (
        <>
            <div className="mb-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                    bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                    rounded-md p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
                            <MdReceiptLong />
                            Timbrados
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Administre los timbrados.
                        </p>
                    </div>
                    <div>

                        <button
                            onClick={handleNueva}
                            className="bg-[#35b9ac] hover:bg-[#35b9ac]/80 rounded-md gap-2 cursor-pointer flex justify-center items-center font-semibold p-2 text-white">
                            <FaPlusSquare />
                            Agregar Timbrado
                        </button>
                    </div>
                </div>
            </div>

            <div className=" rounded-md bg-white shadow-sm w-full mb-4 flex flex-col gap-6 overflow-hidden">
                <DataTable
                    data={timbradoList}
                    initialSort={{ column: "id", direction: "ascending" }}
                    columns={[
                        { accessor: "id", header: "ID" },
                        { accessor: "numero_timbrado", header: "Nº Timbrado" },
                        { accessor: "codigo_emp", header: "Código Empresa" },
                        { accessor: "codigo_suc", header: "Código Expedición" },
                        { accessor: "fecha_inicio", header: "Fecha Inicio", cell: (row) => formatearFecha(row.fecha_inicio) },
                        { accessor: "fecha_fin", header: "Fecha Fin", cell: (row) => formatearFecha(row.fecha_fin) },
                        { accessor: "tipo_documento", header: "Tipo Documento" },
                        { accessor: "numero_inicio", header: "Nº Inicio" },
                        { accessor: "numero_fin", header: "Nº Fin" },
                        { accessor: "numero_actual", header: "Nº Actual" },
                        {
                            accessor: "estado", header: "Estado", align: "center",
                            cell: (u) => (
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium
                                    ${u.estado === "ACTIVO" && "bg-green-100 text-green-700"}
                                    ${u.estado === "CANCELADO" && "bg-red-100 text-red-700"}
                                    ${u.estado === "EXPIRADO" && "bg-yellow-100 text-yellow-700"}`}
                                >
                                    {u.estado}
                                </span>
                            ),
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
                                {timbradoActivo ? "Editando Timbrado" : "Agregando Timbrado"}
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
                                    <label className="flex flex-col w-1/2">
                                        <span className="text-gray-700">Nº Timbrado</span>
                                        <input
                                            type="text"
                                            value={dataForm.numero_timbrado}
                                            onChange={(e) => setDataForm({ ...dataForm, numero_timbrado: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-60">
                                        <span className="text-gray-700">Fecha Inicio</span>
                                        <input
                                            type="datetime-local"
                                            value={dataForm.fecha_inicio}
                                            onChange={(e) => setDataForm({ ...dataForm, fecha_inicio: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                    <label className="flex flex-col w-60">
                                        <span className="text-gray-700">Fecha Fin</span>
                                        <input
                                            type="datetime-local"
                                            value={dataForm.fecha_fin}
                                            onChange={(e) => setDataForm({ ...dataForm, fecha_fin: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                </div>

                                {/* FILA 3 */}
                                <div className="flex flex-col md:flex-row gap-3">
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Tipo Documento</span>
                                        <SelectCustom
                                            options={[
                                                { value: "FACTURA", label: "FACTURA" },
                                                { value: "FACTURA AUTOIMPRESOR", label: "FACTURA AUTOIMPRESOR" },
                                                /* { value: "FACTURA ELECTRÓNICA", label: "FACTURA ELECTRÓNICA" }, */
                                                { value: "NOTA CRÉDITO", label: "NOTA CRÉDITO" },
                                                { value: "NOTA DÉBITO", label: "NOTA DÉBITO" },
                                                { value: "RECIBO", label: "RECIBO" },
                                            ]}
                                            value={dataForm.tipo_documento}
                                            onChange={(d) => setDataForm({ ...dataForm, tipo_documento: d })}
                                        />
                                    </label>

                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Código Empresa</span>
                                        <input
                                            type="text"
                                            value={dataForm.codigo_emp}
                                            onChange={(e) => setDataForm({ ...dataForm, codigo_emp: e.target.value })}
                                            readOnly
                                            className="input w-full"
                                        />
                                    </label>

                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Código P. Expedición</span>
                                        <input
                                            type="text"
                                            value={dataForm.codigo_suc}
                                            onChange={(e) => setDataForm({ ...dataForm, codigo_suc: e.target.value })}
                                            readOnly
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
                                            onChange={(value) => {
                                                const empresa = empresaList.find(e => e.id === value);

                                                setDataForm({
                                                    ...dataForm,
                                                    empresa_id: value,
                                                    codigo_emp: empresa?.codigo_suc || ""
                                                });
                                            }}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Punto Expedición</span>
                                        <SelectCustom
                                            options={puntoList?.map((c) => (
                                                { value: c.id, label: c.nombre }
                                            ))}
                                            value={dataForm.punto_expedicion_id}
                                            onChange={(value) => {
                                                const punto = puntoList.find(p => p.id === value);

                                                setDataForm({
                                                    ...dataForm,
                                                    punto_expedicion_id: value,
                                                    codigo_suc: punto?.codigo || ""
                                                });
                                            }}
                                        />
                                    </label>
                                    <label className="flex flex-col w-full md:w-full">
                                        <span className="text-gray-700">Timbrado</span>
                                        <SelectCustom
                                            options={[
                                                { value: "ACTIVO", label: "ACTIVO" },
                                                { value: "CANCELADO", label: "CANCELADO" },
                                                { value: "EXPIRADO", label: "EXPIRADO" },
                                            ]}
                                            value={dataForm.estado}
                                            onChange={(e) => setDataForm({ ...dataForm, estado: e })}
                                        />
                                    </label>
                                </div>
                                <div className="flex gap-3 ">
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Nº Inicio</span>
                                        <input
                                            type="text"
                                            value={dataForm.numero_inicio}
                                            onChange={(e) => setDataForm({ ...dataForm, numero_inicio: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Nº Fin</span>
                                        <input
                                            type="text"
                                            value={dataForm.numero_fin}
                                            onChange={(e) => setDataForm({ ...dataForm, numero_fin: e.target.value })}
                                            className="input w-full"
                                        />
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <span className="text-gray-700">Nº Actual</span>
                                        <input
                                            type="text"
                                            value={dataForm.numero_actual}
                                            onChange={(e) => setDataForm({ ...dataForm, numero_actual: e.target.value })}
                                            className="input w-full"
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
                                    {timbradoActivo ? "Guardar Cambios" : "Agregar"}
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