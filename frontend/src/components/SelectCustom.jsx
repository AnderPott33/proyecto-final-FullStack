import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";

export default function SelectCustom({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  isClearable = false,
  disabled = false, // Prop para desabilitar
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [dropdownDirection, setDropdownDirection] = useState("bottom");

  const ref = useRef();
  const listRef = useRef();
  const selected = options.find((opt) => opt.value === value);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrar opciones
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Reset highlight al buscar
  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  // Scroll automático para opción highlight
  useEffect(() => {
    const el = listRef.current?.children[highlightIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  // Determinar dirección del dropdown
  useEffect(() => {
    if (!open) return;

    const handlePosition = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
          setDropdownDirection("top");
        } else {
          setDropdownDirection("bottom");
        }
      }
    };

    handlePosition();
    window.addEventListener("resize", handlePosition);
    return () => window.removeEventListener("resize", handlePosition);
  }, [open]);

  // Navegación teclado
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selectedOption = filtered[highlightIndex];
      if (selectedOption) {
        onChange(selectedOption.value);
        setOpen(false);
        setSearch("");
      }
    }

    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* CONTROL */}
      <div
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
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
          <FaChevronDown
            className={`text-neutral-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* DROPDOWN */}
      {open && !disabled && (
        <div
          className={`absolute w-full bg-white border border-neutral-100 rounded-md 
            shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-50 p-2 max-h-96 overflow-hidden
            ${dropdownDirection === "bottom" ? "mt-2 top-full" : "mb-2 bottom-full"}`}
        >
          {/* SEARCH */}
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar..."
            className="w-full bg-neutral-50 border border-gray-200 text-gray-600 px-5 py-3.5 rounded-md
              focus:border-[#35b9ac] focus:ring-4 focus:ring-[#35b9ac]/20 outline-none
              transition-all duration-300 font-bold text-sm shadow-inner placeholder:text-gray-300 mb-2"
          />

          {/* OPTIONS */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#35b9ac]/50 scrollbar-track-gray-100"
          >
            {filtered.length > 0 ? (
              filtered.map((opt, index) => (
                <div
                  key={opt.value}
                  onMouseDown={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`px-5 py-3 rounded-md cursor-pointer text-sm font-bold mb-1
                    transition-colors duration-200
                    ${index === highlightIndex
                      ? "bg-[#35b9ac] text-white"
                      : value === opt.value
                      ? "bg-[#35b9ac]/20 text-[#2d8c99]"
                      : "text-neutral-600 hover:bg-[#35b9ac]/10"
                    }`}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-400 py-3 text-sm">
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}