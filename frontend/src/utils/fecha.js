const TIMEZONE = "America/Asuncion";
const LOCALE = "es-PY";

export const Fecha = {
  ahora() {
    return new Date();
  },

  // 👉 Mostrar SIEMPRE en Paraguay
  mostrar(fecha) {
    if (!fecha) return "";

    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date(fecha));
  },

  // 👉 Para inputs datetime-local
  input(fecha) {
    if (!fecha) return "";

    const d = new Date(fecha);

    // 🔥 CLAVE: ajustar a Paraguay manualmente
    const py = new Date(
      d.toLocaleString("en-US", { timeZone: TIMEZONE })
    );

    return py.toISOString().slice(0, 16);
  },

  // 👉 Guardar en UTC correctamente
  toUTC(fechaLocal) {
    if (!fechaLocal) return null;
    return new Date(fechaLocal).toISOString();
  }
};