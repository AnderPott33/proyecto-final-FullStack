import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

export default function DataTable({
  data = [],
  columns = [],
  initialSort = null,
  pageSizeOptions = [5, 10, 25, 50],
  initialPageSize = 10,
  showExcelButton = false,
  showPDFButton = false,
  selectable = false,
  selectedIds = [],
  setSelectedIds = () => {}
}) {
  const [sortDescriptor, setSortDescriptor] = useState(
    initialSort || { column: null, direction: "ascending" }
  );
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = (columnId) => {
    setSortDescriptor((prev) => ({
      column: columnId,
      direction:
        prev.column === columnId && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const getAlignClass = (align) => {
    const map = {
      start: "text-left",
      center: "text-center",
      end: "text-right",
      right: "text-right",
    };
    return map[align] || "text-left";
  };

  // FILTRO
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      columns.every((col) => {
        const filterValue = filters[col.accessor];
        if (!filterValue) return true;
        const cellValue = row[col.accessor];
        if (cellValue == null) return false;
        return String(cellValue)
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      })
    );
  }, [data, filters, columns]);

  // ORDEN
  const sortedData = useMemo(() => {
    if (!sortDescriptor.column) return filteredData;

    const columnDef = columns.find(
      (c) => c.accessor === sortDescriptor.column
    );

    return [...filteredData].sort((a, b) => {
      let first = a?.[sortDescriptor.column];
      let second = b?.[sortDescriptor.column];

      if (first == null) return 1;
      if (second == null) return -1;

      if (columnDef?.sortType === "date") {
        return sortDescriptor.direction === "ascending"
          ? new Date(first) - new Date(second)
          : new Date(second) - new Date(first);
      }

      if (typeof first === "number" && typeof second === "number") {
        return sortDescriptor.direction === "ascending"
          ? first - second
          : second - first;
      }

      if (typeof first === "string" && typeof second === "string") {
        const cmp = first.localeCompare(second, "es", {
          sensitivity: "base",
        });
        return sortDescriptor.direction === "ascending" ? cmp : -cmp;
      }

      return 0;
    });
  }, [filteredData, sortDescriptor, columns]);

  // PAGINADO
  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // EXPORTAR
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "tabla.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const headers = columns.map((col) => col.header);
    const rows = sortedData.map((r) =>
      columns.map((c) => r[c.accessor])
    );
    autoTable(doc, { head: [headers], body: rows });
    doc.save("tabla.pdf");
  };

  // SELECT ALL (por página)
  const toggleSelectAll = (checked) => {
    const ids = paginatedData.map((row) => row.id);

    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  // SELECT ONE
  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-md shadow-md border border-gray-100">

      {/* EXPORT */}
      <div className="flex flex-col sm:flex-row justify-end sm:space-x-2 p-2 gap-2">
        {showExcelButton && (
          <button onClick={exportExcel} className="flex items-center space-x-1 px-3 py-1 bg-[#359bac] text-white rounded hover:bg-[#359bac]/80">
            <FaFileExcel size={16} />
            <span>Excel</span>
          </button>
        )}

        {showPDFButton && (
          <button onClick={exportPDF} className="flex items-center space-x-1 px-3 py-1 bg-[#359bac] text-white rounded hover:bg-[#359bac]/80">
            <FaFilePdf size={16} />
            <span>PDF</span>
          </button>
        )}
      </div>

      <table className="min-w-full text-sm">
        <thead className="bg-[#359bac] text-white uppercase text-xs">

          {/* HEADER */}
          <tr>
            {selectable && (
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((r) => selectedIds.includes(r.id))
                  }
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
            )}

            {columns.map((col) => (
              <th
                key={col.accessor}
                onClick={() => col.sortable && handleSort(col.accessor)}
                className={`px-6 py-3 ${getAlignClass(col.align)} ${
                  col.sortable ? "cursor-pointer" : ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>

          {/* FILTROS */}
          <tr className="bg-[#e6f3f6] text-xs">
            {selectable && <th></th>}

            {columns.map((col) => (
              <th key={col.accessor} className="px-2 py-1">
                {col.filterable && (
                  <input
                    type="text"
                    value={filters[col.accessor] || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [col.accessor]: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-6">
                No hay datos
              </td>
            </tr>
          ) : (
            paginatedData.map((row, i) => (
              <tr
                key={row.id || i}
                className={`border-b border-[#359bac] ${
                  selectedIds.includes(row.id)
                    ? "bg-blue-100"
                    : i % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
                }`}
              >
                {selectable && (
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectOne(row.id)}
                    />
                  </td>
                )}

                {columns.map((col) => (
                  <td key={col.accessor} className={`px-2 sm:px-6 py-2 ${getAlignClass(col.align)}`}>
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-3 text-sm gap-2">
        <div className="flex items-center gap-2">
          Filas:
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="ml-2 border rounded-md cursor-pointer outline-none border-[#359bac] px-2 py-1"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200" onClick={() => setPage((p) => Math.max(p - 1, 0))}>◀</button>
          <span>{page + 1} / {Math.ceil(sortedData.length / pageSize)}</span>
          <button
            className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200"
            onClick={() =>
              setPage((p) =>
                Math.min(p + 1, Math.ceil(sortedData.length / pageSize) - 1)
              )
            }
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}