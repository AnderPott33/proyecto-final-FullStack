import { useCotizacion } from "../context/CotizacionContext";
import { useState } from "react";
import axios from "axios";
import usFlag from "../assets/flags/us.svg";
import pyFlag from "../assets/flags/py.svg";
import brFlag from "../assets/flags/br.svg";

const BANDERAS = {
  USD: usFlag,
  PYG: pyFlag,
  BRL: brFlag,
};
const API = import.meta.env.VITE_API_URL;

export default function CotizacionesForm() {
  const { mostrarModal, setMostrarModal } = useCotizacion();

  const ahoraT = () => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");
  const hours = String(ahora.getHours()).padStart(2, "0");
  const minutes = String(ahora.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

  const [formData, setFormData] = useState({
    fecha: ahoraT(),
    USD_PYG: 0,
    USD_BRL: 0,
    BRL_PYG: 0,
  });

  const guardarCotizaciones = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const usdPyg = Number(formData.USD_PYG);
      const usdBrl = Number(formData.USD_BRL);
      const brlPyg = Number(formData.BRL_PYG);

      let cotizacionesAGuardar = [
        { moneda_origen: "USD", moneda_destino: "PYG", cambio: usdPyg, fecha: formData.fecha },
        { moneda_origen: "USD", moneda_destino: "BRL", cambio: usdBrl, fecha: formData.fecha },
        { moneda_origen: "BRL", moneda_destino: "PYG", cambio: brlPyg, fecha: formData.fecha },

        { moneda_origen: "PYG", moneda_destino: "USD", cambio: usdPyg ? 1 / usdPyg : null, fecha: formData.fecha },
        { moneda_origen: "BRL", moneda_destino: "USD", cambio: usdBrl ? 1 / usdBrl : null, fecha: formData.fecha },
        { moneda_origen: "PYG", moneda_destino: "BRL", cambio: brlPyg ? 1 / brlPyg : null, fecha: formData.fecha },

        { moneda_origen: "USD", moneda_destino: "USD", cambio: 1, fecha: formData.fecha },
        { moneda_origen: "PYG", moneda_destino: "PYG", cambio: 1, fecha: formData.fecha },
        { moneda_origen: "BRL", moneda_destino: "BRL", cambio: 1, fecha: formData.fecha },
      ];

      cotizacionesAGuardar = cotizacionesAGuardar.filter(
        (c) => c.cambio && Number(c.cambio) > 0
      );

      if (cotizacionesAGuardar.length === 0) {
        alert("No hay cotizaciones válidas");
        return;
      }

      await axios.post(
        `${API}/api/cambio/actualizar`,
        { cotizaciones: cotizacionesAGuardar },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Cotizaciones guardadas correctamente");
      setMostrarModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar cotizaciones");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Actualizar Cotizaciones</h2>
          <button
            onClick={() => setMostrarModal(false)}
            className="text-gray-500 hover:text-red-700 text-xl font-bold cursor-pointer"
          >
            x
          </button>
        </div>

        <form onSubmit={guardarCotizaciones} className="flex flex-col justify-center items-center gap-4">
          <label className="flex flex-col gap-2 w-full">
            <span className="text-gray-700 font-medium">Fecha</span>
            <input
              type="datetime-local"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="input"
              required
            />
          </label>

          {["USD_PYG", "USD_BRL", "BRL_PYG"].map((key) => {
            const [from, to] = key.split("_");
            return (
              <label key={key} className="flex gap-2 w-full">
                <span className="text-gray-700 font-medium flex items-center gap-1">
                  <img src={BANDERAS[from]} alt={from} className="w-15 h-10 rounded-sm object-cover" /> →
                  <img src={BANDERAS[to]} alt={to} className="w-15 h-10 rounded-sm object-cover" />
                </span>
                <input
                  type="number"
                  step={key === "USD_BRL" ? "0.0001" : "0.01"}
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="input flex-1"
                  required
                />
              </label>
            );
          })}

          <div className="flex justify-end gap-3 pt-4 w-full">
            <button
              type="button"
              onClick={() => setMostrarModal(false)}
              className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#35b9ac] to-[#2da89c] text-white"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}