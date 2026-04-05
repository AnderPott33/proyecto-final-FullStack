import { pool } from '../config/db.js';


// POST /api/caja/loguear
export const loguearCaja = async (req, res) => {
    try {
        const usuarioId = req.user.id; // obtenlo del token JWT o sesión
        const { cajaId } = req.body;

        if (!cajaId) {
            return res.status(400).json({ error: "Falta el ID de la caja" });
        }

        // Actualiza el usuario con la caja logueada
        await pool.query(
            `UPDATE usuarios
       SET caja_logueada = $1
       WHERE id = $2`,
            [cajaId, usuarioId]
        );

        res.json({ message: "Caja logueada correctamente", cajaId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const cajaLogueada = async (req, res) => {
    const usuarioId = req.user.id;

    try {
        const result = await pool.query(`
    SELECT c.*
    FROM cajas c
    JOIN usuarios u ON u.caja_logueada = c.id
    WHERE u.id = $1
  `, [usuarioId]);

        res.json(result.rows[0] || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const listarCajas = async (req, res) => {
    try {
        const result = await pool.query(`SELECT
          c.id,
          u.nombre as usuario,
          c.fecha_apertura,
          c.moneda,
          c.fecha_cierre,
          c.saldo_inicial,
          c.saldo_final,
          c.estado
          FROM cajas c
          JOIN usuarios u on u.id = c.usuario_id;
          `);
        res.json(result.rows); // 🔥 siempre devolver datos

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Abrir caja */
export const abrirCaja = async (req, res) => {
    try {
        const { saldo_inicial } = req.body;
        const { moneda } = req.body;
        const { fecha_apertura } = req.body;
        const usuario_id = req.user.id;

        // 👇 FIX AQUÍ
        let movimiento_id = null;

        // Validar que no haya caja abierta
        const abierta = await pool.query(
            'SELECT * FROM cajas WHERE usuario_id = $1 AND estado = $2',
            [usuario_id, 'ABIERTA']
        );

        let advertencia = null;

        if (abierta.rows.length > 0) {
            advertencia = 'Ya tienes una caja abierta';
        }

        // Crear la caja
        const result = await pool.query(
            'INSERT INTO cajas (usuario_id, fecha_apertura, saldo_inicial, moneda) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario_id, fecha_apertura, saldo_inicial, moneda || 0]
        );

        const nuevaCaja = result.rows[0];

        await pool.query(
            `UPDATE usuarios
             SET caja_logueada = $1
             WHERE id = $2`,
            [nuevaCaja.id, usuario_id]
        );

        let cuenta = null;
        if (moneda === 'PYG') {
            cuenta = 1;
        } else if (moneda === 'USD') {
            cuenta = 2;
        } else if (moneda === 'BRL') {
            cuenta = 3;
        }

        if (saldo_inicial > 0) {

            const movimientoResult = await pool.query(
                `INSERT INTO movimientos_financieros 
            (fecha, descripcion, usuario_id, moneda_principal, tipo_operacion, estado, caja_logueada)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id`,
                [
                    new Date(),
                    'DEPOSITO POR MODULO CAJA: APERTURA CAJA Nº: #' + nuevaCaja.id,
                    usuario_id,
                    moneda,
                    'REGISTRO CAJA',
                    'ACTIVO',
                    nuevaCaja.id,
                ]
            );

            // 👇 ya no es const
            movimiento_id = movimientoResult.rows[0].id;

            await pool.query(
                `INSERT INTO detalle_movimientos 
            (movimiento_id, cuenta_id, tipo, monto, monto_moneda_cuenta, forma_pago)
            VALUES ($1, $2, $3, $4, $5, $6)`,
                [movimiento_id, cuenta, 'DÉBITO', saldo_inicial, saldo_inicial, 1]
            );
            await pool.query(
                `INSERT INTO detalle_movimientos 
            (movimiento_id, cuenta_id, tipo, monto, monto_moneda_cuenta, forma_pago)
            VALUES ($1, $2, $3, $4, $5, $6)`,
                [movimiento_id, cuenta, 'CRÉDITO', saldo_inicial, saldo_inicial, 1]
            );

            if (saldo_inicial && Number(saldo_inicial) > 0) {
                await pool.query(
                    `INSERT INTO movimientos_caja
         (caja_id, tipo, descripcion, monto, moneda, forma_pago, usuario_id, ref_financiero)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [nuevaCaja.id, 'INGRESO', 'SALDO INICIAL Ref Mov. Nº: ' + movimiento_id, saldo_inicial, moneda, 'EFECTIVO', usuario_id, movimiento_id]
                );
            }
        }

        res.json({
            msg: 'Caja abierta',
            warning: advertencia,
            caja: nuevaCaja,
            movimiento: movimiento_id || null
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.error(error.message);
    }
};

/* Actualizar Caja */
export const actualizarCaja = async (req, res) => {
    const { id } = req.params;
    const { fecha_apertura, moneda } = req.body;

    try {
        // Validaciones básicas
        if (!fecha_apertura || !moneda) {
            return res.status(400).json({ error: "Debe enviar fecha_apertura y moneda" });
        }

        // Actualizar la caja
        const query = `
      UPDATE cajas
      SET fecha_apertura = $1,
          moneda = $2
      WHERE id = $3
      RETURNING *;
    `;
        const values = [fecha_apertura, moneda, id];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Caja no encontrada" });
        }

        res.json({
            message: "Caja actualizada correctamente",
            caja: result.rows[0],
        });
    } catch (error) {
        console.error("Error actualizando caja:", error);
        res.status(500).json({ error: "Error al actualizar la caja" });
    }
};

/* Registrar movimiento */
export const registrarMovimiento = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let { caja_id, tipo, descripcion, monto, moneda, forma_pago, cerrar = false, cuenta, saldoActual, fecha } = req.body;

        fecha = fecha ? new Date(fecha) : new Date(); // usar fecha enviada o NOW()

        const usuario_id = req.user.id;

        // Normalizar monto
        monto = Number(monto) || 0;

        // Validar caja abierta
        const caja = await client.query(
            'SELECT * FROM cajas WHERE id = $1 AND estado = $2',
            [caja_id, 'ABIERTA']
        );

        if (caja.rows.length === 0) {
            throw new Error('Caja no encontrada o cerrada');
        }

        // Obtener forma de pago
        const formaPagoList = await client.query(
            `SELECT id FROM forma_pago WHERE nombre = $1`,
            [forma_pago]
        );

        if (formaPagoList.rows.length === 0) {
            throw new Error('Forma de pago no existe');
        }

        const formaPagoID = formaPagoList.rows[0].id;

        let movimientoCaja = null;

        // =====================================================
        // 🔹 CASO 1: REGISTRAR MOVIMIENTO (solo si monto > 0)
        // =====================================================
        if (monto > 0) {


            // Movimiento financiero
            const movimientoResult = await client.query(
                `INSERT INTO movimientos_financieros 
    (fecha, descripcion, usuario_id, moneda_principal, tipo_operacion, estado, caja_logueada)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id`,
                [
                    fecha,
                    'DEPOSITO POR MODULO CAJA Nº: #' + caja_id,
                    usuario_id,
                    moneda,
                    'REGISTRO CAJA',
                    'ACTIVO',
                    caja_id
                ]
            );

            const movimiento_id = movimientoResult.rows[0].id;

            const tipoMM = tipo === 'INGRESO' ? 'DÉBITO' : 'CRÉDITO';
            const tipoContrario = tipoMM === 'DÉBITO' ? 'CRÉDITO' : 'DÉBITO';

            // Detalle movimientos
            await client.query(
                `INSERT INTO detalle_movimientos 
    (movimiento_id, cuenta_id, tipo, monto, monto_moneda_cuenta, forma_pago)
    VALUES ($1, $2, $3, $4, $5, $6)`,
                [movimiento_id, cuenta, tipoMM, monto, monto, formaPagoID]
            );

            await client.query(
                `INSERT INTO detalle_movimientos 
    (movimiento_id, cuenta_id, tipo, monto, monto_moneda_cuenta, forma_pago)
    VALUES ($1, $2, $3, $4, $5, $6)`,
                [movimiento_id, cuenta, tipoContrario, monto, monto, formaPagoID]
            );

            // Movimiento de caja con fecha personalizada
            const result = await client.query(
                `INSERT INTO movimientos_caja 
        (caja_id, moneda, tipo, descripcion, monto, forma_pago, usuario_id, ref_financiero, fecha) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) 
        RETURNING *`,
                [caja_id, moneda, tipo, `${descripcion} Ref Mov. Nº: ${movimiento_id}`, monto, forma_pago, usuario_id, movimiento_id, fecha]
            );
            movimientoCaja = result.rows[0];
        }


        // =====================================================
        // 🔹 CASO 2: NO monto y NO cerrar → no hacer nada
        // =====================================================
        if (monto <= 0 && !cerrar) {
            await client.query('COMMIT');
            return res.status(200).json({ msg: 'Sin movimiento' });
        }

        // =====================================================
        // 🔹 CASO 3: CERRAR CAJA (con o sin monto)
        // =====================================================
        if (cerrar === true) {

            await client.query(
                `UPDATE usuarios
                 SET caja_logueada = null
                 WHERE id = $1`,
                [usuario_id]
            );

            await client.query(
                `UPDATE cajas 
                 SET estado=$1, fecha_cierre=NOW(), saldo_final=$2
                 WHERE id=$3`,
                ['CERRADA', saldoActual, caja_id]
            );
        }

        await client.query('COMMIT');

        // =====================================================
        // 🔹 RESPUESTA FINAL
        // =====================================================
        return res.json({
            msg: cerrar
                ? 'Caja cerrada correctamente'
                : 'Movimiento registrado correctamente',
            movimiento: movimientoCaja
        });

    } catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

/* export const registrarMovimiento = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let {
            caja_id,
            tipo,
            descripcion,
            monto,
            moneda,
            forma_pago,
            cerrar = false,
            cuenta,
            saldoActual
        } = req.body;

        const usuario_id = req.user.id;

        // Normalizar monto
        monto = Number(monto) || 0;

        // Validar caja abierta
        const caja = await client.query(
            'SELECT * FROM cajas WHERE id = $1 AND estado = $2',
            [caja_id, 'ABIERTA']
        );

        if (caja.rows.length === 0) {
            throw new Error('Caja no encontrada o cerrada');
        }

        // Obtener forma de pago
        const formaPagoList = await client.query(
            `SELECT id FROM forma_pago WHERE nombre = $1`,
            [forma_pago]
        );

        if (formaPagoList.rows.length === 0) {
            throw new Error('Forma de pago no existe');
        }

        const formaPagoID = formaPagoList.rows[0].id;

        let movimientoCaja = null;

        // =====================================================
        // 🔹 CASO 1: REGISTRAR MOVIMIENTO (solo si monto > 0)
        // =====================================================
        if (monto > 0) {



            // Movimiento financiero
            const movimientoResult = await client.query(
                `INSERT INTO movimientos_financieros 
                (fecha, descripcion, usuario_id, moneda_principal, tipo_operacion, estado, caja_logueada)
                VALUES (NOW(),$1,$2,$3,$4,$5,$6)
                RETURNING id`,
                [
                    'DEPOSITO POR MODULO CAJA Nº: #' + caja_id,
                    usuario_id,
                    moneda,
                    'REGISTRO CAJA',
                    'ACTIVO',
                    caja_id
                ]
            );

            const movimiento_id = movimientoResult.rows[0].id;

            const tipoMM = tipo === 'INGRESO' ? 'DÉBITO' : 'CRÉDITO';
            const tipoContrario = tipoMM === 'DÉBITO' ? 'CRÉDITO' : 'DÉBITO';

            // Línea 1
            await client.query(
                `INSERT INTO detalle_movimientos 
                (movimiento_id, cuenta_id, tipo, monto, monto_moneda_cuenta, forma_pago)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [movimiento_id, cuenta, tipoMM, monto, monto, formaPagoID]
            );

            // Línea 2 (misma cuenta - como vos definiste)
            await client.query(
                `INSERT INTO detalle_movimientos 
                (movimiento_id, cuenta_id, tipo, monto, monto_moneda_cuenta, forma_pago)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [movimiento_id, cuenta, tipoContrario, monto, monto, formaPagoID]
            );
            // Movimiento de caja
            const result = await client.query(
                `INSERT INTO movimientos_caja 
                    (caja_id, moneda, tipo, descripcion, monto, forma_pago, usuario_id,ref_financiero) 
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) 
                    RETURNING *`,
                [caja_id, moneda, tipo, `${descripcion} Ref Mov. Nº: ${movimiento_id}`, monto, forma_pago, usuario_id, movimiento_id]
            );

            movimientoCaja = result.rows[0];
        }


        // =====================================================
        // 🔹 CASO 2: NO monto y NO cerrar → no hacer nada
        // =====================================================
        if (monto <= 0 && !cerrar) {
            await client.query('COMMIT');
            return res.status(200).json({ msg: 'Sin movimiento' });
        }

        // =====================================================
        // 🔹 CASO 3: CERRAR CAJA (con o sin monto)
        // =====================================================
        if (cerrar === true) {

            await client.query(
                `UPDATE usuarios
                 SET caja_logueada = null
                 WHERE id = $1`,
                [usuario_id]
            );

            await client.query(
                `UPDATE cajas 
                 SET estado=$1, fecha_cierre=NOW(), saldo_final=$2
                 WHERE id=$3`,
                ['CERRADA', saldoActual, caja_id]
            );
        }

        await client.query('COMMIT');

        // =====================================================
        // 🔹 RESPUESTA FINAL
        // =====================================================
        return res.json({
            msg: cerrar
                ? 'Caja cerrada correctamente'
                : 'Movimiento registrado correctamente',
            movimiento: movimientoCaja
        });

    } catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}; */

export const reabrirCaja = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar la caja
        const cajaRes = await pool.query('SELECT * FROM cajas WHERE id = $1', [id]);
        if (cajaRes.rows.length === 0) {
            return res.status(404).json({ error: 'Caja no encontrada' });
        }

        const caja = cajaRes.rows[0];

        // Solo permitir reabrir si está cerrada
        if (caja.estado !== 'CERRADA') {
            return res.status(400).json({ error: 'Solo se pueden reabrir cajas cerradas' });
        }

        // Actualizar estado a ABIERTA
        const result = await pool.query(
            'UPDATE cajas SET estado=$1 WHERE id=$2 RETURNING *',
            ['ABIERTA', id]
        );

        res.json({ msg: 'Caja reabierta', caja: result.rows[0] });

    } catch (error) {
        console.error("Error al reabrir la caja:", error);
        res.status(500).json({ error: error.message });
    }
};

/* Cerrar caja */
export const cerrarCaja = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        // Liberar usuario
        await pool.query(
            `UPDATE usuarios
             SET caja_logueada = null
             WHERE id = $1`,
            [usuarioId]
        );
        // Enviar respuesta al frontend
        res.json({ message: "Caja cerrada correctamente" });

    } catch (error) {
        console.error("Error en cerrarCaja:", error);
        res.status(500).json({ error: error.message });
    }
};

export const EliminarMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM movimientos_caja WHERE id = $1", [id]);
        res.json({ msg: "Movimiento eliminado" });
    } catch (error) {
        console.error("Error eliminando movimiento:", error);
        res.status(500).json({ error: error.message });
    }
};

/* Consultar movimientos */
export const consultarMovimientos = async (req, res) => {

    try {
        const { caja } = req.params;

        const result = await pool.query(
            'SELECT * FROM movimientos_caja WHERE caja_id = $1 AND estado = $2  ORDER BY fecha ASC',
            [caja, 'ACTIVO']
        );

        res.json({ movimientos: result.rows });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const ListarMovimientoCaja = async (req, res) => {
    try {
        const { caja, formaPago } = req.query;

        const result = await pool.query(
            `SELECT 
    m.id,
    m.caja_id,
    m.usuario_id,
    u.nombre as usuario,
    m.tipo,
    m.moneda,
    m.descripcion,
    CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE 0 END AS ingreso,
    CASE WHEN m.tipo = 'SALIDA' THEN m.monto ELSE 0 END AS salida,
    m.forma_pago,
    m.fecha,
    m.ref_financiero,
    -- saldo acumulado
    SUM(
        CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE 0 END
        -
        CASE WHEN m.tipo = 'SALIDA' THEN m.monto ELSE 0 END
    ) OVER (ORDER BY m.fecha, m.id) AS saldo
FROM movimientos_caja m
LEFT JOIN usuarios u ON u.id = m.usuario_id
JOIN cajas c ON c.id = m.caja_id
WHERE m.caja_id = $1
and m.forma_pago = $2
AND m.estado = $3
ORDER BY m.fecha, m.id ASC;`, [caja, formaPago, 'ACTIVO']
        );

        res.json({ movimientos: result.rows })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}