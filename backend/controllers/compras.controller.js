import { pool } from '../config/db.js';

import PDFDocument from 'pdfkit';
import fs from 'fs';

// Obtener venta completa
/* router.get("/:id", */
export const buscarCompra = async (req, res) => {
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
WHERE v.tipo IN ('COMPRA', 'NOTA CRÉDITO RECEBIDA')
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

export const buscarComprasYDevoluciones = async (req, res) => {
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
WHERE v.tipo IN ('COMPRA', 'NOTA CRÉDITO RECEBIDA') and v.estado = 'ACTIVO'
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

export const crearCompra = async (req, res) => {
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
        [item.producto_id, encabezado.fecha, 'COMPRA', item.cantidad, 1, item.precio_unitario, ventaId, 'FACTURA COMPRA', encabezado.numero_factura, 'AJUSTE AUTOMÁTICO POR VENTA', usuario_id]
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
        'COMPRA',
        encabezado.caja_id,
        'ACTIVO',
        encabezado.punto_exp,
        `COMPRA REGISTRADA Nº: ${encabezado.numero_factura}`
      ]
    );

    const movimientoId = movimientoInsert.rows[0].id;

    // 4️⃣ Insertar detalle_movimientos de ingreso y IVA
    const cuentaGasto = (await pool.query(`SELECT cuenta_gasto_compra FROM empresa`)).rows[0].cuenta_gasto_compra;
    const cuentaIvaDebito = (await pool.query(`SELECT cuenta_iva_debito FROM empresa`)).rows[0].cuenta_iva_debito;

    const totalVenta = detalle.reduce((acc, i) => acc + i.total, 0);
    const totalIVA = detalle.reduce((acc, i) => acc + i.impuesto, 0);
    const valorREg = totalVenta - totalIVA

    await pool.query(
      `INSERT INTO detalle_movimientos (movimiento_id, tipo, cuenta_id, monto, monto_moneda_cuenta, forma_pago, tp_doc, documento, entidad, moneda, cambio)
             VALUES 
             ($1,'DÉBITO',$2,$3,$3,12,'FACTURA',$4,$5,$6,1),
             ($1,'DÉBITO',$7,$8,$8,12,'FACTURA',$4,$5,$6,1)`,
      [movimientoId, cuentaGasto, valorREg, encabezado.numero_factura, encabezado.entidad_id, encabezado.moneda, cuentaIvaDebito, totalIVA]
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
          [encabezado.caja_id, 'SALIDA', `COMPRA Nº: ${encabezado.numero_factura}`, pago.monto, 'PYG', pago.forma_pago, usuario_id, movimientoId]
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


    /*  if (encabezado.timbrado) {
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
     } */

    await pool.query('COMMIT');
    res.json({ ok: true, mensaje: 'Venta y movimiento financiero guardados correctamente' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al guardar venta', error: err.message });
  }
};

export const devolverCompra = async (req, res) => {
  try {
    const { encabezado, detalle, pagos } = req.body;
    const usuario_id = req.user.id;

    await pool.query('BEGIN');

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
        [item.producto_id, encabezado.fecha, 'COMPRA', item.cantidad, 1, item.precio_unitario, ventaId, 'DEVOLUCIÓN COMPRA', encabezado.numero_factura, 'AJUSTE AUTOMÁTICO POR VENTA', usuario_id]
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
        'DEVOLUCIÓN COMPRA',
        encabezado.caja_id,
        'ACTIVO',
        encabezado.punto_exp,
        `DEVOLUCIÓN COMP. REGISTRADA Nº: ${encabezado.numero_factura}`
      ]
    );

    const movimientoId = movimientoInsert.rows[0].id;

    // 4️⃣ Insertar detalle_movimientos de ingreso y IVA
    const cuentaGasto = (await pool.query(`SELECT cuenta_gasto_compra FROM empresa`)).rows[0].cuenta_gasto_compra;
    const cuentaIvaDebito = (await pool.query(`SELECT cuenta_iva_debito FROM empresa`)).rows[0].cuenta_iva_debito;

    const totalVenta = detalle.reduce((acc, i) => acc + i.total, 0);
    const totalIVA = detalle.reduce((acc, i) => acc + i.impuesto, 0);
    const valorREg = totalVenta - totalIVA

    await pool.query(
      `INSERT INTO detalle_movimientos (movimiento_id, tipo, cuenta_id, monto, monto_moneda_cuenta, forma_pago, tp_doc, documento, entidad, moneda, cambio)
             VALUES 
             ($1,'CRÉDITO',$2,$3,$3,12,'FACTURA',$4,$5,$6,1),
             ($1,'CRÉDITO',$7,$8,$8,12,'FACTURA',$4,$5,$6,1)`,
      [movimientoId, cuentaGasto, valorREg, encabezado.numero_factura, encabezado.entidad_id, encabezado.moneda, cuentaIvaDebito, totalIVA]
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
          [encabezado.caja_id, 'INGRESO', `DEVOLUCIÓN Nº: ${encabezado.numero_factura}`, pago.monto, 'PYG', pago.forma_pago, usuario_id, movimientoId]
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

    await pool.query('COMMIT');
    res.json({ ok: true, mensaje: 'Venta y movimiento financiero guardados correctamente' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al guardar venta', error: err.message });
  }
};


export const buscarComprasId = async (req, res) => {
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
      return res.status(404).json({ message: "Compra no encontrada" });
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
    console.error("ERROR EN buscarComprasId:", error);
    res.status(500).json({
      message: "Error al obtener la venta",
      error: error.message
    });
  }
};


