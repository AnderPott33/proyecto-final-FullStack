import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlusSquare, FaEdit } from "react-icons/fa";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { FaSitemap } from "react-icons/fa6";
import { usePermiso } from "../hooks/usePermiso";

export default function CuentasFinancieras() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { puedeAcceder, puede } = usePermiso();
  const tienePermiso = puedeAcceder("cuentas")
  useEffect(() => {
    if (!tienePermiso) { navigate("/error-permiso"); }
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  const [loading, setLoading] = useState(true);
  const [moneda, setMoneda] = useState("PYG");
  const [naturaleza, setNaturaleza] = useState("");
  const [tipo, setTipo] = useState("BANCO");
  const [subTipo, setSubTipo] = useState("");
  const [grupo, setGrupo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaActiva, setCuentaActiva] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    banco: "",
    numero_cuenta: "",
    saldo_inicial: 0,
    sub_tipo: "",
    codigo: "",
    naturaleza: "",
    tipo_contable: "",
    cuenta_raiz: ""
  });

  const [busquedaId, setBusquedaId] = useState("");
  const [busquedaTipo, setBusquedaTipo] = useState("");
  const [busquedaBanco, setBusquedaBanco] = useState("");
  const [busquedaGrupo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [estadoC, setEstadoC] = useState("ACTIVA");

  useEffect(() => {
    obtenerCuentas();
  }, []);

  const obtenerCuentas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/cuenta`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) setCuentas(res.data);
      else if (Array.isArray(res.data.cuentas)) setCuentas(res.data.cuentas);
      else setCuentas([]);
    } catch (error) {
      console.error("Error al obtener cuentas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNueva = () => {
    setCuentaActiva(null);
    setFormData({
      nombre: "",
      banco: "",
      numero_cuenta: "",
      moneda: "PYG",
      saldo_inicial: 0,
      sub_tipo: "",
      codigo: "",
      naturaleza: "",
      tipo_contable: "",
      cuenta_raiz: ""
    });
    setMoneda("PYG");
    setEstadoC("ACTIVA");
    setNaturaleza("");
    setTipo("BANCO");
    setGrupo("");
    setSubTipo("");
    setModalOpen(true);
  };

  const handleEditar = (cuenta) => {
    setCuentaActiva(cuenta);
    setFormData({
      nombre: cuenta.nombre || "",
      tipo: cuenta.tipo || "",
      banco: cuenta.banco || "",
      numero_cuenta: cuenta.numero_cuenta || "",
      saldo_inicial: cuenta.saldo_inicial || 0,
      sub_tipo: cuenta.sub_tipo || "",
      naturaleza: cuenta.naturaleza || "",
      codigo: cuenta.codigo || "",
      tipo_contable: cuenta.tipo_contable || "",
      cuenta_raiz: cuenta.cuenta_raiz || ""
    });
    setMoneda(cuenta.moneda || "PYG");
    setTipo(cuenta.tipo || "BANCO");
    setSubTipo(cuenta.sub_tipo || "");
    setNaturaleza(cuenta.naturaleza || "");
    setEstadoC(cuenta.estado || "ACTIVA");
    setGrupo(cuenta.grupo || "");
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const cuentasFiltradas = cuentas.filter((u) => {
    const matchId =
      !busquedaId || u.id?.toString().toLowerCase().includes(busquedaId.toLowerCase());
    const matchNombre =
      !busqueda || u.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo =
      !busquedaTipo || u.tipo?.toLowerCase().includes(busquedaTipo.toLowerCase());
    const matchBanco =
      !busquedaBanco || u.banco?.toLowerCase().includes(busquedaBanco.toLowerCase());
    const matchEstado = estado === "" || u.estado === estado;
    const matchGrupo = busquedaGrupo === "" || u.grupo === busquedaGrupo;

    return matchId && matchNombre && matchTipo && matchBanco && matchEstado && matchGrupo;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Payload con todos los campos correctamente referenciados
      const payload = {
        nombre: formData.nombre,
        tipo,                  // desde estado
        banco: formData.banco,
        numero_cuenta: formData.numero_cuenta,
        moneda,
        saldo_inicial: formData.saldo_inicial,
        estado: estadoC,
        sub_tipo: subTipo,      // desde estado
        grupo: grupo,           // desde estado
        codigo: formData.codigo,
        naturaleza,            // desde estado
        tipo_contable: formData.tipo_contable,
        cuenta_raiz: formData.cuenta_raiz
      };

      const url = cuentaActiva
        ? `${API}/api/cuenta/${cuentaActiva.id}`
        : `${API}/api/cuenta`;

      const method = cuentaActiva ? axios.put : axios.post;

      await method(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        title: cuentaActiva ? "Cuenta actualizada" : "Cuenta registrada",
        icon: "success",
        background: "#1f2937",
        color: "white",
      });

      // Limpiar formulario y estados
      setFormData({
        nombre: "",
        tipo: "",
        banco: "",
        numero_cuenta: "",
        saldo_inicial: 0,
        sub_tipo: "",
        naturaleza: "",
        codigo: "",
      });
      setMoneda("PYG");
      setTipo("BANCO");
      setSubTipo("");
      setGrupo("");
      setNaturaleza("");
      setCuentaActiva(null);
      setModalOpen(false);

      // Refrescar cuentas
      obtenerCuentas();
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error al registrar/actualizar cuenta",
        icon: "error",
        background: "#1f2937",
        color: "white",
      });
    }
  };

  const grupoList = [
    { tipo: "GASTO", nombre: "GASTOS TRIBUTARIOS" },
    { tipo: "GASTO", nombre: "GASTOS ADMINISTRATIVOS" },
    { tipo: "GASTO", nombre: "GASTOS DE PERSONALES" },
    { tipo: "GASTO", nombre: "GASTOS DE VENTAS" },
    { tipo: "GASTO", nombre: "COSTO DE PRODUCCION" },
    { tipo: "GASTO", nombre: "GASTOS FINANCIEROS" },
    { tipo: "GASTO", nombre: "GASTOS NO OPERACIONALES" },
    { tipo: "GASTO", nombre: "GASTOS DIVERSOS" },
    { tipo: "INGRESO", nombre: "DEVOLUCIONES DE VENTAS" },
    { tipo: "INGRESO", nombre: "INGRESOS FINANCIEROS" },
    { tipo: "INGRESO", nombre: "INGRESOS NO OPERATIVOS" },
    { tipo: "INGRESO", nombre: "INGRESOS DIVERSOS" },
    { tipo: "INGRESO", nombre: "PRESTACION DE SERVICIO" },
    { tipo: "INGRESO", nombre: "VENTAS DE MERCADERIAS" },
    { tipo: "ACTIVO", nombre: "OPERACIONES DE INMOVILIZADOS" },
    { tipo: "ACTIVO", nombre: "OPERACIONES DE STOCK" },
    { tipo: "ACTIVO", nombre: "OTRAS OPERACIONES" },
    { tipo: "ACTIVO", nombre: "OPERACION DE INMOBILIZADOS" },
    { tipo: "ACTIVO", nombre: "DISPONIBILIDADES" },
    // PASIVO
    { tipo: "PASIVO", nombre: "PROVEEDORES" },
    { tipo: "PASIVO", nombre: "OBLIGACIONES BANCARIAS" },
    { tipo: "PASIVO", nombre: "IMPUESTOS POR PAGAR" },
    { tipo: "PASIVO", nombre: "OTROS PASIVOS" },
    { tipo: "PASIVO", nombre: "CUENTAS POR PAGAR" },
    // PATRIMONIO
    { tipo: "PATRIMONIO", nombre: "CAPITAL SOCIAL" },
    { tipo: "PATRIMONIO", nombre: "RESERVAS" },
    { tipo: "PATRIMONIO", nombre: "UTILIDADES RETENIDAS" },
    { tipo: "PATRIMONIO", nombre: "RESULTADO DEL EJERCICIO" }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 200);
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      {/* HEADER */}
      <div className="mb-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                      bg-gradient-to-r from-[#3ba0b4] via-[#359bac] to-[#2d8c99]
                      rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-2xl md:text-4xl flex gap-2 font-bold text-white tracking-wide">
              <FaSitemap />
              Cuentas Financieras
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Gestión de cuentas del sistema
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 mb-2 bg-white p-4 rounded-md shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 w-full">

          <input type="number" placeholder="Buscar Id..." value={busquedaId}
            onChange={(e) => setBusquedaId(e.target.value)}
            className="input w-full" />

          <input type="text" placeholder="Buscar Nombre..." value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input w-full" />

          <input type="text" placeholder="Buscar Grupo..." value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            className="input w-full" />

          <input type="text" placeholder="Buscar Tipo..." value={busquedaTipo}
            onChange={(e) => setBusquedaTipo(e.target.value)}
            className="input w-full" />

          <input type="text" placeholder="Buscar Banco..." value={busquedaBanco}
            onChange={(e) => setBusquedaBanco(e.target.value)}
            className="input w-full" />

          <SelectCustom
            options={[
              { value: "", label: "Todos" },
              { value: "ACTIVA", label: "Activa" },
              { value: "INACTIVA", label: "Inactiva" },
            ]}
            value={estado}
            onChange={setEstado}
            className="w-full"
          />

          <button
            onClick={handleNueva}
            disabled={!puede("crear")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md
                     bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white 
                     hover:brightness-105 shadow-md transition-all text-sm font-semibold"
          >
            <FaPlusSquare /> Nuevo
          </button>
        <button
          onClick={() => {
            setBusquedaId("");
            setBusqueda("");
            setBusquedaTipo("");
            setBusquedaBanco("");
            setEstado("");
          }}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-3 font-semibold rounded-md"
        >
          Limpiar filtros
        </button>
        </div>


      </div>

      {/* TABLA */}
      <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1100px]">
            <DataTable
              data={cuentasFiltradas}
              initialSort={{ column: "codigo", direction: "ascending" }}
              columns={[
                { header: "ID", accessor: "id", sortable: true },
                { header: "Código", accessor: "codigo", sortable: true },
                { header: "Nombre", accessor: "nombre", sortable: true },
                { header: "Tipo", accessor: "tipo", sortable: true },
                { header: "Sub-Tipo", accessor: "sub_tipo", sortable: true },
                { header: "Grupo", accessor: "grupo", sortable: true },
                { header: "Banco", accessor: "banco", sortable: true },
                {
                  header: "Estado",
                  accessor: "estado",
                  sortable: true,
                  align: "center",
                  cell: (u) => (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${u.estado === "ACTIVA" && "bg-green-100 text-green-700"}
                    ${u.estado === "INACTIVA" && "bg-red-100 text-red-700"}`}>
                      {u.estado}
                    </span>
                  ),
                },
                {
                  header: "Acciones",
                  accessor: "acciones",
                  align: "center",
                  cell: (u) =>
                    !u.sistema ? (
                      <button
                        onClick={() => handleEditar(u)}
                        disabled={!puede("editar")}
                        className="cursor-pointer p-2 rounded-md bg-blue-50 text-[#35b9ac] 
                   hover:bg-[#35b9ac] hover:text-white transition"
                      >
                        <FaEdit />
                      </button>
                    ) : (
                      <div className="relative group inline-block">
                        <button
                          disabled
                          className="p-2 rounded-md bg-blue-50 text-[#35b9ac] 
                     opacity-50 cursor-not-allowed"
                        >
                          <FaEdit />
                        </button>

                        {/* Tooltip */}
                        <div className="
                            absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                            bg-gray-800 text-white text-xs px-2 py-1 rounded
                            opacity-0 group-hover:opacity-100 transition-opacity
                            pointer-events-none z-100
                            max-w-[200px] text-center break-words
                          ">
                          Las cuentas del sistema no se pueden editar
                        </div>
                      </div>
                    ),
                }
              ]}
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-[1000px] max-h-[90vh]  rounded-md shadow-xl p-6">

            {/* HEADER MODAL */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {cuentaActiva ? "Editar Cuenta" : "Nueva Cuenta"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-red-700 text-xl font-bold"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* FILA 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <label>
                  <span className="text-gray-700">Nombre</span>
                  <input name="nombre" value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre"
                    className="input w-full" />
                </label>
                <label>
                  <span className="text-gray-700">Naturaleza</span>
                  <SelectCustom
                    options={[
                      { value: "DEUDORA", label: "DEUDORA" },
                      { value: "ACREDORA", label: "ACREDORA" },
                    ]}
                    value={naturaleza}
                    onChange={setNaturaleza}
                  />
                </label>
                <label>
                  <span className="text-gray-700">Estado</span>
                  <SelectCustom
                    options={[
                      { value: "ACTIVA", label: "Activa" },
                      { value: "INACTIVA", label: "Inactiva" },
                    ]}
                    value={estadoC}
                    onChange={setEstadoC}
                  />
                </label>
                <label>
                  <span className="text-gray-700">Código</span>
                  <input name="codigo" value={formData.codigo}
                    onChange={handleChange}
                    placeholder="Código"
                    className="input w-full" />
                </label>
              </div>

              {/* FILA 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <label>
                  <span className="text-gray-700">Moneda</span>
                  <SelectCustom
                    options={[
                      { value: "PYG", label: "Guaraní" },
                      { value: "USD", label: "Dólar" },
                      { value: "BRL", label: "Real" },
                    ]}
                    value={moneda}
                    onChange={setMoneda}
                  />
                </label>
                <label>
                  <span className="text-gray-700">Tipo</span>
                  <SelectCustom
                    options={[{ value: "ACTIVO", label: "ACTIVO" }, { value: "PASIVO", label: "PASIVO" }, { value: "PATRIMONIO", label: "PATRIMONIO" }, { value: "INGRESO", label: "INGRESO" }, { value: "GASTO", label: "GASTO" }, { value: "OTROS", label: "OTROS" },]}
                    value={tipo}
                    onChange={setTipo}
                  />
                </label>
                <label>
                  <span className="text-gray-700">Sub-Tipo</span>
                  <SelectCustom
                    options={[{ value: "EFECTIVO", label: "EFECTIVO" }, { value: "BANCO", label: "BANCO" }, { value: "PATRIMONIO", label: "PATRIMONIO" }, { value: "INGRESO", label: "INGRESO" }, { value: "GASTO", label: "GASTO" }, { value: "OTROS", label: "OTROS" }, { value: "CUENTA RAIZ", label: "CUENTA RAIZ" }]}
                    value={subTipo}
                    onChange={setSubTipo}
                  />
                </label>
                <label>
                  <span className="text-gray-700">Grupo</span>
                  <SelectCustom
                    options={grupoList
                      .filter(g => g.tipo === tipo)
                      .map(g => ({ value: g.nombre, label: g.nombre }))}
                    value={grupo}
                    onChange={setGrupo}
                  />
                </label>

              </div>

              {/* FILA 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label>
                  <span className="text-gray-700">Banco</span>
                  <input name="banco" value={formData.banco}
                    onChange={handleChange}
                    placeholder="Banco"
                    className="input w-full" />
                </label>
                <label>
                  <span className="text-gray-700">Número Cuenta</span>
                  <input name="numero_cuenta" value={formData.numero_cuenta}
                    onChange={handleChange}
                    placeholder="Número de cuenta"
                    className="input w-full" />
                </label>
              </div>
              {/* Fila 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label>
                  <span className="text-gray-700">Cuenta Raiz</span>
                  <SelectCustom
                    options={cuentas.filter(c => c.tipo_contable === 'SINTÉTICA').map(e => (
                      { value: e.id, label: e.nombre }
                    ))}
                    value={formData.cuenta_raiz}
                    onChange={e => setFormData({ ...formData, cuenta_raiz: e })}
                  />
                </label>
                <label>
                  <span className="text-gray-700">Tipo Contable</span>
                  <SelectCustom
                    options={[
                      { value: "SINTÉTICA", label: "SINTÉTICA" },
                      { value: "ANALÍTICA", label: "ANALÍTICA" },
                    ]}
                    value={formData.tipo_contable}
                    onChange={e => setFormData({ ...formData, tipo_contable: e })}
                  />
                </label>
              </div>

              {/* BOTONES */}
              <div className="flex flex-col sm:flex-row justify-end gap-4">

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-md"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="cursor-pointer bg-[#35b9ac] hover:bg-[#2da89c] text-white px-6 py-3 rounded-md"
                >
                  {cuentaActiva ? "Actualizar" : "Registrar"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}