import { pool } from '../config/db.js';

// Obtener todas las cuentas
export const obtenerCuentas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cuentas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCuentaFormaPago = async (req, res) => {
  const { id } = req.body; // <- cambiar params por body

  try {
    // Buscamos la forma
    const forma = await pool.query(
      `SELECT * FROM forma_pago WHERE id = $1`,
      [id]
    );

    if (!forma.rows.length) return res.json(null);

    const tipoForma = forma.rows[0].sub_tipo;

    // Buscamos la cuenta que coincida con tipo y moneda
    const cuenta = await pool.query(
      `SELECT * FROM cuentas WHERE UPPER(sub_tipo) = UPPER($1)`,
      [tipoForma]
    );

    res.json(cuenta.rows || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener cuenta dinámica" });
  }
};

export const obtenerCuentaFormaPago2 = async (req, res) => {
  const { nombre } = req.body; // <- cambiar params por body

  try {
    // Buscamos la forma
    const forma = await pool.query(
      `SELECT * FROM forma_pago WHERE nombre = $1`,
      [nombre]
    );

    if (!forma.rows.length) return res.json(null);

    const tipoForma = forma.rows[0].sub_tipo;

    // Buscamos la cuenta que coincida con tipo y moneda
    const cuenta = await pool.query(
      `SELECT * FROM cuentas WHERE UPPER(sub_tipo) = UPPER($1)`,
      [tipoForma]
    );

    res.json(cuenta.rows || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener cuenta dinámica" });
  }
};

// Obtener cuenta por ID
export const obtenerCuentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cuentas WHERE id = $1', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Obtener saldo secuencial filtrado por cuenta y fecha
export const obtenerAnaliticoCuenta = async (req, res) => {
  const { cuentaId, fechaInicio, fechaFin } = req.body;

  try {
    const result = await pool.query(

      `WITH saldoAnterior AS (
    SELECT
        c.id AS cuenta_id,
        c.nombre AS cuenta,
        c.saldo_inicial +
        COALESCE(SUM(

                    CASE 
                        WHEN dm.tipo = 'DÉBITO' AND mf.fecha < $2::timestamp THEN dm.monto_moneda_cuenta
                        WHEN dm.tipo = 'CRÉDITO' AND mf.fecha < $2::timestamp THEN -dm.monto_moneda_cuenta
                        ELSE 0
                    END

        ), 0) AS saldo_anterior
    FROM cuentas c
    LEFT JOIN detalle_movimientos dm
        ON dm.cuenta_id = c.id
    LEFT JOIN movimientos_financieros mf
        ON mf.id = dm.movimiento_id
        AND mf.estado = 'ACTIVO'
    WHERE c.id = $1
    GROUP BY c.id, c.nombre, c.saldo_inicial, c.naturaleza
),

movimientos AS (
    SELECT
        c.id AS cuenta_id,
        c.nombre AS cuenta,
        c.naturaleza,
        mf.id AS id_movimiento,
        dm.id AS id_detalle,
        mf.fecha,
        u.nombre as usuario,
        dm.tipo,
        fp.nombre as forma_pago,
        dm.moneda as moneda,
        mf.descripcion,
        CASE WHEN dm.tipo = 'DÉBITO' THEN dm.monto_moneda_cuenta ELSE 0 END AS debito,
        CASE WHEN dm.tipo = 'CRÉDITO' THEN dm.monto_moneda_cuenta ELSE 0 END AS credito
    FROM cuentas c
    LEFT JOIN detalle_movimientos dm
        ON dm.cuenta_id = c.id
    LEFT JOIN movimientos_financieros mf
        ON mf.id = dm.movimiento_id
        AND mf.estado = 'ACTIVO'
    LEFT JOIN usuarios u ON u.id = mf.usuario_id
    LEFT JOIN forma_pago fp ON fp.id = dm.forma_pago
    WHERE c.id = $1
      AND mf.fecha >= $2::timestamp
      AND mf.fecha <= ($3::timestamp + interval '1 day' - interval '1 second')::timestamp
)

SELECT
    s.cuenta_id,
    s.cuenta,
    m.usuario,
    m.id_movimiento,
    m.id_detalle,
    m.fecha,
    m.tipo,
    m.forma_pago,
    m.moneda,
    m.descripcion,
    m.debito,
    m.credito,
    s.saldo_anterior,
    s.saldo_anterior +
    SUM(COALESCE(m.debito,0) - COALESCE(m.credito,0)) OVER (PARTITION BY s.cuenta_id ORDER BY m.fecha, m.id_detalle) AS saldo
FROM saldoAnterior s
LEFT JOIN movimientos m
    ON s.cuenta_id = m.cuenta_id
ORDER BY m.fecha, m.id_detalle;`,
      [cuentaId, fechaInicio, fechaFin]);

    return res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const obtenerSaldosCuentas = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH saldo_movimientos AS (
        SELECT
          c.id AS cuenta_id,
          c.nombre AS cuenta,
          c.naturaleza,
          c.tipo,
          c.sub_tipo,
          c.saldo_inicial,
          c.moneda,
          c.codigo,
          c.cuenta_raiz,
          c.tipo_contable,
          COALESCE(SUM(

                CASE 
                  WHEN dm.tipo = 'CRÉDITO' THEN -dm.monto_moneda_cuenta
                  WHEN dm.tipo = 'DÉBITO' THEN dm.monto_moneda_cuenta
                  ELSE 0
                END

          ),0) AS saldo_cuenta,
          COALESCE(SUM(

                CASE 
                  WHEN dm.tipo = 'CRÉDITO' THEN -dm.monto
                  WHEN dm.tipo = 'DÉBITO' THEN dm.monto
                  ELSE 0
                END

          ),0) AS saldo_base
        FROM cuentas c
        LEFT JOIN detalle_movimientos dm
          ON dm.cuenta_id = c.id
        LEFT JOIN movimientos_financieros mf
          ON mf.id = dm.movimiento_id
          WHERE
          c.estado = 'ACTIVA'
          AND mf.estado = 'ACTIVO'
        GROUP BY c.id, c.nombre, c.naturaleza, c.saldo_inicial
      )
      SELECT
        cuenta_id,
        cuenta,
        naturaleza,
        tipo,
        sub_tipo,
        saldo_inicial,
        moneda,
        codigo,
        cuenta_raiz,
        tipo_contable,
        saldo_cuenta,
        saldo_base
      FROM saldo_movimientos
      ORDER BY cuenta_id;
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener saldos de cuentas:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
/* Saldos Cobrar Pagar */
export const obtenerSaldosCuentasCobrarPagar = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH saldo_movimientos AS (
        SELECT
          c.id AS cuenta_id,
          c.nombre AS cuenta,
          c.naturaleza,
          c.saldo_inicial,
          c.moneda,
          COALESCE(SUM(

                CASE 
                  WHEN dm.tipo = 'DÉBITO' THEN dm.monto_moneda_cuenta
                  WHEN dm.tipo = 'CRÉDITO' THEN -dm.monto_moneda_cuenta
                  ELSE 0
                END

          ),0) AS saldo_cuenta,
          COALESCE(SUM(

                CASE 
                  WHEN dm.tipo = 'DÉBITO' THEN dm.monto
                  WHEN dm.tipo = 'CRÉDITO' THEN -dm.monto
                  ELSE 0
                END

          ),0) AS saldo_base
        FROM cuentas c
        LEFT JOIN detalle_movimientos dm
          ON dm.cuenta_id = c.id
        LEFT JOIN movimientos_financieros mf
          ON mf.id = dm.movimiento_id
          AND mf.estado = 'ACTIVO'
          WHERE
          c.estado = 'ACTIVA'
          AND c.sub_tipo IN ('TITULOC', 'TITULOP')
        GROUP BY c.id, c.nombre, c.naturaleza, c.saldo_inicial
      )
      SELECT
        cuenta_id,
        cuenta,
        naturaleza,
        saldo_inicial,
        moneda,
        saldo_cuenta,
        saldo_base
      FROM saldo_movimientos
      ORDER BY cuenta_id;
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener saldos de cuentas:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const balancePatrimonial = async (req, res) => {
  const {fecha_inicio, fecha_fin, moneda} = req.body;
  try {
    const result = await pool.query(`
 WITH RECURSIVE arbol AS (
    SELECT 
        c.id,
        c.cuenta_raiz,
        c.id AS root_id
    FROM cuentas c
    WHERE c.estado = 'ACTIVA'

    UNION ALL

    SELECT 
        c.id,
        c.cuenta_raiz,
        a.root_id
    FROM cuentas c
    INNER JOIN arbol a ON c.cuenta_raiz = a.id
),

movimientos_base AS (
    SELECT
        dm.cuenta_id,
        dm.tipo,
        dm.monto,
        dm.monto_moneda_cuenta,
        mf.fecha,
        c.moneda
    FROM detalle_movimientos dm
    INNER JOIN movimientos_financieros mf 
        ON mf.id = dm.movimiento_id
    INNER JOIN cuentas c
        ON c.id = dm.cuenta_id
    WHERE mf.estado = 'ACTIVO'
),

movimientos_filtrados AS (
    SELECT
        mb.*,

     
        CASE 
            WHEN mb.moneda = $3 THEN mb.monto_moneda_cuenta
            ELSE mb.monto_moneda_cuenta * COALESCE(tc.cambio, 1)
        END AS monto_convertido

    FROM movimientos_base mb

    LEFT JOIN LATERAL (
        SELECT tc.cambio
        FROM tipos_cambio tc
        WHERE tc.moneda_origen = mb.moneda
          AND tc.moneda_destino = $3
          AND mb.fecha >= tc.fecha_inicio
          AND (tc.fecha_fin IS NULL OR mb.fecha <= tc.fecha_fin)
        ORDER BY tc.fecha_inicio DESC
        LIMIT 1
    ) tc ON true
),

saldo_cuentas AS (
    SELECT
        c.id AS cuenta_id,
        c.nombre,
        c.naturaleza,
        c.tipo,
        c.sub_tipo,
        c.saldo_inicial,
        c.moneda,
        c.codigo,
        c.cuenta_raiz,
        c.tipo_contable,

        /* 🔹 SALDO ANTERIOR */
        COALESCE(SUM(
            CASE 
                WHEN mf.fecha < $1::timestamp THEN
                    CASE 
                        WHEN mf.tipo = 'CRÉDITO' THEN -mf.monto_convertido
                        WHEN mf.tipo = 'DÉBITO'  THEN  mf.monto_convertido
                        ELSE 0
                    END
                ELSE 0
            END
        ), 0) AS saldo_anterior,

        /* 🔹 DÉBITO RANGO */
        COALESCE(SUM(
            CASE 
                WHEN mf.fecha BETWEEN $1::timestamp AND $2::timestamp
                     AND mf.tipo = 'DÉBITO'
                THEN mf.monto_convertido
                ELSE 0
            END
        ), 0) AS debito_rango,

        /* 🔹 CRÉDITO RANGO */
        COALESCE(SUM(
            CASE 
                WHEN mf.fecha BETWEEN $1::timestamp AND $2::timestamp
                     AND mf.tipo = 'CRÉDITO'
                THEN mf.monto_convertido
                ELSE 0
            END
        ), 0) AS credito_rango,

        /* 🔹 SALDO RANGO */
        COALESCE(SUM(
            CASE 
                WHEN mf.fecha BETWEEN $1::timestamp AND $2::timestamp THEN
                    CASE 
                        WHEN mf.tipo = 'CRÉDITO' THEN -mf.monto_convertido
                        WHEN mf.tipo = 'DÉBITO'  THEN  mf.monto_convertido
                        ELSE 0
                    END
                ELSE 0
            END
        ), 0) AS saldo_rango

    FROM cuentas c
    LEFT JOIN movimientos_filtrados mf
        ON mf.cuenta_id = c.id

    WHERE c.estado = 'ACTIVA'

    GROUP BY 
        c.id, c.nombre, c.naturaleza, c.tipo, c.sub_tipo,
        c.saldo_inicial, c.moneda, c.codigo,
        c.cuenta_raiz, c.tipo_contable
)

SELECT
    c_root.id     AS cuenta_id,
    c_root.nombre AS cuenta,
    c_root.tipo,
    c_root.sub_tipo,
    c_root.moneda,
    c_root.codigo,
    c_root.tipo_contable,

    SUM(s.saldo_anterior) AS saldo_anterior,
    SUM(s.saldo_anterior) + SUM(s.saldo_rango) AS saldo_actual,
    SUM(s.debito_rango)  AS total_debito,
    SUM(s.credito_rango) AS total_credito

FROM arbol a
INNER JOIN saldo_cuentas s 
    ON s.cuenta_id = a.id
INNER JOIN cuentas c_root 
    ON c_root.id = a.root_id

GROUP BY 
    c_root.id,
    c_root.nombre,
    c_root.tipo,
    c_root.sub_tipo,
    c_root.moneda,
    c_root.codigo,
    c_root.tipo_contable

ORDER BY c_root.codigo;
  `,[fecha_inicio, fecha_fin, moneda]
    )

   return  res.status(200).json(result.rows);
    

  } catch (error) {
    console.error(error);
  }
}

export const obtenerAnaliticoCuentaEntidad = async (req, res) => {
  const { cuentaId, fechaInicio, fechaFin, entidadId } = req.body;

  try {
    const result = await pool.query(`
      WITH saldoAnterior AS (
        SELECT
          c.id AS cuenta_id,
          c.nombre AS cuenta,
          c.saldo_inicial +
          COALESCE(SUM(

                CASE 
                  WHEN dm.tipo = 'DÉBITO' AND dm.entidad = $4 AND mf.fecha < $2::timestamp THEN dm.monto
                  WHEN dm.tipo = 'CRÉDITO' AND dm.entidad = $4 AND mf.fecha < $2::timestamp THEN -dm.monto
                  ELSE 0
                END

          ), 0) AS saldo_anterior
        FROM cuentas c
        LEFT JOIN detalle_movimientos dm
          ON dm.cuenta_id = c.id
        LEFT JOIN movimientos_financieros mf
          ON mf.id = dm.movimiento_id
          AND mf.estado = 'ACTIVO'
        WHERE c.id = $1 AND c.sub_tipo IN ('TITULOC', 'TITULOP')
        GROUP BY c.id, c.nombre, c.saldo_inicial, c.naturaleza
      ),
      movimientos AS (
        SELECT
          c.id AS cuenta_id,
          c.nombre AS cuenta,
          c.naturaleza,
          mf.id AS id_movimiento,
          dm.id AS id_detalle,
          mf.fecha,
          u.nombre AS usuario,
          dm.tipo,
          e.nombre AS entidad,
          fp.nombre AS forma_pago,
          dm.moneda AS moneda,
          mf.descripcion,
          CASE WHEN dm.tipo = 'DÉBITO' THEN dm.monto_moneda_cuenta ELSE 0 END AS debito,
          CASE WHEN dm.tipo = 'CRÉDITO' THEN dm.monto_moneda_cuenta ELSE 0 END AS credito
        FROM cuentas c
        LEFT JOIN detalle_movimientos dm
          ON dm.cuenta_id = c.id
        LEFT JOIN movimientos_financieros mf
          ON mf.id = dm.movimiento_id
          AND mf.estado = 'ACTIVO'
        LEFT JOIN entidades e ON e.id = dm.entidad
        LEFT JOIN usuarios u ON u.id = mf.usuario_id
        LEFT JOIN forma_pago fp ON fp.id = dm.forma_pago
        WHERE c.id = $1
          AND c.sub_tipo IN ('TITULOC', 'TITULOP')
          AND mf.fecha >= $2::timestamp
          AND mf.fecha <= ($3::timestamp + interval '1 day' - interval '1 second')::timestamp
          AND dm.entidad = $4
      )
      SELECT
        s.cuenta_id,
        s.cuenta,
        m.usuario,
        m.id_movimiento,
        m.id_detalle,
        m.fecha,
        m.tipo,
        m.entidad,
        m.forma_pago,
        m.moneda,
        m.descripcion,
        m.debito,
        m.credito,
        s.saldo_anterior,
        s.saldo_anterior + SUM(COALESCE(m.debito,0) - COALESCE(m.credito,0))
          OVER (PARTITION BY s.cuenta_id ORDER BY m.fecha, m.id_detalle) AS saldo
      FROM saldoAnterior s
      LEFT JOIN movimientos m
        ON s.cuenta_id = m.cuenta_id
      ORDER BY m.fecha, m.id_detalle;
    `, [cuentaId, fechaInicio, fechaFin, entidadId]);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error en obtenerAnaliticoCuentaEntidad:", error.message);
    return res.status(500).json({ error: error.message });
  }
};


export const obtenerSaldoCuentaEntidad = async (req, res) => {
  const { cuentaId, fechaInicio, fechaFin, entidadId } = req.body;

  try {
    const result = await pool.query(`
      WITH saldoAnterior AS (
    SELECT
      c.id AS cuenta_id,
      c.nombre AS cuenta,
      c.naturaleza,
      dm.entidad,
      c.moneda,
      c.saldo_inicial +
      COALESCE(SUM(

            CASE 
              WHEN dm.tipo = 'DÉBITO' AND mf.fecha < $2 THEN dm.monto_moneda_cuenta
              WHEN dm.tipo = 'CRÉDITO' AND mf.fecha < $2 THEN -dm.monto_moneda_cuenta
              ELSE 0
            END

      ), 0) AS saldo_anterior
    FROM cuentas c
    LEFT JOIN detalle_movimientos dm ON dm.cuenta_id = c.id
    LEFT JOIN movimientos_financieros mf 
      ON mf.id = dm.movimiento_id
      AND mf.estado = 'ACTIVO'
    WHERE (c.id = $1 OR $1::numeric IS NULL)
      AND c.sub_tipo IN ('TITULOC', 'TITULOP')
      AND ($4::numeric IS NULL OR dm.entidad = $4)
    GROUP BY c.id, c.nombre, c.saldo_inicial, c.naturaleza, dm.entidad
),

movimientosPeriodo AS (
    SELECT
      c.id AS cuenta_id,
      c.nombre AS cuenta,
      dm.entidad,
      c.moneda,
      SUM(CASE WHEN dm.tipo = 'DÉBITO' THEN dm.monto_moneda_cuenta ELSE 0 END) AS total_debito,
      SUM(CASE WHEN dm.tipo = 'CRÉDITO' THEN dm.monto_moneda_cuenta ELSE 0 END) AS total_credito
    FROM cuentas c
    LEFT JOIN detalle_movimientos dm ON dm.cuenta_id = c.id
    LEFT JOIN movimientos_financieros mf 
      ON mf.id = dm.movimiento_id
      AND mf.estado = 'ACTIVO'
    WHERE (c.id = $1 OR $1::numeric IS NULL)
      AND c.sub_tipo IN ('TITULOC', 'TITULOP')
      AND mf.fecha >= $2
      AND mf.fecha <= ($3::timestamp + interval '1 day' - interval '1 second')
      AND ($4::numeric IS NULL OR dm.entidad = $4)
    GROUP BY c.id, c.nombre, dm.entidad
)

SELECT
    sa.cuenta_id,
    sa.cuenta,
    e.nombre AS entidad,
    sa.moneda,
    COALESCE(sa.saldo_anterior, 0) AS saldo_anterior,
    COALESCE(mp.total_debito, 0) AS total_debito,
    COALESCE(mp.total_credito, 0) AS total_credito,
 
        COALESCE(sa.saldo_anterior, 0) + COALESCE(mp.total_debito, 0) - COALESCE(mp.total_credito, 0)

     AS saldo_final
FROM saldoAnterior sa
LEFT JOIN movimientosPeriodo mp
  ON sa.cuenta_id = mp.cuenta_id
  AND sa.entidad = mp.entidad
LEFT JOIN entidades e ON e.id = sa.entidad
WHERE 
    CASE 
      WHEN sa.naturaleza = 'DEUDORA' THEN
        COALESCE(sa.saldo_anterior, 0) + COALESCE(mp.total_debito, 0) - COALESCE(mp.total_credito, 0)
      ELSE
        COALESCE(sa.saldo_anterior, 0) + COALESCE(mp.total_credito, 0) - COALESCE(mp.total_debito, 0)
    END <> 0
ORDER BY sa.entidad;
    `, [cuentaId, fechaInicio, fechaFin, entidadId]);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error en obtenerSaldoCuentaEntidad:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

// Crear nueva cuenta
export const crearCuenta = async (req, res) => {
  try {
    const { nombre, tipo, sub_tipo, naturaleza, banco, numero_cuenta, moneda, grupo, codigo, cuenta_raiz, tipo_contable } = req.body;

    const result = await pool.query(
      `INSERT INTO cuentas 
          (nombre, tipo, sub_tipo, naturaleza, banco, numero_cuenta, moneda, saldo_inicial, estado, grupo, codigo, tipo_contable, cuenta_raiz)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          RETURNING *`,
      [nombre, tipo, sub_tipo, naturaleza, banco || null, numero_cuenta || null, moneda, 0, 'ACTIVA', grupo || null, codigo || null, tipo_contable || null, cuenta_raiz || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error('Error crearCuenta:', error.message);
  }
};

// Actualizar cuenta
export const actualizarCuenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar si es cuenta de sistema
    const cuenta = await pool.query(
      'SELECT sistema FROM cuentas WHERE id = $1',
      [id]
    );
    if (cuenta.rows.length === 0)
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (cuenta.rows[0].sistema)
      return res.status(403).json({ error: 'Cuenta de sistema no puede ser editada' });

    // Tomar solo los campos editables desde el body
    const {
      nombre,
      tipo,
      sub_tipo,
      grupo,
      naturaleza,
      banco,
      numero_cuenta,
      moneda,
      estado,
      codigo,
      tipo_contable,
      cuenta_raiz,
    } = req.body;

    // Actualizar cuenta sin tocar saldo_inicial
    const result = await pool.query(
      `UPDATE cuentas SET
         nombre = $1,
         tipo = $2,
         sub_tipo = $3,
         naturaleza = $4,
         banco = $5,
         numero_cuenta = $6,
         moneda = $7,
         estado = $8,
         codigo = $9,
         grupo = $10,
         tipo_contable = $11,
         cuenta_raiz = $12
       WHERE id = $13
       RETURNING *`,
      [
        nombre,
        tipo,
        sub_tipo || null,
        naturaleza || null,
        banco || null,
        numero_cuenta || null,
        moneda || 'PYG',
        estado || 'ACTIVA',
        codigo || null,
        grupo || null,
        tipo_contable,
        cuenta_raiz || null,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizarCuenta:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar cuenta
export const eliminarCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, banco, numero_cuenta, moneda, saldo_inicial, estado, naturaleza, sub_tipo, codigo } = req.body;

    const cuenta = await pool.query('SELECT sistema FROM cuentas WHERE id = $1', [id]);
    if (cuenta.rows.length === 0)
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (cuenta.rows[0].sistema)
      return res.status(403).json({ error: 'Cuenta de sistema no puede ser eliminada' });


    const result = await pool.query(
      `UPDATE cuentas SET
     nombre=$1, tipo=$2, banco=$3, numero_cuenta=$4,
     moneda=$5, saldo_inicial=$6, estado=$7,
     naturaleza=$8, sub_tipo=$9, codigo=$10
     WHERE id=$11
     RETURNING *`,
      [nombre, tipo, banco, numero_cuenta, moneda, saldo_inicial, estado, naturaleza, sub_tipo, codigo, id]
    );
    res.json({ msg: 'Cuenta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};