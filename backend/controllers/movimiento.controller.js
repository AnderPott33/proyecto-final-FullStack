import { pool } from "../config/db.js";

// Registrar movimiento financiero con detalle

export const registrarMovimiento = async (req, res) => {
  const {
    fecha,
    punto_exp,
    descripcion,
    referencia,
    usuario_id,
    moneda_principal = "PYG",
    tipo_cambio = 1,
    tipo_operacion,
    estado = "INICIADO",
    caja_logueada,
    detalle = []
  } = req.body;

  if (!usuario_id || !tipo_operacion || detalle.length === 0) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    await pool.query("BEGIN");

    // ✅ INSERT ENCABEZADO
    const movimientoResult = await pool.query(
      `INSERT INTO movimientos_financieros 
        (fecha, descripcion, referencia, usuario_id, moneda_principal, tipo_cambio, tipo_operacion, estado, caja_logueada,punto_exp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [fecha, descripcion, referencia, usuario_id, moneda_principal, tipo_cambio, tipo_operacion, estado, caja_logueada,punto_exp]
    );

    const movimiento_id = movimientoResult.rows[0].id;

    // ✅ QUERY CORREGIDA (9 columnas = 9 valores)
    const insertDetalleQuery = `
      INSERT INTO detalle_movimientos 
      (movimiento_id, cuenta_id, tipo, monto, descripcion, monto_moneda_cuenta, forma_pago, cambio, moneda, tp_doc, documento, entidad)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `;

    // ✅ INSERT DETALLE
    for (const item of detalle) {
      const {
        cuenta_id,
        tipo,
        monto,
        descripcion: descItem,
        monto_moneda_cuenta,
        forma_pago,
        cambio,
        monedaCta,
        tp_doc,
        documento,
        entidad
      } = item;

      await pool.query(insertDetalleQuery, [
        movimiento_id,
        cuenta_id,
        tipo,
        monto,
        descItem || "",
        monto_moneda_cuenta, // ✅ ya calculado en frontend
        forma_pago,
        cambio,
        monedaCta,
        tp_doc,
        documento,
        entidad
      ]);
    }

    // ✅ MOVIMIENTOS DE CAJA
    for (const item of detalle) {
      const { tipo, monto, forma_pago } = item;

      const tipoMov = tipo === 'DÉBITO' ? 'INGRESO' : 'SALIDA';

      const formaRes = await pool.query(
        'SELECT nombre FROM forma_pago WHERE id = $1',
        [forma_pago]
      );

      if (!formaRes.rows.length) continue;

      const nombreForma = formaRes.rows[0].nombre.toUpperCase();

      if (["EFECTIVO", "TARJETA", "TRANSFERENCIA"].includes(nombreForma)) {
        await pool.query(
          `INSERT INTO movimientos_caja
            (caja_id, tipo, descripcion, monto, moneda, forma_pago, usuario_id, ref_financiero)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            caja_logueada,
            tipoMov,
            `${descripcion} Ref Mov. Nº: ${movimiento_id}`,
            monto,
            moneda_principal,
            nombreForma,
            usuario_id,
            movimiento_id
          ]
        );
      }
    }

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Movimiento registrado correctamente",
      id: movimiento_id
    });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al registrar movimiento:", error);
    res.status(500).json({
      message: "Error al registrar movimiento",
      error: error.message
    });
  } finally {
    pool.release();
  }
};

export const inactivarMovimiento = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const usuario_id = req.user.id;

  try {
    // 🔹 Validar motivo
    if (!motivo || motivo.trim() === "") {
      return res.status(400).json({
        message: "El motivo es obligatorio"
      });
    }

    // 🔹 Obtener usuario
    const usuario = await pool.query(
      "SELECT nombre FROM usuarios WHERE id = $1",
      [usuario_id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    // 🔹 Formatear fecha DD/MM/YYYY HH:mm:ss
    const fecha = new Date();

    const pad = (n) => n.toString().padStart(2, "0");

    const fechaFormateada = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;

    // 🔹 Actualizar movimiento
    const resUpdate = await pool.query(
      `UPDATE movimientos_financieros 
       SET estado = 'INACTIVO',
           motivo_inac = $1
       WHERE id = $2 AND estado = 'ACTIVO'
       RETURNING *`,
      [
        `Inactivado por: ${usuario.rows[0].nombre} | ${fechaFormateada} | ${motivo}`,
        id
      ]
    );

    await pool.query(
        `UPDATE movimientos_caja 
         SET estado = 'INACTIVO'
         WHERE ref_financiero = $1`,
        [id]
      );

    // 🔹 Validar si se actualizó
    if (resUpdate.rowCount === 0) {
      return res.status(400).json({
        message: "El movimiento no existe o ya está inactivo"
      });
    }

    // 🔹 Respuesta OK
    return res.json({
      message: "Movimiento inactivado correctamente",
      movimiento: resUpdate.rows[0]
    });

  } catch (error) {
    console.error("Error al inactivar movimiento:", error);
    return res.status(500).json({
      message: "Error al inactivar movimiento",
      error: error.message
    });
  }
};

export const listarMovimientos = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vw_movimientos_resumidos ORDER BY fecha DESC"
    );
    res.json({ movimientos: result.rows });
  } catch (error) {
    console.error("Error al listar movimientos:", error);
    res.status(500).json({
      message: "Error al listar movimientos",
      error: error.message
    });
  }
};


export const obtenerMovimientoCompleto = async (req, res) => {
  try {
    const { id } = req.params; // movimiento_id

    // 1️⃣ Obtener encabezado del movimiento
    const movimientoRes = await pool.query(
      `SELECT mf.*,
              u.nombre AS usuario_nombre,
              pe.nombre as punto_exp
       FROM movimientos_financieros mf
       LEFT JOIN usuarios u ON mf.usuario_id = u.id
       LEFT JOIN punto_expedicion pe ON pe.id = mf.punto_exp
       WHERE mf.id = $1`,
      [id]
    );

    if (movimientoRes.rows.length === 0) {
      return res.status(404).json({ mensaje: "Movimiento no encontrado" });
    }

    const movimiento = movimientoRes.rows[0];

    // 2️⃣ Obtener detalles del movimiento
    const detallesRes = await pool.query(
      `SELECT dm.*,
              c.nombre AS cuenta_nombre,
              fp.nombre AS forma_pago,
              e.nombre AS entidad
       FROM detalle_movimientos dm
       LEFT JOIN cuentas c ON dm.cuenta_id = c.id
       LEFT JOIN forma_pago fp ON dm.forma_pago = fp.id
       LEFT JOIN entidades e ON dm.entidad = e.id
       WHERE dm.movimiento_id = $1
       ORDER BY dm.id`,
      [id]
    );

    movimiento.detalles = detallesRes.rows;

    res.json({ movimiento });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el movimiento completo" });
  }
};