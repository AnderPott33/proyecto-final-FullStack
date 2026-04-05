import { pool } from './config/db.js';

import PDFDocument from 'pdfkit';
import fs from 'fs';

// Obtener venta completa
/* router.get("/:id", */
export const buscarVenta = async (req, res) => {
  try {
    const query = `
            SELECT 
    v.id,
    v.fecha,
    v.numero_factura,
    v.timbrado,
    v.total AS total_cabecera,
    v.estado,
    v.tipo,
    v.condicion_pago,
    v.moneda,
    e.nombre AS entidad_nombre,
    SUM(cv.total) AS total_detalle
FROM compras_ventas v
LEFT JOIN detalle_compras_ventas cv 
    ON cv.compra_venta_id = v.id
LEFT JOIN entidades e 
    ON v.entidad_id = e.id
WHERE v.tipo IN ('VENTA', 'NOTA CRÉDITO')
GROUP BY 
    v.id,
    v.fecha,
    v.numero_factura,
    v.timbrado,
    v.total,
    v.estado,
    v.tipo,
    v.condicion_pago,
    v.moneda,
    e.nombre
ORDER BY v.fecha DESC;
        `;

    const result = await pool.query(query);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar ventas" });
  }
};

export const buscarVentaId = async (req, res) => {
  // 1️⃣ Tomamos el id del parámetro y lo convertimos a string
  const { id } = req.params;
  const idStr = id.toString();

  try {
    // 2️⃣ Encabezado de la venta
    const encabezadoQuery = `
            SELECT v.id, v.fecha, v.numero_factura, v.timbrado, v.condicion_pago,
                   v.moneda, v.observacion, e.id AS cliente_id, e.nombre AS cliente_nombre, e.ruc AS cliente_ruc,
                   v.usuario_id, v.estado, v.tipo, v.referencia_id
            FROM compras_ventas v
            LEFT JOIN entidades e ON v.entidad_id = e.id
            WHERE v.id = $1
        `;
    const encabezadoResult = await pool.query(encabezadoQuery, [idStr]);
    if (encabezadoResult.rowCount === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }
    const encabezado = encabezadoResult.rows[0];

    // 3️⃣ Detalle de artículos
    const detalleQuery = `
            SELECT vd.id, vd.producto_id, a.nombre_articulo AS producto_nombre,
                   vd.cantidad, vd.precio_unitario, vd.impuesto, vd.impuesto_por, vd.total
            FROM detalle_compras_ventas vd
            LEFT JOIN articulo a ON vd.producto_id = a.id
            WHERE vd.compra_venta_id = $1
        `;
    const detalleResult = await pool.query(detalleQuery, [idStr]);
    const detalle = detalleResult.rows;

    // 4️⃣ Pagos de la venta
    const pagosQuery = `
            SELECT vp.id, vp.fecha_pago, vp.moneda, vp.cuenta_id, c.nombre AS cuenta_nombre,
                   vp.forma_pago, fp.nombre AS forma_pago_nombre, vp.monto, vp.banco, vp.numero_cheque
            FROM detalle_pago vp
            LEFT JOIN cuentas c ON vp.cuenta_id = c.id
            LEFT JOIN forma_pago fp ON vp.forma_pago = fp.nombre
            WHERE vp.compras_ventas_id = $1
        `;
    const pagosResult = await pool.query(pagosQuery, [idStr]);
    const pagos = pagosResult.rows;

    // 5️⃣ Respuesta completa
    res.json({
      encabezado,
      detalle,
      pagos
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la venta" });
  }
};


export const crearVenta = async (req, res) => {
  try {
    const { encabezado, detalle, pagos } = req.body;
    const usuario_id = req.user.id;

    await pool.query('BEGIN');

    // 1️⃣ Insert venta
    const ventaInsert = await pool.query(
      `INSERT INTO compras_ventas (tipo, usuario_id, estado, fecha, entidad_id, moneda, condicion_pago, observacion, timbrado, numero_factura)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        encabezado.tipo,
        usuario_id,
        encabezado.estado,
        encabezado.fecha,
        encabezado.entidad_id,
        encabezado.moneda,
        encabezado.condicion_pago,
        encabezado.observacion,
        encabezado.timbrado,
        encabezado.numero_factura
      ]
    );

    const ventaId = ventaInsert.rows[0].id;

    // 2️⃣ Insert detalle
    for (const item of detalle) {
      await pool.query(
        `INSERT INTO detalle_compras_ventas (compra_venta_id, producto_id, cantidad, precio_unitario, impuesto_por, impuesto, subtotal, total)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.impuesto_por, item.impuesto, item.total - item.impuesto, item.total]
      );
      await pool.query(
        `INSERT INTO movimientos_stock (producto_id, fecha, tipo, cantidad, signo, costo_unitario, referencia_id, referencia_tipo, documento_ref, observacion, usuario_id)
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [item.producto_id, encabezado.fecha, 'VENTA', item.cantidad, -1, item.precio_unitario, ventaId, 'FACTURA VENTA', encabezado.numero_factura, 'AJUSTE AUTOMÁTICO POR VENTA', usuario_id]
      );
    }


    // 3️⃣ Crear un único movimiento financiero
    const movimientoInsert = await pool.query(
      `INSERT INTO movimientos_financieros (fecha, moneda_principal, referencia, usuario_id, tipo_cambio, tipo_operacion, caja_logueada, estado, punto_exp, descripcion)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        encabezado.fecha,
        encabezado.moneda,
        `V${ventaId}`,
        usuario_id,
        1,
        'VENTA',
        encabezado.caja_id,
        'ACTIVO',
        encabezado.punto_exp,
        `VENTA REGISTRADA Nº: ${ventaId} - ${encabezado.numero_factura}`
      ]
    );

    const movimientoId = movimientoInsert.rows[0].id;

    // 4️⃣ Insertar detalle_movimientos de ingreso y IVA
    const cuentaIngreso = (await pool.query(`SELECT cuenta_ingreso_venta FROM empresa`)).rows[0].cuenta_ingreso_venta;
    const cuentaIvaCredito = (await pool.query(`SELECT cuenta_iva_credito FROM empresa`)).rows[0].cuenta_iva_credito;

    const totalVenta = detalle.reduce((acc, i) => acc + i.total, 0);
    const totalIVA = detalle.reduce((acc, i) => acc + i.impuesto, 0);
    const valorREg = totalVenta - totalIVA

    await pool.query(
      `INSERT INTO detalle_movimientos (movimiento_id, tipo, cuenta_id, monto, monto_moneda_cuenta, forma_pago, tp_doc, documento, entidad, moneda, cambio)
             VALUES 
             ($1,'CRÉDITO',$2,$3,$3,12,'FACTURA',$4,$5,$6,1),
             ($1,'CRÉDITO',$7,$8,$8,12,'FACTURA',$4,$5,$6,1)`,
      [movimientoId, cuentaIngreso, valorREg, encabezado.numero_factura, encabezado.entidad_id, encabezado.moneda, cuentaIvaCredito, totalIVA]
    );

    // 5️⃣ Insertar pagos y sus débitos
    for (const pago of pagos) {
      await pool.query(
        `INSERT INTO detalle_pago (compras_ventas_id, fecha_pago, moneda, cuenta_id, forma_pago, monto, banco, numero_cheque)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [ventaId, pago.fecha_pago, pago.moneda, pago.cuenta_id, pago.forma_pago, pago.monto, pago.banco, pago.numero_cheque]
      );

      if (["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CHEQUE"].includes(pago.forma_pago)) {
        await pool.query(
          `INSERT INTO movimientos_caja
            (caja_id, tipo, descripcion, monto, moneda, forma_pago, usuario_id, ref_financiero)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [encabezado.caja_id, 'INGRESO', `VENTA Nº: ${encabezado.numero_factura}`, pago.monto, 'PYG', pago.forma_pago, usuario_id, movimientoId]
        )
      }

      let result = await pool.query(`SELECT id FROM forma_pago WHERE nombre = $1`, [pago.forma_pago]);
      let idFormaPago = result.rows[0]?.id;
      await pool.query(
        `INSERT INTO detalle_movimientos (movimiento_id, tipo, cuenta_id, monto, monto_moneda_cuenta, forma_pago, tp_doc, documento, entidad, moneda, cambio)
                 VALUES ($1,'DÉBITO',$2,$3,$3,$4,'FACTURA',$5,$6,$7,1)`,
        [movimientoId, pago.cuenta_id, pago.monto, idFormaPago, encabezado.numero_factura, encabezado.entidad_id, pago.moneda]
      );
    }


    if (encabezado.timbrado) {
      const generarNuevo = await pool.query(
        `SELECT COALESCE(numero_actual, numero_inicio, 0) + 1 AS nuevonumero
     FROM timbrado
     WHERE numero_timbrado = $1`,
        [encabezado.timbrado]
      );

      console.log("Resultado query:", generarNuevo.rows);
      console.log("Timbrado recibido:", encabezado.timbrado);

      if (generarNuevo.rows.length === 0) {
        throw new Error("Timbrado no encontrado");
      }

      const nuevoNum = generarNuevo.rows[0].nuevonumero;

      if (nuevoNum === null || nuevoNum === undefined) {
        throw new Error("No se pudo generar el número de factura");
      }

      await pool.query(
        `UPDATE timbrado
     SET numero_actual = $1
     WHERE numero_timbrado = $2`,
        [nuevoNum, encabezado.timbrado]
      );

      console.log("Nuevo número asignado:", nuevoNum);
    }

    await pool.query('COMMIT');
    res.json({ ok: true, mensaje: 'Venta y movimiento financiero guardados correctamente' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al guardar venta', error: err.message });
  }
};

export const buscarVentasYDevoluciones = async (req, res) => {
  try {
    const result = await pool.query(`
     SELECT 
    v.id,
    v.fecha,
    v.numero_factura,
    v.timbrado,
    v.estado,
    v.tipo,
    v.referencia_id,
    v.condicion_pago,
    v.moneda,
    e.nombre AS entidad_nombre,
    SUM(cv.total) AS total_detalle
FROM compras_ventas v
LEFT JOIN detalle_compras_ventas cv 
    ON cv.compra_venta_id = v.id
LEFT JOIN entidades e 
    ON v.entidad_id = e.id
WHERE v.tipo IN ('VENTA', 'NOTA CRÉDITO') and v.estado = 'ACTIVO'
GROUP BY 
    v.id,
    v.fecha,
    v.numero_factura,
    v.timbrado,
    v.estado,
    v.tipo,
    v.referencia_id,
    v.condicion_pago,
    v.moneda,
    e.nombre
ORDER BY v.fecha DESC;
        ;
      `
    )
    res.status(200).json(result.rows)
  } catch (error) {
    console.error(error);
  }
}

export const devolverVenta = async (req, res) => {
  try {
    const { encabezado, detalle, pagos } = req.body;
    const usuario_id = req.user.id;

    await pool.query('BEGIN');
    const timbrado = encabezado.timbrado;
    // 1️⃣ Insert venta
    const ventaInsert = await pool.query(
      `INSERT INTO compras_ventas (tipo, usuario_id, estado, fecha, entidad_id, moneda, condicion_pago, observacion, timbrado, numero_factura, referencia_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        encabezado.tipo,
        usuario_id,
        encabezado.estado,
        encabezado.fecha,
        encabezado.entidad_id,
        encabezado.moneda,
        encabezado.condicion_pago,
        encabezado.observacion,
        encabezado.timbrado,
        encabezado.numero_factura,
        encabezado.referencia_id
      ]
    );

    const ventaId = ventaInsert.rows[0].id;

    // 2️⃣ Insert detalle
    for (const item of detalle) {
      await pool.query(
        `INSERT INTO detalle_compras_ventas (compra_venta_id, producto_id, cantidad, precio_unitario, impuesto_por, impuesto, subtotal, total)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.impuesto_por, item.impuesto, item.total - item.impuesto, item.total]
      );
      await pool.query(
        `INSERT INTO movimientos_stock (producto_id, fecha, tipo, cantidad, signo, costo_unitario, referencia_id, referencia_tipo, documento_ref, observacion, usuario_id)
                        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [item.producto_id, encabezado.fecha, 'NOTA CRÉDITO', item.cantidad, 1, item.precio_unitario, ventaId, 'DEVOLUCIÓN VENTA', encabezado.numero_factura, 'AJUSTE AUTOMÁTICO POR VENTA', usuario_id]
      );
    }


    // 3️⃣ Crear un único movimiento financiero
    const movimientoInsert = await pool.query(
      `INSERT INTO movimientos_financieros (fecha, moneda_principal, referencia, usuario_id, tipo_cambio, tipo_operacion, caja_logueada, estado, punto_exp, descripcion)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        encabezado.fecha,
        encabezado.moneda,
        `V${ventaId}`,
        usuario_id,
        1,
        'DEVOLUCIÓN VENTA',
        encabezado.caja_id,
        'ACTIVO',
        encabezado.punto_exp,
        `DEVOLUCIÓN VENT. REGISTRADA Nº: ${encabezado.numero_factura}`
      ]
    );

    const movimientoId = movimientoInsert.rows[0].id;

    // 4️⃣ Insertar detalle_movimientos de ingreso y IVA
    const cuentaIngreso = (await pool.query(`SELECT cuenta_ingreso_venta FROM empresa`)).rows[0].cuenta_ingreso_venta;
    const cuentaIvaCredito = (await pool.query(`SELECT cuenta_iva_credito FROM empresa`)).rows[0].cuenta_iva_credito;

    const totalVenta = detalle.reduce((acc, i) => acc + i.total, 0);
    const totalIVA = detalle.reduce((acc, i) => acc + i.impuesto, 0);
    const valorREg = totalVenta - totalIVA

    await pool.query(
      `INSERT INTO detalle_movimientos (movimiento_id, tipo, cuenta_id, monto, monto_moneda_cuenta, forma_pago, tp_doc, documento, entidad, moneda, cambio)
             VALUES 
             ($1,'DÉBITO',$2,$3,$3,12,'FACTURA',$4,$5,$6,1),
             ($1,'DÉBITO',$7,$8,$8,12,'FACTURA',$4,$5,$6,1)`,
      [movimientoId, cuentaIngreso, valorREg, encabezado.numero_factura, encabezado.entidad_id, encabezado.moneda, cuentaIvaCredito, totalIVA]
    );

    // 5️⃣ Insertar pagos y sus débitos
    for (const pago of pagos) {
      await pool.query(
        `INSERT INTO detalle_pago (compras_ventas_id, fecha_pago, moneda, cuenta_id, forma_pago, monto, banco, numero_cheque)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [ventaId, pago.fecha_pago, pago.moneda, pago.cuenta_id, pago.forma_pago, pago.monto, pago.banco, pago.numero_cheque]
      );

      if (["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CHEQUE"].includes(pago.forma_pago)) {
        await pool.query(
          `INSERT INTO movimientos_caja
            (caja_id, tipo, descripcion, monto, moneda, forma_pago, usuario_id, ref_financiero)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [encabezado.caja_id, 'SALIDA', `DEVOLUCIÓN Nº: ${encabezado.numero_factura}`, pago.monto, 'PYG', pago.forma_pago, usuario_id, movimientoId]
        )
      }

      let result = await pool.query(`SELECT id FROM forma_pago WHERE nombre = $1`, [pago.forma_pago]);
      let idFormaPago = result.rows[0]?.id;
      await pool.query(
        `INSERT INTO detalle_movimientos (movimiento_id, tipo, cuenta_id, monto, monto_moneda_cuenta, forma_pago, tp_doc, documento, entidad, moneda, cambio)
                 VALUES ($1,'CRÉDITO',$2,$3,$3,$4,'FACTURA',$5,$6,$7,1)`,
        [movimientoId, pago.cuenta_id, pago.monto, idFormaPago, encabezado.numero_factura, encabezado.entidad_id, pago.moneda]
      );
    }

    if (timbrado) {
      const generarNuevo = await pool.query(
        `SELECT COALESCE(numero_actual, numero_inicio, 0) + 1 AS nuevonumero
     FROM timbrado
     WHERE numero_timbrado = $1`,
        [timbrado]
      );

      console.log("Resultado query:", generarNuevo.rows);
      console.log("Timbrado recibido:", timbrado);

      if (generarNuevo.rows.length === 0) {
        throw new Error("Timbrado no encontrado");
      }

      const nuevoNum = generarNuevo.rows[0].nuevonumero;

      if (nuevoNum === null || nuevoNum === undefined) {
        throw new Error("No se pudo generar el número de factura");
      }

      await pool.query(
        `UPDATE timbrado
     SET numero_actual = $1
     WHERE numero_timbrado = $2`,
        [nuevoNum, timbrado]
      );

      console.log("Nuevo número asignado:", nuevoNum);
    }


    await pool.query('COMMIT');
    res.json({ ok: true, mensaje: 'Devolución y movimiento financiero guardados correctamente' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al guardar devolución', error: err.message });
  }
};


