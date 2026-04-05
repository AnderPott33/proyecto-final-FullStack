import { FaPlusSquare, FaEdit, FaUserFriends } from "react-icons/fa";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import Loader from "../components/Loader";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from 'react-router-dom'

export default function Usuarios() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate()
  const { puedeAcceder, puede } = usePermiso();
const tienePermiso = puedeAcceder("usuarios")
  useEffect(() => {
    if (!tienePermiso) { navigate("/error-permiso"); }
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaEmail, setBusquedaEmail] = useState("");
  const [estado, setEstado] = useState("");
  const { usuario: usuarioLogueado } = useContext(AuthContext);

  // Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "",
    estado: "ACTIVO",
    password: "",
  });

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) setUsuarios(res.data);
      else if (Array.isArray(res.data.usuarios)) setUsuarios(res.data.usuarios);
      else setUsuarios([]);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  const handleNuevo = () => {
    setUsuarioActivo(null);
    setFormData({ nombre: "", email: "", rol: "", estado: "ACTIVO", password: "" });
    setMostrarModal(true);
  };

  const handleEditar = (u) => {
    setUsuarioActivo(u);
    setFormData({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      estado: u.estado,
      password: "",
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (usuarioActivo) {
        await axios.put(
          `${API}/api/auth/${usuarioActivo.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Usuario actualizado correctamente",
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
          `${API}/api/auth/register`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Nuevo usuario creado correctamente",
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
      obtenerUsuarios();
    } catch (error) {
      console.error("Error guardando usuario:", error);
      Swal.fire({
        title: "Error al guardar usuario",
        icon: "error",
        iconColor: "red",
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
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
      u.email?.toLowerCase().includes(busquedaEmail.toLowerCase()) &&
      (estado === "" || u.estado === estado)
  );

  const estadoOptions = [
    { value: "", label: "Todos" },
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "BLOQUEADO", label: "Bloqueado" },
  ];

  const rolOptions = [
    ...(usuarioLogueado?.rol === "SUPERADMIN"
      ? [{ value: "SUPERADMIN", label: "Root" }]
      : []),
    { value: "ADMIN", label: "Administrador" },
    { value: "CAJERO", label: "Cajero" },
    { value: "ENCARGADO_COMPRAS", label: "Encargado Compras" },
    { value: "CONTABILIDAD", label: "Contabilidad" },
    { value: "SUPERVISOR_CAJA", label: "Supervisor Caja" },
    { value: "SUPERVISOR", label: "Supervisor" },
  ];


  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 200);
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      {/* HEADER */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                      bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
                      rounded-md p-6 md:p-8 shadow-xl shadow-gray-400/30 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl sm:text-4xl flex gap-2 font-bold text-white tracking-wide">
              <FaUserFriends />
              Usuarios
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Gestión de usuarios del sistema
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input w-full sm:w-auto"
        />
        <input
          type="text"
          placeholder="Buscar por email..."
          value={busquedaEmail}
          onChange={(e) => setBusquedaEmail(e.target.value)}
          className="input w-full sm:w-auto"
        />

        {/* SELECT ESTADO */}
        <div className="w-full sm:w-48">
          <SelectCustom
            options={estadoOptions}
            value={estado}
            onChange={setEstado}
          />
        </div>

        {/* BOTONES */}
        <button
          onClick={() => {
            setBusqueda("");
            setBusquedaEmail("");
            setEstado("");
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-3 font-semibold rounded-md cursor-pointer transition-all w-full sm:w-auto"
        >
          Limpiar filtros
        </button>

        <button
          onClick={handleNuevo}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-md
                   bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white
                   hover:scale-105 hover:brightness-105 transition-all duration-200
                   shadow-md cursor-pointer font-semibold text-sm w-full sm:w-auto"
        >
          <FaPlusSquare /> Nuevo
        </button>
      </div>

      {/* TABLA */}
      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-x-auto">
        <DataTable
          data={usuariosFiltrados}
          initialSort={{ column: "id", direction: "ascending" }}
          columns={[
            { header: "ID", accessor: "id", sortable: true },
            { header: "Nombre", accessor: "nombre", sortable: true },
            { header: "E-mail", accessor: "email", sortable: true },
            { header: "Rol", accessor: "rol", sortable: true, align: "center" },
            {
              header: "Estado",
              accessor: "estado",
              sortable: true,
              align: "center",
              cell: (u) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                  ${u.estado === "ACTIVO" && "bg-green-100 text-green-700"}
                  ${u.estado === "INACTIVO" && "bg-red-100 text-red-700"}
                  ${u.estado === "BLOQUEADO" && "bg-yellow-100 text-yellow-700"}`}
                >
                  {u.estado}
                </span>
              ),
            },
            {
              header: "Acciones",
              accessor: "acciones",
              align: "center",
              cell: (u) => (
                <button
                  onClick={() => handleEditar(u)}
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

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md sm:max-w-lg md:max-w-xl rounded-3xl shadow-2xl p-6 mx-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {usuarioActivo ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <p className="text-gray-500 text-sm">Complete los datos del usuario</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full bg-neutral-50 border border-gray-200 text-gray-700 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] focus:ring-2 focus:ring-[#35b9ac]/20 outline-none
                         shadow-sm transition-all duration-300 font-semibold text-sm placeholder:text-gray-400"
                required
              />

              <input
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-neutral-50 border border-gray-200 text-gray-700 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] focus:ring-2 focus:ring-[#35b9ac]/20 outline-none
                         shadow-sm transition-all duration-300 font-semibold text-sm placeholder:text-gray-400"
                required
              />

              <SelectCustom
                options={rolOptions}
                value={formData.rol}
                onChange={(value) => setFormData({ ...formData, rol: value })}
              />

              <input
                type="password"
                placeholder="Contraseña (opcional)"
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-neutral-50 border border-gray-200 text-gray-700 px-5 py-3.5 rounded-md
                         focus:border-[#35b9ac] focus:ring-2 focus:ring-[#35b9ac]/20 outline-none
                         shadow-sm transition-all duration-300 font-semibold text-sm placeholder:text-gray-400"
              />

              <SelectCustom
                options={[
                  { value: "ACTIVO", label: "Activo" },
                  { value: "BLOQUEADO", label: "Bloqueado" },
                  { value: "INACTIVO", label: "Inactivo" },
                ]}
                value={formData.estado}
                onChange={(value) => setFormData({ ...formData, estado: value })}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-100 cursor-pointer font-semibold hover:bg-gray-200 text-gray-700 w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md cursor-pointer bg-gradient-to-r from-[#35b9ac] to-[#2da89c]
                           hover:scale-105 hover:brightness-105 text-white transition-all font-semibold w-full sm:w-auto"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}