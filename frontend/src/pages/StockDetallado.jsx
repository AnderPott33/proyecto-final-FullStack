import { useState, useEffect, useContext } from "react";
import { RiDatabaseLine } from "react-icons/ri";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearFecha, formatearNumero, formatearNumeroSimple } from "../components/FormatoFV";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function Stock() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const { puedeAcceder, puede } = usePermiso();
const tienePermiso = puedeAcceder("stock_detallado")
    useEffect(() => {
          if (!tienePermiso) { navigate("/error-permiso"); }
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const { usuario, puntoSeleccionado } = useContext(AuthContext);

    const [inventario, setInventario] = useState([]);
    const [inventario2, setInventario2] = useState([]);
    const [inventarioUnico, setInventarioUnico] = useState([]);
    const [inventarioUnico2, setInventarioUnico2] = useState([]);
    const [articuloFilter, setArticuloFilter] = useState();

    const buscarStock = async () => {
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/stock/detallado`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setInventario(result.data)
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        buscarStock()
    }, [])

    const buscarStockUnico = async () => {
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/stock/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setInventarioUnico(result.data)
            setInventarioUnico2(result.data)
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        buscarStockUnico()
    }, [])

    const invFiltrado = inventario.filter((i) => {
        // Si hay filtro, comparamos IDs como números
        return parseInt(i.producto_id) === parseInt(articuloFilter);
    });

    useEffect(() => {
        const invFiltrado2 = inventarioUnico2.filter((i) => {
            // Si hay filtro, comparamos IDs como números
            return parseInt(i.producto_id) === parseInt(articuloFilter);
        });
        setInventario2(invFiltrado2)
    }, [articuloFilter])

    return (
        <>
            {/* Header */}
            <div className="mb-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
                            <RiDatabaseLine />
                            Stock Detallado
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Consulte el Inventarío de la empresa.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    </div>
                </div>
            </div>

            <div className="rounded-md gap-3 bg-white shadow-sm w-full flex justify-center items-center p-2 mb-2">
                <div className="w-200">
                    <SelectCustom
                        options={[
                            ...inventarioUnico.map((i) => (
                                { value: i.producto_id, label: `${i.producto_id} - ${i.nombre_articulo}` }
                            ))]}
                        value={articuloFilter}
                        onChange={(i) => setArticuloFilter(i)}
                    />
                </div>
                <div>
                    <span className="text-white font-semibold bg-[#35b9ac] rounded-md p-2">
                        Total Stock: {formatearNumeroSimple(
                            inventario2.reduce((acc, i) => acc + Number(i.stock_final ?? 0), 0)
                        )}
                    </span>
                </div>
            </div>
            <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-x-auto">
                <DataTable
                    data={invFiltrado}
                    initialSort={{ column: "producto_id", direction: "ascending" }}
                    columns={[

                        { header: "ID Artículo", accessor: "producto_id", sortable: true },
                        { header: "Nombre", accessor: "nombre_articulo", sortable: true, align: "start" },
                        { header: "Fecha", accessor: "fecha", sortable: true, align: "start", cell: (row) => formatearFecha(row.fecha) },
                        { header: "Usuario", accessor: "usuario_nombre", align: "start" },
                        { header: "Tipo", accessor: "tipo", align: "start" },
                        { header: "Nº Documento", accessor: "documento_ref", align: "center" },
                        { header: "Costo", accessor: "costo_unitario", align: "end", sortable: true, cell: (row) => formatearNumero(row.costo_unitario) },
                        { header: "Movimiento", accessor: "movimiento", align: "end", sortable: true, cell: (row) => formatearNumeroSimple(row.movimiento) },
                        { header: "Valor Movimiento", accessor: "valor_movimiento", align: "end", sortable: true, cell: (row) => formatearNumero(row.valor_movimiento) },
                    ]}
                />
            </div>
        </>
    );
}