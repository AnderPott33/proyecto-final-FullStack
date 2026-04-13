import { pool } from '../config/db.js';

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
            SELECT v.id, v.fecha, v.numero_factura, v.timbrado, t.fecha_inicio, t.fecha_fin, v.condicion_pago,
                   v.moneda, v.observacion, e.id AS cliente_id, e.nombre AS cliente_nombre, e.ruc AS cliente_ruc,
                   e.direccion, e.ruc, e.telefono, e.email, vv.numero_factura as factura_vinculada,
                   v.usuario_id, v.estado, v.tipo, v.referencia_id
            FROM compras_ventas v
            LEFT JOIN timbrado t ON t.numero_timbrado = v.timbrado
            LEFT JOIN entidades e ON v.entidad_id = e.id
            LEFT JOIN compras_ventas vv ON vv.id = v.referencia_id
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
 const usuario_id = req.user.id;
  // 🔹 Obtener usuario
  const usuario = await pool.query(
    "SELECT nombre FROM usuarios WHERE id = $1",
    [usuario_id]
  );
  const fecha = new Date();

  const pad = (n) => n.toString().padStart(2, "0");

  const fechaFormateada = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;


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


    // 3️⃣ BUSCAR MOVIMIENTO FINANCIERO
    const mov = await client.query(
      `SELECT id 
             FROM movimientos_financieros 
             WHERE referencia = $1`,
      [`V${id}`]
    );



    if (mov.rowCount > 0) {
      const movimientoId = mov.rows[0].id;
      const motivo = 'INACTIVADO POR MODULO VENTA!!'
      const obs = `Inactivado por: ${usuario.rows[0].nombre} | ${fechaFormateada} | ${motivo}`;

      // 4️⃣ INACTIVAR FINANCIERO
      await client.query(
        `UPDATE movimientos_financieros
                 SET estado = 'INACTIVO', motivo_inac = $2
                 WHERE id = $1`,
        [movimientoId, obs]
      );


      // 6️⃣ INACTIVAR CAJA
      await client.query(
        `UPDATE movimientos_caja
                 SET estado = 'INACTIVO'
                 WHERE ref_financiero = $1`,
        [movimientoId]
      );
    }




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


export const inactivarCompraVenta2 = async (req, res) => {
  const { id } = req.params;
  const { forzar } = req.query;
  const usuario_id = req.user.id;
  // 🔹 Obtener usuario
  const usuario = await pool.query(
    "SELECT nombre FROM usuarios WHERE id = $1",
    [usuario_id]
  );
  const fecha = new Date();

  const pad = (n) => n.toString().padStart(2, "0");

  const fechaFormateada = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ INACTIVAR VENTA
    await client.query(
      `UPDATE compras_ventas
             SET estado = 'INACTIVO'
             WHERE id = $1`,
      [id]
    );

    // 2️⃣ INACTIVAR DEVOLUCIONES
    const { rows: hijos } = await client.query(
      `UPDATE compras_ventas
             SET estado = 'INACTIVO'
             WHERE referencia_id = $1
             RETURNING id`,
      [id]
    );

    // 3️⃣ BUSCAR MOVIMIENTO FINANCIERO
    const mov = await client.query(
      `SELECT id 
             FROM movimientos_financieros 
             WHERE referencia = $1`,
      [`V${id}`]
    );

    if (mov.rowCount > 0) {
      const movimientoId = mov.rows[0].id;
      const motivo = 'INACTIVADO POR MODULO VENTA!!'
      const obs = `Inactivado por: ${usuario.rows[0].nombre} | ${fechaFormateada} | ${motivo}`;

      // 4️⃣ INACTIVAR FINANCIERO
      await client.query(
        `UPDATE movimientos_financieros
                 SET estado = 'INACTIVO', motivo_inac = $2
                 WHERE id = $1`,
        [movimientoId, obs]
      );


      // 6️⃣ INACTIVAR CAJA
      await client.query(
        `UPDATE movimientos_caja
                 SET estado = 'INACTIVO'
                 WHERE ref_financiero = $1`,
        [movimientoId]
      );
    }

    await client.query("COMMIT");

    return res.json({
      message: "Venta y movimientos relacionados inactivados correctamente"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return res.status(500).json({
      message: "Error al inactivar",
      error: error.message
    });

  } finally {
    client.release();
  }
};