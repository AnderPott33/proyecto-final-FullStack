import { pool } from "../config/db.js";



export const consultarStock = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
    a.id AS producto_id,
    a.nombre_articulo,
    SUM(m.cantidad * m.signo) AS stock_final,
    SUM(COALESCE(m.cantidad * m.costo_unitario, 0)) AS valor_final
FROM movimientos_stock m
LEFT JOIN articulo a ON a.id = m.producto_id
WHERE m.signo IN (1, -1)
GROUP BY a.id, a.nombre_articulo
ORDER BY a.id;`
        )
        res.status(200).json(result.rows)
    } catch (error) {
        console.error(error);
    }
}

export const consultarMovimientosStock = async (req, res) => {

    try {
        const result = await pool.query(
            `
            SELECT 
                m.fecha,
                m.id AS id_movimiento,
                a.id AS producto_id,
                a.nombre_articulo,
                u.nombre AS usuario_nombre,
                m.tipo,
                m.observacion,
                m.cantidad,
                m.referencia_id,
                m.documento_ref,
                m.signo,
                m.costo_unitario,
                (m.cantidad * m.signo) AS movimiento,
                SUM(m.cantidad * m.signo) OVER (
                    ORDER BY m.fecha, m.id
                ) AS stock_acumulado,
                COALESCE(m.cantidad * m.costo_unitario, 0) AS valor_movimiento,
                SUM(COALESCE(m.cantidad * m.costo_unitario, 0)) OVER (
                    ORDER BY m.fecha, m.id
                ) AS valor_acumulado
            FROM movimientos_stock m
            LEFT JOIN articulo a ON a.id = m.producto_id
            JOIN usuarios u ON u.id = m.usuario_id
            where m.signo = 1 or m.signo = -1
            ORDER BY m.fecha ASC;
            `
        );
        /*   WHERE a.id = $1
              AND m.fecha >= $2::date
              AND m.fecha < ($3::date + INTERVAL '1 day') */

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error consultarStockId:", error);
        res.status(500).json({ msg: "Error al consultar stock", error });
    }
};

export const consultarStockId = async (req, res) => {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    // Validación básica
    if (!id || !fechaInicio || !fechaFin) {
        return res.status(400).json({ msg: "Faltan parámetros requeridos" });
    }

    try {
        const result = await pool.query(
            `
            SELECT 
                m.fecha,
                m.id AS id_movimiento,
                a.id AS producto_id,
                a.nombre_articulo,
                u.nombre AS usuario_nombre,
                m.tipo,
                m.observacion,
                m.cantidad,
                m.referencia_id,
                m.documento_ref,
                m.signo,
                m.costo_unitario,
                (m.cantidad * m.signo) AS movimiento,
                SUM(m.cantidad * m.signo) OVER (
                    ORDER BY m.fecha, m.id
                ) AS stock_acumulado,
                COALESCE(m.cantidad * m.costo_unitario, 0) AS valor_movimiento,
                SUM(COALESCE(m.cantidad * m.costo_unitario, 0)) OVER (
                    ORDER BY m.fecha, m.id
                ) AS valor_acumulado
            FROM movimientos_stock m
            LEFT JOIN articulo a ON a.id = m.producto_id
            JOIN usuarios u ON u.id = m.usuario_id
            WHERE a.id = $1
              AND m.fecha >= $2::date
              AND m.fecha < ($3::date + INTERVAL '1 day')
            ORDER BY m.fecha, m.id;
            `,
            [id, fechaInicio, fechaFin]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error consultarStockId:", error);
        res.status(500).json({ msg: "Error al consultar stock", error });
    }
};

export const consultarStockCategoriaId = async (req, res) => {
    const { categoria_id } = req.params;

    // Validación básica
    if (!categoria_id) {
        return res.status(400).json({ msg: "Faltan parámetros requeridos" });
    }

    try {
        const result = await pool.query(
            `SELECT 
    a.id AS producto_id,
    a.nombre_articulo,
    a.estado,
    a.tipo_articulo,
    a.precio_compra,
    a.precio_venta,
    SUM(m.cantidad * m.signo) AS stock_total
FROM articulo a
LEFT JOIN movimientos_stock m ON a.id = m.producto_id
LEFT JOIN categorias ca ON ca.id = a.categoria_id
WHERE ca.id = $1
GROUP BY 
    a.id,
    a.nombre_articulo,
    a.estado,
    a.tipo_articulo,
    a.precio_compra,
    a.precio_venta
ORDER BY a.id;`,
            [categoria_id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error consultarStockId:", error);
        res.status(500).json({ msg: "Error al consultar stock", error });
    }
};

export const consultarStockMarcaId = async (req, res) => {
    const { marca_id } = req.params;

    // Validación básica
    if (!marca_id) {
        return res.status(400).json({ msg: "Faltan parámetros requeridos" });
    }

    try {
        const result = await pool.query(
            `SELECT 
    a.id AS producto_id,
    a.nombre_articulo,
    a.estado,
    a.tipo_articulo,
    a.precio_compra,
    a.precio_venta,
    SUM(m.cantidad * m.signo) AS stock_total
FROM articulo a
LEFT JOIN movimientos_stock m ON a.id = m.producto_id
LEFT JOIN marcas ca ON ca.id = a.marca_id
WHERE ca.id = $1
GROUP BY 
    a.id,
    a.nombre_articulo,
    a.estado,
    a.tipo_articulo,
    a.precio_compra,
    a.precio_venta
ORDER BY a.id;`,
            [marca_id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error consultarStockId:", error);
        res.status(500).json({ msg: "Error al consultar stock", error });
    }
};

export const ajustarStock = async (req, res) => {
    let { producto_id, fecha, tipo, cantidad, observacion, signo, costo_unitario, usuario_id } = req.body;

    try {
        // Asegurarse que sean números válidos o NULL
        producto_id = producto_id ? parseInt(producto_id) : null;
        cantidad = cantidad ? parseFloat(cantidad) : 0;
        costo_unitario = costo_unitario ? parseFloat(costo_unitario) : 0;
        signo = signo ? parseInt(signo) : 1;

        const result = await pool.query(`
            INSERT INTO movimientos_stock 
            (producto_id,
            fecha,
            tipo,
            cantidad,
            signo,
            costo_unitario,
            referencia_tipo,
            observacion,
            usuario_id)
            VALUES( $1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        `, [producto_id, fecha, tipo, cantidad, signo, costo_unitario, "AJUSTE DE STOCK", observacion, usuario_id]);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error al ajustar stock" });
    }
}