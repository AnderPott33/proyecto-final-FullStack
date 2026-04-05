import { useState, useContext, useEffect } from "react";
import SelectCustom from "../components/SelectCustom";
import { AuthContext } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import { FaPlusSquare, FaCheckCircle, FaMinusSquare } from "react-icons/fa";
import { formatearNumero } from "../components/FormatoFV";
import axios from "axios";
import { useCaja } from "../context/CajaContext";
import Swal from "sweetalert2";
import Loader from "../components/Loader";
import { FaArrowDown } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { usePermiso } from "../hooks/usePermiso";

export default function PagaValores() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { puedeAcceder, puede } = usePermiso();
  const tienePermiso = puedeAcceder("paga_valores")
  useEffect(() => {
    if (!tienePermiso) { navigate("/error-permiso"); }
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
  /* Referencia al cargando... */
  const [loading, setLoading] = useState(true);
  /* Modales para abrir y cerrar */
  const [openModal, setOpenModal] = useState(false);
  const [openModalBaja, setOpenModalBaja] = useState(false);
  /* Campos para los forms de los modales */
  const [entidad, setEntidad] = useState([]);
  const [entidadSelect, setEntidadSelect] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState(null);
  const [formaPago, setFormaPago] = useState([]);
  const [formaPagoId, setFormaPagoId] = useState(null);
  const [cuentasList, setCuentasList] = useState([]);
  const [cuentaSelect, setCuentaSelect] = useState(null);
  const [monedaCta, setMonedaCta] = useState('')
  const [cambio, setCambio] = useState(1);
  const [itemsDetalle, setItemsDetalle] = useState([]);
  /* Campos para el encabezado */
  const { caja } = useCaja();
  const { usuario, puntoSeleccionado } = useContext(AuthContext);
  const [moneda, setMoneda] = useState("PYG");
  const [fecha, setFecha] = useState(() => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, "0");
    const day = String(ahora.getDate()).padStart(2, "0");
    const hours = String(ahora.getHours()).padStart(2, "0");
    const minutes = String(ahora.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  useEffect(() => {
    if (!caja) {
      navigate("/cajas/registrar");
    }
  }, [navigate])

  // FETCH FORMAS DE PAGO
  const encontformaPago = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/formaPago`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data || [];
    } catch (error) {
      console.error("No se encontraron formas de pagos:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchFormas = async () => {
      const data = await encontformaPago();
      setFormaPago(data || []);
    };
    fetchFormas();
  }, []);


  // FETCH CUENTA POR FORMA DE PAGO
  const obtenerCuentas = async () => {
    if (!formaPagoId) return [];
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/api/cuenta/formaPago`,
        { id: formaPagoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cuentas = res.data?.flat ? res.data.flat() : res.data || [];
      return cuentas; // <-- retorna todas
    } catch (error) {
      console.error("No se encontró la cuenta:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!formaPagoId) return;

    const fetchCuentas = async () => {
      const data = await obtenerCuentas();
      if (!data.length) return;

      setCuentasList(prev => {
        // agrega solo nuevas cuentas
        const nuevas = data.filter(c => !prev.some(p => p.id === c.id));
        return [...prev, ...nuevas];
      });
    };
    fetchCuentas();
  }, [formaPagoId]);


  // BUSCAR TIPO DE CAMBIO
  const buscarCambio = async () => {
    if (!cuentaSelect || !monedaCta) return 1;
    if (moneda === monedaCta) return 1;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/api/cambio`,
        {
          monedaOrigen: moneda,
          monedaDestino: monedaCta,
          fecha
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.error(res.data);
      return res.data?.cambio ?? 1;

    } catch (error) {
      console.error("Error al buscar cambio:", error);
      return 1;
    }
  };

  useEffect(() => {
    let active = true;
    const obtenerCambio = async () => {
      setCambio(1);
      const c = await buscarCambio();
      if (active) setCambio(c);
    };
    obtenerCambio();
    return () => { active = false; };
  }, [cuentaSelect, moneda, monedaCta, fecha]);

  /* Agregar itens de los formularios a la lista */
  // AGREGAR ITEM DETALLE (solo con ENTER)
  const handleSubmitIten = (e, tipoItem = "CRÉDITO") => {
    e.preventDefault();
    if (loading) return
    setLoading(true);
    try {
      if (e.type === "submit" && e.nativeEvent.submitter?.type === "button") return;
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      const montoFloat = parseFloat(data.monto || 0);

      if (!cuentaSelect || !formaPagoId) {
        Swal.fire({
          title: "Debe seleccionar una cuenta y forma de pago!",
          icon: "info",
          iconColor: "yellow",
          background: "#1f2937",
          color: "white",
          buttonsStyling: false,
          customClass: {
            confirmButton:
              "bg-gradient-to-r from-[#35b9ac] to-[#2da89c] px-4 py-2 rounded-md text-white hover:brightness-105 transition cursor-pointer",
          },
        });
        return;
      }

      const nuevoItem = {
        id: itemsDetalle.length + 1,
        cuenta_id: cuentaSelect,
        tipo: tipoItem,
        monto: montoFloat,
        forma_pago: formaPagoId,
        descripcion: data.comentario,
        moneda: moneda,
        monedaCta: monedaCta,
        cambio: cambio,
        monto_moneda_cuenta: montoFloat * cambio,
        entidad: entidadSelect,
        tipo_doc: tipoDocumento,
        documento: data.documento
      };

      setItemsDetalle([...itemsDetalle, nuevoItem]);

      e.target.reset();
      setCuentaSelect(null);
      setFormaPagoId(null);
      setEntidadSelect(null);
      setTipoDocumento(null);
      setOpenModal(false);
      setOpenModalBaja(false);
      setLoading(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false)
    }
  };

  /* Boton para eliminar linea */
  const handleEliminar = (id) => setItemsDetalle(itemsDetalle.filter(item => item.id !== id));

  /* Busca las entidades para el select de los modales */
  const buscarEntidad = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/entidad`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntidad(res.data || []);
    } catch (error) {
      console.error("No se pudo obtener entidades: ", error);
    }
  };

  useEffect(() => {
    buscarEntidad();
  }, []);

  const handleRegistrarMovimiento = async () => {
    const descripcionInput = document.querySelector('[name="descripcionFinanciero"]');
    const referenciaInput = document.querySelector('[name="referenciaDocFinanciero"]');

    // 🔹 Validación de descripción
    if (!descripcionInput?.value?.trim()) {
      Swal.fire({
        title: "Descripción es requerida!",
        text: "Debe ingresar una descripción válida",
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
      return;
    }

    if (loading) return
    setLoading(true);

    try {
      Swal.fire({
        title: "Procesando pago...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const token = localStorage.getItem("token");

      const payload = {
        fecha,
        punto_exp: puntoSeleccionado.id,
        descripcion: descripcionInput.value.trim(),
        referencia: referenciaInput.value,
        usuario_id: usuario.id,
        moneda_principal: moneda,
        tipo_cambio: cambio,
        tipo_operacion: "GASTO",
        estado: "ACTIVO",
        caja_logueada: caja.id,
        detalle: itemsDetalle.map(i => ({
          cuenta_id: i.cuenta_id,
          tipo: i.tipo,
          monto: i.monto,
          descripcion: i.descripcion,
          forma_pago: i.forma_pago,
          moneda: i.moneda,
          monedaCta: i.monedaCta,
          cambio: i.cambio,
          monto_moneda_cuenta: i.monto_moneda_cuenta,
          entidad: i.entidad,
          tp_doc: i.tipo_doc,
          documento: i.documento
        }))
      };

      const res = await axios.post(`${API}/api/movimientos`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 201) {
        Swal.fire({
          title: "Movimiento registrado con éxito",
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

        // reset campos
        setItemsDetalle([]);
        descripcionInput.value = "";
        referenciaInput.value = "";
        setCuentaSelect(null);
        setFormaPagoId(null);
        setEntidadSelect(null);
        setTipoDocumento(null);
        setMoneda("PYG");
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error al registrar movimiento",
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
    } finally {
      setLoading(false);
    }
  };
  // TOTALES
  const totalDebito = itemsDetalle.filter(i => i.tipo === "DÉBITO").reduce((acc, i) => acc + i.monto, 0);
  const totalCredito = itemsDetalle.filter(i => i.tipo === "CRÉDITO").reduce((acc, i) => acc + i.monto, 0);
  const diferencia = totalCredito - totalDebito;

  // ESCAPE MODALS
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") { setOpenModal(false); setOpenModalBaja(false); } };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 200);
  }, [])

  if (loading) return <Loader />

  return (
    <>
      {/* HEADER */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-8 shadow-lg shadow-gray-300/30">
          <div>
            <h1 className="text-4xl flex gap-2 md:text-3xl font-bold text-white tracking-wide">
              <FaArrowDown />
              Paga Valores
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2">
              Realice todas las salidas de la empresa.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={handleRegistrarMovimiento}
              disabled={diferencia !== 0 || loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-semibold shadow-md transition
              ${diferencia === 0 ? "bg-white/90 text-[#359bac] cursor-pointer hover:bg-gray-100" : "bg-red-500 text-white cursor-not-allowed"}`}
            >
              <FaCheckCircle />
              Confirmar
            </button>
          </div>
        </div>
      </div>

      {/* DATOS GENERALES */}
      <div className="bg-white rounded-md shadow-md border border-[#359bac] p-6 mb-2">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">DATOS GENERALES</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <label className="flex flex-col  w-full">
            <span className="text-gray-700 ml-2 font-medium text-sm">Fecha</span>
            <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} className="input" />
          </label>
          <label className="flex flex-col  w-full">
            <span className="text-gray-700 ml-2 font-medium text-sm">Moneda</span>
            <SelectCustom
              options={[
                { value: "PYG", label: "Guaraní" },
                { value: "USD", label: "Dólar" },
                { value: "BRL", label: "Real" }
              ]}
              value={moneda}
              onChange={setMoneda}
            />
          </label>
          <label className="flex flex-col  w-full">
            <span className="text-gray-700 ml-2 font-medium text-sm">Referencia</span>
            <input name="referenciaDocFinanciero" placeholder="Referencia" className="input" />
          </label>
          <label className="flex flex-col  w-full">
            <span className="text-gray-700 ml-2 font-medium text-sm">Usuario</span>
            <input readOnly value={usuario.nombre} className="input bg-gray-100" />
          </label>
          <label className="flex flex-col  w-full">
            <span className="text-gray-700 ml-2 font-medium text-sm">Estado</span>
            <input readOnly value="INICIADO" className="input bg-gray-100" />
          </label>
          <label className="flex flex-col  w-full">
            <span className="text-gray-700 ml-2 font-medium text-sm">Punto Exp.</span>
            <input readOnly value={puntoSeleccionado.nombre} className="input bg-gray-100" />
          </label>
        </div>
        <label className="flex flex-col  w-full">
          <span className="text-gray-700 ml-2 font-medium text-sm">Descipción</span>
          <textarea name="descripcionFinanciero" placeholder="Descripción del gasto..." className="input w-full mt-2" />
        </label>
      </div>

      {/* BOTONES */}{/* 
      <div className="flex gap-4 mb-2">
      </div> */}

      {/* TABLAS */}
      <div className="grid md:grid-cols-1 gap-2">
        <div className="bg-white rounded-md shadow-md border border-[#35b9ac] py-2 px-1 overflow-x-auto">
          <div className="flex justify-between flex-wrap">
            <h2 className="font-semibold text-2xl mt-2 ml-4 text-[#35b9ac] mb-3">SALÍDAS</h2>
            <button onClick={() => setOpenModalBaja(true)} className=" p-2 m-2 bg-[#35b9ac] hover:bg-[#35b9ac]/75 cursor-pointer outline-none text-white py-3 rounded-md flex items-center justify-center gap-2 font-semibold shadow"><FaMinusSquare /> Agregar Salída</button>
          </div>
          <DataTable
            data={itemsDetalle.filter(i => i.tipo === "DÉBITO")}
            columns={[
              { header: "Cuenta", accessor: "cuenta_id", cell: row => cuentasList?.find(c => c.id === row.cuenta_id)?.nombre || "Desconocido" },
              { header: "Forma Pago", accessor: "forma_pago", cell: row => formaPago?.find(f => f.id === row.forma_pago)?.nombre || "Desconocido" },
              { header: "Descripción", accessor: "descripcion" },
              { header: "Entidad", accessor: "entidad", cell: row => entidad?.find(e => e.id === row.entidad)?.nombre || "" },
              { header: "TP Doc", accessor: "tipo_doc" },
              { header: "Documento", accessor: "documento" },
              { header: "Monto", accessor: "monto", align: "end", cell: row => formatearNumero(row.monto, row.moneda) },
              { header: "Cambio", accessor: "cambio", align: "end", cell: row => formatearNumero(row.cambio, row.monedaCta) },
              { header: "Monto Moneda Cuenta", accessor: "monto_moneda_cuenta", align: "end", cell: row => formatearNumero(row.monto_moneda_cuenta, row.monedaCta) },
              { header: "", align: "center", cell: row => <button onClick={() => handleEliminar(row.id)} className="text-red-500 font-bold text-lg cursor-pointer hover:text-red-700">x</button> }
            ]}
            showExcelButton={false}  // NOVO
            showPDFButton={false}      // NOVO
          />
          <div className="text-right mt-3 mr-2 font-bold text-[#359bac]">{formatearNumero(totalDebito, moneda)}</div>
        </div>

        {/* PAGOS */}
        <div className="bg-white rounded-md shadow-md border border-[#35b9ac] py-2 px-1 overflow-x-auto">
          <div className="flex justify-between flex-wrap">
            <h2 className="font-semibold text-2xl mt-2 ml-4 text-[#35b9ac] mb-3">FORMAS DE PAGOS</h2>
            <button onClick={() => setOpenModal(true)} className="p-2 m-2 bg-[#35b9ac] hover:bg-[#35b9ac]/75 cursor-pointer outline-none text-white py-3 rounded-md flex items-center justify-center gap-2 font-semibold shadow"><FaPlusSquare /> Agregar Forma de Pago</button>
          </div>
          <DataTable
            data={itemsDetalle.filter(i => i.tipo === "CRÉDITO")}
            columns={[
              { header: "Cuenta", accessor: "cuenta_id", cell: row => cuentasList?.find(c => c.id === row.cuenta_id)?.nombre || "Desconocido" },
              { header: "Forma Pago", accessor: "forma_pago", cell: row => formaPago?.find(f => f.id === row.forma_pago)?.nombre || "Desconocido" },
              { header: "Descripción", accessor: "descripcion" },
              { header: "Entidad", accessor: "entidad", cell: row => entidad?.find(e => e.id === row.entidad)?.nombre || "" },
              { header: "TP Doc", accessor: "tipo_doc" },
              { header: "Documento", accessor: "documento" },
              { header: "Monto", accessor: "monto", align: "end", cell: row => formatearNumero(row.monto, row.moneda) },
              { header: "Cambio", accessor: "cambio", align: "end", cell: row => formatearNumero(row.cambio, row.monedaCta) },
              { header: "Monto Moneda Cuenta", accessor: "monto_moneda_cuenta", align: "end", cell: row => formatearNumero(row.monto_moneda_cuenta, row.monedaCta) },
              { header: "", align: "center", cell: row => <button onClick={() => handleEliminar(row.id)} className="text-red-500 font-bold text-lg cursor-pointer hover:text-red-700">x</button> }
            ]}
            showExcelButton={false}  // NOVO
            showPDFButton={false}      // NOVO
          />
          <div className="text-right mt-3 mr-2 font-bold text-[#35b9ac]">{formatearNumero(totalCredito, moneda)}</div>
        </div>
      </div >

      {/* RESUMEN */}
      < div className="mt-2 bg-white rounded-md mb-3 shadow-md border border-[#359bac] p-2 flex justify-between items-center" >
        <div className="bg-red-200 p-2 rounded-xl">
          <p className="text-white text-shadow-lg shadow-black font-bold">Salídas</p>
          <p className="text-xl font-bold text-red-600">{formatearNumero(totalDebito, moneda)}</p>
        </div>
        <div className="bg-green-200 p-2 rounded-xl">
          <p className="text-white text-shadow-lg shadow-black font-bold">Pagos</p>
          <p className="text-xl font-bold text-green-600">{formatearNumero(totalCredito, moneda)}</p>
        </div>
        <div className="bg-blue-200 rounded-xl p-2">
          <p className="text-white text-shadow-lg shadow-black font-bold">Diferencia</p>
          <p className={`text-xl font-bold ${diferencia === 0 ? "text-green-600" : "text-red-600"}`}>{formatearNumero(diferencia, moneda)}</p>
        </div>
      </div >

      {/* MODALES ... (lo mismo, pero usando ?. en SelectCustom) */}
      {/* AGREGAR CRÉDITO */}
      {
        openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[800px] max-h-[650px] rounded-md shadow-xl p-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Agregar Pago</h2>
                <button onClick={() => { setOpenModal(false); setCuentaSelect(null); setFormaPagoId(null); }} className="p-3 hover:bg-gray-100 rounded-lg text-xl cursor-pointer font-semibold hover:text-red-600 w-3 h-4 flex justify-center items-center">x</button>
              </div>
              <form onSubmit={(e) => handleSubmitIten(e, "CRÉDITO")}>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="flex gap-3">
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Forma de Pago</span>
                      <SelectCustom
                        options={formaPago?.filter(c => c.sub_tipo === "EFECTIVO" || c.sub_tipo === "BANCO" || c.tipo === "BJCOBRAR" || c.tipo === "LZPAGAR").map(f => ({ value: f.id, label: f.nombre })) || []}
                        value={formaPagoId}
                        onChange={setFormaPagoId}
                      />
                    </label>
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Cuenta</span>
                      <SelectCustom
                        options={cuentasList?.filter(c => c.sub_tipo === formaPago?.find(f => f.id === formaPagoId)?.sub_tipo).map(c => ({ value: c.id, label: c.nombre })) || []}
                        value={cuentaSelect}
                        onChange={(value) => {
                          setCuentaSelect(value);

                          const cuenta = cuentasList?.find(c => c.id === value);
                          setMonedaCta(cuenta?.moneda || '');
                        }} />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 w-full">
                    <span className="text-gray-700 ml-2 font-medium text-sm">Entidad</span>
                    <SelectCustom
                      options={entidad?.map(e => ({ value: e.id, label: e.nombre })) || []}
                      value={entidadSelect}
                      onChange={setEntidadSelect}
                    />
                  </label>
                  <label className="flex flex-col gap-2 w-full">
                    <span className="text-gray-700 ml-2 font-medium text-sm">Monto</span>
                    <input name="monto" type="number" step="0.01" placeholder="Monto" className="input" />
                  </label>
                  <div className="flex gap-3">
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Tipo Documento</span>
                      <SelectCustom
                        options={[
                          { value: "BOLETA", label: "BOLETA" },
                          { value: "FACTURA", label: "FACTURA" },
                          { value: "NOTA CRÉDITO", label: "NOTA CRÉDITO" },
                          { value: "NOTA DÉBITO", label: "NOTA DÉBITO" },
                          { value: "REMISIÓN", label: "REMISIÓN" },
                          { value: "RECIBO COBRO", label: "RECIBO COBRO" },
                          { value: "RECIBO PAGO", label: "RECIBO PAGO" },
                          { value: "COMP. BANCARIO", label: "COMP. BANCARIO" },
                        ]}
                        value={tipoDocumento}
                        onChange={setTipoDocumento}
                      />
                    </label>
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Nº Documento</span>
                      <input name="documento" type="text" step="0.01" placeholder="Nº Documento" className="input" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 w-full">
                    <span className="text-gray-700 ml-2 font-medium text-sm">Comentario</span>
                    <textarea name="comentario" placeholder="Comentario" className="input"></textarea>
                  </label>
                  <button type="submit" className="bg-[#35b9ac] cursor-pointer hover:bg-[#35b9ac]/75 py-2 px-4 rounded-md text-white font-semibold">Agregar</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* AGREGAR DÉBITO */}
      {
        openModalBaja && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[800px] max-h-[650px] rounded-md shadow-xl p-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Agregar Salídas</h2>
                <button onClick={() => { setOpenModalBaja(false); setCuentaSelect(null); setFormaPagoId(null); }} className="p-3 hover:bg-gray-100 rounded-lg text-xl cursor-pointer font-semibold hover:text-red-600 w-3 h-4 flex justify-center items-center">x</button>
              </div>
              <form onSubmit={(e) => handleSubmitIten(e, "DÉBITO")}>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="flex gap-3">
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Forma de Salída</span>
                      <SelectCustom
                        options={formaPago?.filter(c => c.sub_tipo === "GASTO" || c.tipo === "LZCOBRAR" || c.tipo === "BJPAGAR" || c.tipo === "OTROS").map(f => ({ value: f.id, label: f.nombre })) || []}
                        value={formaPagoId}
                        onChange={setFormaPagoId}
                      />
                    </label>
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Cuenta</span>
                      <SelectCustom
                        options={cuentasList?.filter(c => c.sub_tipo === formaPago?.find(f => f.id === formaPagoId)?.sub_tipo).map(c => ({ value: c.id, label: c.nombre })) || []}
                        value={cuentaSelect}
                        onChange={(value) => {
                          setCuentaSelect(value);

                          const cuenta = cuentasList?.find(c => c.id === value);
                          setMonedaCta(cuenta?.moneda || '');
                        }} />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 w-full">
                    <span className="text-gray-700 ml-2 font-medium text-sm">Entidad</span>
                    <SelectCustom
                      options={entidad?.map(e => ({ value: e.id, label: e.nombre })) || []}
                      value={entidadSelect}
                      onChange={setEntidadSelect}
                    />
                  </label>
                  <label className="flex flex-col gap-2 w-full">
                    <span className="text-gray-700 ml-2 font-medium text-sm">Monto</span>
                    <input name="monto" type="number" step="0.01" placeholder="Monto" className="input" />
                  </label>
                  <div className="flex gap-3">
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Tipo Documento</span>
                      <SelectCustom
                        options={[
                          { value: "BOLETA", label: "BOLETA" },
                          { value: "FACTURA", label: "FACTURA" },
                          { value: "NOTA CRÉDITO", label: "NOTA CRÉDITO" },
                          { value: "NOTA DÉBITO", label: "NOTA DÉBITO" },
                          { value: "REMISIÓN", label: "REMISIÓN" },
                          { value: "RECIBO COBRO", label: "RECIBO COBRO" },
                          { value: "RECIBO PAGO", label: "RECIBO PAGO" },
                          { value: "COMP. BANCARIO", label: "COMP. BANCARIO" },
                        ]}
                        value={tipoDocumento}
                        onChange={setTipoDocumento}
                      />
                    </label>
                    <label className="flex flex-col gap-2 w-full">
                      <span className="text-gray-700 ml-2 font-medium text-sm">Nº Documento</span>
                      <input name="documento" type="text" step="0.01" placeholder="Nº Documento" className="input" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 w-full">
                    <span className="text-gray-700 ml-2 font-medium text-sm">Comentario</span>
                    <textarea name="comentario" placeholder="Comentario" className="input"></textarea>
                  </label>
                  <button type="submit" className="bg-[#35b9ac] cursor-pointer hover:bg-[#35b9ac]/75 py-2 px-4 rounded-md text-white font-semibold">Agregar</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </>
  );
}