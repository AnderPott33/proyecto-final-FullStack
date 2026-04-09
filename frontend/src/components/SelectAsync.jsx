import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaChevronDown, FaTimes } from "react-icons/fa";

export default function SelectAsync({
  fetchUrl,
  value,
  onChange,
  placeholder = "Seleccionar...",
  isClearable = false,
  disabled = false,
  limit = 50,
  valueKey = "id",
  labelKey = "nombre",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const token = localStorage.getItem("token");
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(fetchUrl, {
          params: { search: query, limit },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!cancelled) {
          const items = Array.isArray(res.data) ? res.data : res.data.rows || res.data.movimientos || res.data;
          setOptions(items.map((it) => ({ value: it[valueKey], label: it[labelKey] })));
        }
      } catch (err) {
        console.error("SelectAsync error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const id = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [open, query, fetchUrl, limit, valueKey, labelKey]);

  const selected = options.find((o) => o.value === value) || null;

  return (
    <div ref={ref} className="relative w-full">
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen(!open)}
        className={`bg-neutral-50 border border-gray-200 text-gray-700 px-5 py-3.5 rounded-md
          focus:border-[#35b9ac] focus:ring-2 focus:ring-[#35b9ac]/20 outline-none
          shadow-sm transition-all duration-300 font-semibold text-sm placeholder:text-gray-400
          flex items-center justify-between cursor-pointer hover:border-[#35b9ac]/80
          ${disabled ? "opacity-50 cursor-not-allowed hover:border-gray-200" : ""}`}
      >
        <div className="flex-1">
          {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
        </div>

        <div className="flex items-center gap-2">
          {isClearable && selected && !disabled && (
            <FaTimes
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-neutral-400 hover:text-red-400 transition-colors"
            />
          )}
          <FaChevronDown className={`text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute w-full bg-white border border-neutral-100 rounded-md shadow-lg z-50 p-2 max-h-96 overflow-hidden mt-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md mb-2 outline-none"
          />

          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#35b9ac]/50 scrollbar-track-gray-100">
            {loading ? (
              <div className="py-3 text-center text-sm text-gray-500">Cargando...</div>
            ) : options.length > 0 ? (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                  className="px-5 py-3 rounded-md cursor-pointer text-sm font-bold mb-1 hover:bg-[#35b9ac]/10"
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="py-3 text-center text-sm text-gray-400">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
