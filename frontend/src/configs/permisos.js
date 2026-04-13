const GLOBAL_ACCIONES = ["ver"];
const GLOBAL_PAGINAS = ["dashboard", "registrar_caja",  "stock", "cotizaciones", "stock_detallado", "venta", "articulos", "categorias", "marcas", "recibe_valores", "paga_valores", "movimientos_financieros", "analitico_cta_cobrar_pagar", "saldos_cobrar_pagar", "entidades"]; // ejemplo, todos pueden acceder al dashboard

export const PERMISOS = {
  SUPERADMIN: {
    acciones: ["crear", "editar", "borrar", "cerrar_caja", "registrar_movimiento", "ver_relatorios_financieros","alterar_fecha_caja",
       "puede_alterar_valor_inicial_caja", "realizar_movimientos_caja", "inactivar_financiero", "realizar_ajuste_stock", "eliminar_categoria", "eliminar_cambio", "eliminar_marca", "inactivar_entidad", "contabilidad", ...GLOBAL_ACCIONES],
    paginas: ["usuarios", "caja", "reportes", "configuracion", "balance","movimientos_caja","cuentas", "saldos_cuentas", "compra", "usuarios", "analitico", "contabilidad", ...GLOBAL_PAGINAS]
  },
  ADMIN: {
    acciones: ["crear", "editar", "cerrar_caja", "ver_relatorios_financieros", "alterar_fecha_caja",
       "puede_alterar_valor_inicial_caja", "realizar_movimientos_caja", "inactivar_financiero", "eliminar_categoria", "eliminar_marca", "eliminar_cambio",, "contabilidad", "realizar_ajuste_stock", "inactivar_entidad", ...GLOBAL_ACCIONES],
    paginas: ["usuarios", "caja", "reportes","movimientos_caja", "balance","cuentas", "saldos_cuentas", "compra", "usuarios", "analitico", "contabilidad" , ...GLOBAL_PAGINAS]
  },
  CONTABILIDAD: {
    acciones: ["crear", "editar", "cerrar_caja", "ver_relatorios_financieros", "alterar_fecha_caja",
       "puede_alterar_valor_inicial_caja", "realizar_movimientos_caja", "inactivar_financiero", "realizar_ajuste_stock", "contabilidad",, ...GLOBAL_ACCIONES],
    paginas: [ "caja", "reportes","movimientos_caja","cuentas", "balance", "saldos_cuentas", "compra", "analitico", "contabilidad", ...GLOBAL_PAGINAS]
  },
  SUPERVISOR_CAJA: {
    acciones: ["crear", "editar", "cerrar_caja", "alterar_fecha_caja",
       "puede_alterar_valor_inicial_caja", "realizar_movimientos_caja", "inactivar_financiero", ...GLOBAL_ACCIONES],
    paginas: ["caja", "reportes", "ver_relatorios_financieros","movimientos_caja","cuentas", "saldos_cuentas", "analitico", ...GLOBAL_PAGINAS]
  },
  ENCARGADO_COMPRAS: {
    acciones: ["crear", "editar", "cerrar_caja", "alterar_fecha_caja",
       "puede_alterar_valor_inicial_caja", "realizar_movimientos_caja", "inactivar_financiero", "realizar_ajuste_stock", ...GLOBAL_ACCIONES],
    paginas: ["caja", "reportes", "ver_relatorios_financieros","movimientos_caja","cuentas", "compra", "saldos_cuentas", "analitico", ...GLOBAL_PAGINAS]
  },
  SUPERVISOR: {
    acciones: [...GLOBAL_ACCIONES],
    paginas: ["caja", "reportes", "ver_relatorios_financieros","cuentas", "saldos_cuentas", "analitico", ...GLOBAL_PAGINAS]
  },
  CAJERO: {
    acciones: ["registrar_movimiento", ...GLOBAL_ACCIONES],
    paginas: ["caja", ...GLOBAL_PAGINAS]
  }
};