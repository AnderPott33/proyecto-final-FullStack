import { FaPlusSquare, FaEdit, FaUserFriends } from "react-icons/fa";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function Entidades() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const { puedeAcceder, puede } = usePermiso();
const tienePermiso = puedeAcceder("entidades")
  useEffect(() => {
        if (!tienePermiso) { navigate("/error-permiso"); }
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [entidades, setEntidades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDocumento, setBusquedaDocumento] = useState("");
  const [estado, setEstado] = useState("");
  const [datosRuc, setDatosRuc] = useState(null);

  // Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [entidadActiva, setEntidadActiva] = useState(null);

  const [formData, setFormData] = useState({
    tipo: "CLIENTE",
    nombre: "",
    tipo_documento: "CI",
    ruc: "",
    documento_identidad: "",
    telefono: "",
    email: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "Paraguay",
    estado: "ACTIVO",
    es_generico: false,
    observaciones: "",
  });

  useEffect(() => {
    obtenerEntidades();
  }, []);

  // Función para traer datos del RUC
  const obtenerDatosRuc = async (ruc) => {
    try {
      const res = await axios.get(`https://turuc.com.py/api/contribuyente?ruc=${ruc}`);
      return res.data.data;
    } catch (error) {
      // NO mostramos error cada vez, solo retornamos null silenciosamente
      return null;
    }
  };

  useEffect(() => {
    if (!formData.documento_identidad || formData.documento_identidad.length < 6) {
      setDatosRuc(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const datos = await obtenerDatosRuc(formData.documento_identidad);

      if (datos) {
        setDatosRuc(datos);
        setFormData((prev) => ({
          ...prev,
          nombre: datos.razonSocial ?? prev.nombre,
          ruc: datos.ruc ?? prev.ruc,
          direccion: datos.direccion ?? prev.direccion,
          ciudad: datos.ciudad ?? prev.ciudad,
          departamento: datos.departamento ?? prev.departamento,
        }));
      } else {
        // Si la API no devuelve nada, simplemente mantenemos lo que el usuario escribió
        setDatosRuc(null);
        // No cambiamos formData, así se guarda manualmente lo que escribió
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.documento_identidad]);


  const obtenerEntidades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/entidades`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEntidades(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener entidades:", error);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  const handleNuevo = () => {
    setEntidadActiva(null);
    setFormData({
      tipo: "CLIENTE",
      nombre: "",
      tipo_documento: "CI",
      ruc: "",
      documento_identidad: "",
      telefono: "",
      email: "",
      direccion: "",
      ciudad: "",
      departamento: "",
      pais: "Paraguay",
      estado: "ACTIVO",
      es_generico: false,
      observaciones: "",
    });
    setMostrarModal(true);
  };

  const handleEditar = (e) => {
    setEntidadActiva(e);
    setFormData({
      tipo: e.tipo,
      nombre: e.nombre,
      tipo_documento: e.tipo_documento,
      ruc: e.ruc,
      documento_identidad: e.documento_identidad,
      telefono: e.telefono,
      email: e.email,
      direccion: e.direccion,
      ciudad: e.ciudad,
      departamento: e.departamento,
      pais: e.pais,
      estado: e.estado,
      es_generico: e.es_generico,
      observaciones: e.observaciones,
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const payload = { ...formData }; // tomará exactamente lo que el usuario puso

      if (entidadActiva) {
        await axios.put(
          `${API}/api/entidades/${entidadActiva.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Entidad actualizada correctamente",
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
        await axios.post(
          `${API}/api/entidades/nueva`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Nueva entidad creada correctamente",
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

      setMostrarModal(false);
      obtenerEntidades();
    } catch (error) {
      console.error("Error guardando entidad:", error);
      Swal.fire({
        title: "Error al guardar entidad",
        icon: "error",
        iconColor: "orange",
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

  // Filtrado frontend
  const entidadesFiltradas = entidades.filter(
    (e) =>
      e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
      e.documento_identidad?.toLowerCase().includes(busquedaDocumento.toLowerCase()) &&
      (estado === "" || e.estado === estado)
  );

  const estadoOptions = [
    { value: "", label: "Todos" },
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "BLOQUEADO", label: "Bloqueado" },
  ];

  if (loading) return <Loader />;

  return (
    <>
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99] rounded-md p-8 shadow-xl shadow-gray-400/30">
        <div>
          <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
            <FaUserFriends />
            Entidades
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Gestión de clientes y proveedores
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input w-full"
        />
        <input
          type="text"
          placeholder="Buscar por documento..."
          value={busquedaDocumento}
          onChange={(e) => setBusquedaDocumento(e.target.value)}
          className="input w-full"
        />

        <div className="w-full">
          <SelectCustom
            options={estadoOptions}
            value={estado}
            onChange={setEstado}
          />
        </div>

        <button
          onClick={() => {
            setBusqueda("");
            setBusquedaDocumento("");
            setEstado("");
          }}
          className="bg-red-500 w-full hover:bg-red-600 text-white px-3 py-3 font-semibold rounded-md cursor-pointer transition-all"
        >
          Limpiar filtros
        </button>

        <button
          onClick={handleNuevo}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-md
                     bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white
                     hover:scale-105 hover:brightness-105 transition-all duration-200
                     shadow-md cursor-pointer font-semibold text-sm"
        >
          <FaPlusSquare /> Nuevo
        </button>
      </div>

      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
        <DataTable
          data={entidadesFiltradas}
          initialSort={{ column: "id", direction: "ascending" }}
          columns={[
            { header: "ID", accessor: "id", sortable: true },
            { header: "Nombre", accessor: "nombre", sortable: true },
            { header: "Documento", accessor: "documento_identidad", sortable: true },
            { header: "RUC", accessor: "ruc", sortable: true },
            {
              header: "Tipo",
              accessor: "tipo",
              sortable: true,
              align: "center",
            },
            {
              header: "Genérico",
              accessor: "es_generico",
              align: "center",
              cell: (e) => (e.es_generico ? "Sí" : "No"),
            },
            {
              header: "Estado",
              accessor: "estado",
              sortable: true,
              align: "center",
              cell: (e) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                    ${e.estado === "ACTIVO" && "bg-green-100 text-green-700"}
                    ${e.estado === "INACTIVO" && "bg-red-100 text-red-700"}
                    ${e.estado === "BLOQUEADO" && "bg-yellow-100 text-yellow-700"}`}
                >
                  {e.estado}
                </span>
              ),
            },
            {
              header: "Acciones",
              accessor: "acciones",
              align: "center",
              cell: (e) => (
                <button
                  onClick={() => handleEditar(e)}
                  className="p-2 rounded-md bg-blue-50 text-[#35b9ac]
                             hover:bg-[#35b9ac] hover:text-white
                             transition-transform duration-200 cursor-pointer"
                >
                  <FaEdit />
                </button>
              ),
            },
          ]}
        />
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-[800px] rounded-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {entidadActiva ? "Editar Entidad" : "Nueva Entidad"}
              </h2>
              <button onClick={() => setMostrarModal(false)} className="text-gray-500 hover:text-red-700 text-xl font-bold cursor-pointer">x</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-3">
                <label className="flex flex-col gap-2 w-full">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Nombre</span>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 w-80">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Tipo Entidad</span>
                  <SelectCustom
                    options={[
                      { value: "CLIENTE", label: "CLIENTE" },
                      { value: "PROVEEDOR", label: "PROVEEDOR" },
                      { value: "FUNCIONARIO", label: "FUNCIONARIO" },
                      { value: "SOCIO", label: "SOCIO" },
                      { value: "BANCO", label: "BANCO" },
                    ]}
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e })}
                  />
                </label>
              </div>
              <div className="flex gap-4">
                <label className="flex flex-col gap-2 w-1/2">
                  <span className="text-gray-700 ml-2 font-medium text-sm">CI</span>
                  <input
                    type="text"
                    placeholder="Documento Identidad"
                    className="input"
                    value={formData.documento_identidad}
                    onChange={(e) =>
                      setFormData({ ...formData, documento_identidad: e.target.value })
                    }
                  />
                  {!formData.documento_identidad ? <span className="text-red-500 text-sm fixed mt-20">* Cargue el documento para traer los datos de la DNIT</span> : ""}
                </label>
                <label className="flex flex-col gap-2 w-1/2">
                  <span className="text-gray-700 ml-2 font-medium text-sm">RUC</span>
                  <input
                    type="text"
                    placeholder="RUC"
                    className="input"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2 w-full">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Teléfono</span>
                  <input
                    type="text"
                    placeholder="Teléfono"
                    className="input"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 w-full">
                <span className="text-gray-700 ml-2 font-medium text-sm">E-mail</span>
                <input
                  type="email"
                  placeholder="Email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </label>
              <div className="flex w-full gap-4">
                <label className="flex flex-col gap-2 w-1/2">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Dirección</span>
                  <input
                    type="text"
                    placeholder="Dirección"
                    className="input"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2 w-1/2">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Ciudad</span>
                  <input
                    type="text"
                    placeholder="Ciudad"
                    className="input"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2 w-1/2">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Departamento</span>
                  <input
                    type="text"
                    placeholder="Departamento"
                    className="input"
                    value={formData.departamento}
                    onChange={(e) =>
                      setFormData({ ...formData, departamento: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 w-full">
                <span className="text-gray-700 ml-2 font-medium text-sm">País</span>
                <input
                  type="text"
                  placeholder="País"
                  className="input"
                  value={formData.pais}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                />
              </label>
              <div className="flex gap-4">
                <label className="flex flex-col gap-2 w-full">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Cliente Ocasional</span>
                  <SelectCustom
                    options={[
                      { value: true, label: "Sí" },
                      { value: false, label: "No" },
                    ]}
                    value={formData.es_generico}
                    onChange={(v) => setFormData({ ...formData, es_generico: v })}
                  />
                </label>
                <label className="flex flex-col gap-2 w-full">
                  <span className="text-gray-700 ml-2 font-medium text-sm">Estado</span>
                  <SelectCustom
                    disabled={puede("inactivar_entidad")}
                    options={[
                      { value: "ACTIVO", label: "Activo" },
                      { value: "BLOQUEADO", label: "Bloqueado" },
                      { value: "INACTIVO", label: "Inactivo" },
                    ]}
                    value={formData.estado}
                    onChange={(v) => setFormData({ ...formData, estado: v })}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white cursor-pointer"
                >
                  {entidadActiva ? "Guardar Cambios" : "Agregar Entidad"}
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