export const generarNuevaSeqVenta = async (req, res) => {
  const { timbrado } = req.params;
  try {
    const result = await pool.query(`SELECT
  codigo_emp,
  codigo_suc,
  LPAD((COALESCE(MAX(numero_actual), 0) + 1)::text, 7, '0') AS numero_incremental,
  codigo_emp || '-' || codigo_suc || '-' || LPAD((COALESCE(MAX(numero_actual), 0) + 1)::text, 7, '0') AS numero_factura
FROM timbrado
WHERE numero_timbrado = $1
GROUP BY codigo_emp, codigo_suc;`,
      [timbrado]
    )
    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error(error);
  }
}


export const inactivarCompraVenta = async (req, res) => {
    const { id } = req.params;
    const { forzar } = req.query;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1️⃣ Buscar hijos (devoluciones)
        const { rows: hijos } = await client.query(
            `SELECT id, estado
             FROM compras_ventas
             WHERE referencia_id = $1`,
            [id]
        );

        const hijosActivos = hijos.filter(h => h.estado === "ACTIVO");

        // 2️⃣ Si hay hijos activos y NO viene forzar → bloquear
        if (hijosActivos.length > 0 && forzar !== "true") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Esta venta tiene devoluciones activas",
                tieneReferencias: true
            });
        }

        // 3️⃣ Si viene forzar → inactivar hijos primero
        if (hijosActivos.length > 0 && forzar === "true") {
            await client.query(
                `UPDATE compras_ventas
                 SET estado = 'INACTIVO'
                 WHERE referencia_id = $1`,
                [id]
            );
        }

        // 4️⃣ Inactivar la venta
        await client.query(
            `UPDATE compras_ventas
             SET estado = 'INACTIVO'
             WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");

        res.json({ message: "Registro inactivado correctamente" });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);

        res.status(500).json({
            message: "Error al inactivar"
        });
    } finally {
        client.release();
    }
};







// ===============================
// 🔹 FORMATEADORES
// ===============================
const formatearNumero = (valor) => {
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
};

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
};

const formatearNumeroFactura = (venta) => {
  const suc = (venta.codigo_suc || '1').padStart(3, '0');
  const exp = (venta.codigo_emp || '1').padStart(3, '0');
  const num = String(venta.numero_factura).padStart(7, '0');
  return `${num}`;
};

// ===============================
// 🔹 CONTROLADOR
// ===============================
export const imprimirVenta = async (req, res) => {
  const { id, tipo } = req.params;

  try {

    const result = await pool.query(`
      SELECT 
        cv.*,
        e.nombre AS cliente_nombre,

        t.numero_timbrado,
        t.fecha_inicio,
        t.fecha_fin,
        t.codigo_suc,
        t.codigo_emp,
        t.numero_inicio,
        t.numero_fin,

        COALESCE(
          json_agg(
            jsonb_build_object(
              'producto_nombre', a.nombre_articulo,
              'cantidad', dv.cantidad,
              'precio_unitario', dv.precio_unitario,
              'impuesto_por', dv.impuesto_por,
              'impuesto', dv.impuesto,
              'total', dv.total
            )
          ) FILTER (WHERE dv.id IS NOT NULL),
          '[]'
        ) AS productos,

        COALESCE(
          json_agg(
            jsonb_build_object(
              'fecha_pago', dp.fecha_pago,
              'forma_pago', dp.forma_pago,
              'moneda', dp.moneda,
              'monto', dp.monto,
              'banco', dp.banco,
              'numero_cheque', dp.numero_cheque
            )
          ) FILTER (WHERE dp.id IS NOT NULL),
          '[]'
        ) AS pagos

      FROM compras_ventas cv
      LEFT JOIN entidades e ON e.id = cv.entidad_id
      LEFT JOIN timbrado t ON t.numero_timbrado = cv.timbrado
      LEFT JOIN detalle_compras_ventas dv ON dv.compra_venta_id = cv.id
      LEFT JOIN articulo a ON a.id = dv.producto_id
      LEFT JOIN detalle_pago dp ON dp.compras_ventas_id = cv.id

      WHERE cv.id = $1
      GROUP BY 
        cv.id, e.nombre,
        t.numero_timbrado, t.fecha_inicio, t.fecha_fin,
        t.codigo_suc, t.codigo_emp,
        t.numero_inicio, t.numero_fin
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, mensaje: "Venta no encontrada" });
    }

    const buscarDatosEmp = await pool.query(`SELECT * FROM empresa`);
    const datosEmpresa = await buscarDatosEmp.rows[0];

    const venta = result.rows[0];
    const productos = venta.productos || [];
    const pagos = venta.pagos || [];

    if (venta.numero_factura > venta.numero_fin) {
      return res.status(400).json({
        ok: false,
        mensaje: "Número de factura fuera de rango del timbrado"
      });
    }

    const totalIVA5 = productos.reduce((acc, i) => acc + (i.impuesto_por === "5%" ? Number(i.impuesto) : 0), 0);
    const totalIVA10 = productos.reduce((acc, i) => acc + (i.impuesto_por === "10%" ? Number(i.impuesto) : 0), 0);
    const totalGeneral = productos.reduce((acc, i) => acc + Number(i.total), 0);

    const numeroFacturaFormateado = formatearNumeroFactura(venta);

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${tipo}_${numeroFacturaFormateado}.pdf`);
      res.send(pdfData);
    });

    const COLOR_PRIMARY = "#359bac";
    const COLOR_LIGHT = "#f1f5f9";

    // HEADER
    if (fs.existsSync("./public/logo.png")) {
      doc.image("./public/logo.png", 40, 30, { width: 90 });
    }

    doc.font("Helvetica-Bold").fontSize(12)
      .text(datosEmpresa.nombre_fantasia, 150, 30)
      .font("Helvetica").fontSize(9)
      .text(`RUC: ${datosEmpresa.ruc}`)
      .text(`Dirección: ${datosEmpresa.direccion}`)
      .text(`Tel: ${datosEmpresa.telefono}`);

    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLOR_PRIMARY)
      .text(tipo === "factura" ? "FACTURA" : "NOTA DE CRÉDITO", 0, 30, { align: "right" });

    // TIMBRADO
    doc.rect(380, 60, 180, 80).stroke();

    doc.fontSize(9).fillColor("black")
      .text(`Timbrado N°: ${venta.numero_timbrado}`, 390, 70)
      .text(`Vigencia: ${new Date(venta.fecha_inicio).toLocaleDateString()} al ${new Date(venta.fecha_fin).toLocaleDateString()}`, 390, 85)
      .text(`Factura N°: ${numeroFacturaFormateado}`, 390, 105)
      .text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 390, 120);

    // CLIENTE
    doc.rect(40, 130, 520, 60).fillAndStroke(COLOR_LIGHT, "#ccc");

    doc.font("Helvetica-Bold").fillColor("black").text("Datos del Cliente", 50, 135);

    doc.font("Helvetica").fontSize(10)
      .text(`Cliente: ${venta.cliente_nombre}`, 50, 150)
      .text(`Condición: ${venta.condicion_pago}`, 50, 165)
      .text(`Estado: ${venta.estado}`, 300, 150);

    // TABLA
    const startY = 210;

    const cols = {
      producto: { x: 45, width: 240 },
      cantidad: { x: 300, width: 50 },
      precio: { x: 360, width: 60 },
      iva: { x: 420, width: 50 },
      total: { x: 480, width: 60 },
    };

    doc.rect(40, startY, 520, 20).fill(COLOR_PRIMARY);

    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);

    doc.text("Descripción", cols.producto.x, startY + 5, { width: cols.producto.width });
    doc.text("Cant.", cols.cantidad.x, startY + 5, { width: cols.cantidad.width, align: "right" });
    doc.text("Precio", cols.precio.x, startY + 5, { width: cols.precio.width, align: "right" });
    doc.text("IVA", cols.iva.x, startY + 5, { width: cols.iva.width, align: "right" });
    doc.text("Total", cols.total.x, startY + 5, { width: cols.total.width, align: "right" });

    let y = startY + 20;

    doc.font("Helvetica").fillColor("black");

    productos.forEach((p, i) => {
      if (i % 2 === 0) {
        doc.rect(40, y, 520, 18).fill(COLOR_LIGHT);
      }

      doc.fillColor("black").fontSize(10);

      doc.text(p.producto_nombre, cols.producto.x, y + 4, { width: cols.producto.width });

      doc.text(formatearNumero(p.cantidad), cols.cantidad.x, y + 4, {
        width: cols.cantidad.width,
        align: "right",
      });

      doc.text(formatearNumero(p.precio_unitario), cols.precio.x, y + 4, {
        width: cols.precio.width,
        align: "right",
      });

      doc.text(p.impuesto_por, cols.iva.x, y + 4, {
        width: cols.iva.width,
        align: "right",
      });

      doc.text(formatearNumero(p.total), cols.total.x, y + 4, {
        width: cols.total.width,
        align: "right",
      });

      y += 18;
    });

    // TOTALES
    const boxY = y + 10;

    doc.rect(340, boxY, 220, 80).stroke();

    doc.font("Helvetica-Bold").text("Resumen", 350, boxY + 5);

    doc.font("Helvetica");

    doc.text("IVA 5%:", 350, boxY + 25);
    doc.text(formatearNumero(totalIVA5), 480, boxY + 25, { width: 80, align: "right" });

    doc.text("IVA 10%:", 350, boxY + 40);
    doc.text(formatearNumero(totalIVA10), 480, boxY + 40, { width: 80, align: "right" });

    doc.font("Helvetica-Bold");

    doc.text("TOTAL:", 350, boxY + 60);
    doc.text(formatearMoneda(totalGeneral), 480, boxY + 60, { width: 80, align: "right" });

    // PAGOS
    if (pagos.length) {
      doc.moveDown(3);
      doc.font("Helvetica-Bold").text("Detalle de Pagos");

      doc.font("Helvetica");

      pagos.forEach(p => {
        doc.text(
          `${new Date(p.fecha_pago).toLocaleDateString()} - ${p.forma_pago} - ${p.moneda} ${formatearNumero(p.monto)}`
        );
      });
    }

    // FOOTER
    doc.fontSize(8).fillColor("#64748b")
      .text("Documento generado electrónicamente conforme a la DNIT Paraguay", 40, 750, { align: "center" });

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al generar PDF",
      error: error.message
    });
  }
};