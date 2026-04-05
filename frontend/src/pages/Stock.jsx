import { useState, useEffect, useContext } from "react";
import { FaBoxOpen } from "react-icons/fa";
import SelectCustom from "../components/SelectCustom";
import DataTable from "../components/DataTable";
import { formatearNumero, formatearNumeroSimple } from "../components/FormatoFV";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { usePermiso } from "../hooks/usePermiso";
import { useNavigate } from "react-router-dom";

export default function Stock() {
    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate()
    const {puedeAcceder, puede} = usePermiso();
const tienePermiso = puedeAcceder("stock")
    useEffect(() => {
          if (!tienePermiso) {navigate("/error-permiso");}
  }, [navigate, tienePermiso])
  if (!tienePermiso) return null;
    const { usuario, puntoSeleccionado } = useContext(AuthContext);

    const [inventario, setInventario] = useState([]);
    const [articuloFilter, setArticuloFilter] = useState();

    const buscarStock = async () => {
        const token = localStorage.getItem("token");
        try {
            const result = await axios.get(`${API}/api/stock`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setInventario(result.data)
        } catch (error) {
            console.error(error);
        }
    }

   const invFiltrado = inventario.filter((i) => {
    // Si no hay filtro, devolvemos todo
    if (!articuloFilter) return true;
    // Si hay filtro, comparamos IDs como números
    return parseInt(i.producto_id) === parseInt(articuloFilter);
});
    

    useEffect(() => {
        buscarStock()
    }, [])

    return (
        <>
            {/* Header */}
            <div className="mb-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between
                        bg-gradient-to-r from-[#5fb3c0] via-[#359bac] to-[#2a7d88]
                        rounded-md p-6 md:p-8 shadow-lg shadow-gray-300/30">
                    <div>
                        <h1 className="text-2xl md:text-3xl flex gap-2 font-bold text-white tracking-wide">
                            <FaBoxOpen />
                            Stock
                        </h1>
                        <p className="text-white/90 text-sm md:text-base mt-2">
                            Consulte el Inventarío de la empresa.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    </div>
                    {/* <div className="w-full md:w-1/5">
                        <button
                            onClick={confirmarVenta}
                            className="w-full p-3 rounded-md font-semibold flex justify-center gap-2 items-center
                              bg-white text-[#359bac] border-2 border-white shadow-md shadow-black">
                            <GiConfirmed className="text-lg" />
                            Confirmar Venta
                        </button>
                    </div> */}
                </div>
            </div>

            <div className="rounded-md bg-white shadow-sm w-full flex flex-col p-2 mb-2">
                <SelectCustom
                    options={[
                        {value: "", label: "Todos"},
                        ...inventario.map((i) => (
                        { value: i.producto_id, label: `${i.producto_id} - ${i.nombre_articulo}` }
                    ))]}
                    value={articuloFilter}
                    onChange={(i)=>setArticuloFilter(i)}
                />
            </div>
            <div className="rounded-md bg-white shadow-sm w-full flex flex-col gap-6 overflow-x-auto">
                <DataTable
                    data={invFiltrado}
                    initialSort={{ column: "producto_id", direction: "ascending" }}
                    columns={[

                        { header: "ID Artículo", accessor: "producto_id", sortable: true },
                        { header: "Nombre", accessor: "nombre_articulo", sortable: true, align: "start" },
                        { header: "stock_final", accessor: "Stock", align: "end", sortable: true, cell: (row) => formatearNumeroSimple(row.stock_final) },
                        { header: "valor_final", accessor: "Valor Total", align: "end", sortable: true, cell: (row) => formatearNumero(row.valor_final) },
                    ]}
                />
            </div>
        </>
    );
}