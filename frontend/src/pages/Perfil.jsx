import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Loader from "../components/Loader";
import SelectCustom from "../components/SelectCustom";
import Swal from "sweetalert2";
import { FaUser, FaSave } from "react-icons/fa";

export default function PerfilUsuario() {
  const API = import.meta.env.VITE_API_URL;
  const { usuario, actualizarUsuario } = useContext(AuthContext);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    estado: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
console.log(usuario);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || "",
        email: usuario.email || "",
        password: "",
        estado: usuario.estado || "",
      });
      setLoading(false);
    }
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API}/api/auth/${usuario.id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        title: "Perfil actualizado",
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

     /*  actualizarUsuario(res.data); */
      setForm((prev) => ({ ...prev, password: "" }));

      actualizarUsuario({
  ...usuario, // campos que no cambian
  nombre: form.nombre,
  email: form.email,
  // opcionalmente actualizar estado si lo cambiaste
});
   
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el perfil.",
        icon: "error",
        background: "#1f2937",
        color: "white",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-red-600 px-4 py-2 rounded-md text-white hover:brightness-105 transition cursor-pointer",
        },
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
              <FaUser /> Mi Perfil
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Administra tu información personal.
            </p>
          </div>
          <div>

          </div>
        </div>
      </div>

       <div className="flex-1 flex justify-center items-start">
        <div className="bg-white rounded-md shadow-xl w-full  p-12">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-6">
              <label className="flex flex-col w-full">
                <span className="text-gray-700 text-lg font-semibold">Nombre</span>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="input w-full text-lg"
                />
              </label>

              <label className="flex flex-col w-full">
                <span className="text-gray-700 text-lg font-semibold">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input w-full text-lg"
                />
              </label>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <label className="flex flex-col w-full md:w-60">
                <span className="text-gray-700 text-lg font-semibold">Estado</span>
                <SelectCustom
                  options={[
                    { value: "ACTIVO", label: "ACTIVO" },
                    { value: "INACTIVO", label: "INACTIVO" },
                  ]}
                  value={form.estado}
                  disabled
                  onChange={(e) => setForm({ ...form, estado: e })}
                />
              </label>

              <label className="flex flex-col w-full md:w-full">
                <span className="text-gray-700 text-lg font-semibold">
                  Contraseña (dejar en blanco para no cambiar)
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input w-full text-lg"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#35b9ac] hover:bg-[#35b9ac]/80 text-white rounded-md font-semibold text-lg transition"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}