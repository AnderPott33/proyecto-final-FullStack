import Handlebars from "handlebars";
import { formatearFecha, formatearNumero } from "../components/FormatoFV";

export default async function imprimirMovimiento(movimiento) {
  if (!movimiento) return;

  // 🔹 1. cargar HTML original
  const res = await fetch("/plantilla.html");
  const html = await res.text();

  // 🔹 2. preparar datos
  const data = {
    id: movimiento.id,
    fecha: formatearFecha(movimiento.fecha),
    usuario_nombre: movimiento.usuario_nombre,
    referencia: movimiento.referencia || "-",
    tipo_operacion: movimiento.tipo_operacion,
    punto_exp: movimiento.punto_exp,
    estado: movimiento.estado,
    descripcion: movimiento.descripcion,
    moneda_base: movimiento.moneda_principal,
    caja_logueada: movimiento.caja_logueada,

    detalles: movimiento.detalles.map(d => ({
      cuenta_nombre: d.cuenta_nombre || d.cuenta_id,
      documento: d.documento || "-",
      entidad: d.entidad || "-",
      cambio: d.cambio ?? "-",
      debito: d.tipo === "DÉBITO"
        ? formatearNumero(d.monto, movimiento.moneda_principal)
        : "",
      credito: d.tipo === "CRÉDITO"
        ? formatearNumero(d.monto, movimiento.moneda_principal)
        : ""
    })),

    total_debito: formatearNumero(
      movimiento.detalles
        .filter(d => d.tipo === "DÉBITO")
        .reduce((sum, d) => sum + Number(d.monto || 0), 0),
      movimiento.moneda_principal
    ),

    total_credito: formatearNumero(
      movimiento.detalles
        .filter(d => d.tipo === "CRÉDITO")
        .reduce((sum, d) => sum + Number(d.monto || 0), 0),
      movimiento.moneda_principal
    ),
  };

  // 🔥 3. compilar plantilla
  const template = Handlebars.compile(html);
  const resultado = template(data);

  // 🔹 4. imprimir
  const w = window.open("", "_blank", "width=1200,height=800");
  w.document.write(resultado);
  w.document.close();
}