import { pool } from "../config/db.js";

// Obtener todas las cuentas
export const obtenerCuentasCobrarPagar = async (req, res) => {
  try {
    const { tipo, estado, entidad, fechaDesde, fechaHasta } = req.body;

    let query = 'SELECT * FROM CUENTAS_POR_MOVIMIENTO WHERE 1=1';
    const params = [];

    if (tipo && tipo.trim() !== '') {
      params.push(tipo);
      query += ` AND tipo_movimiento = $${params.length}`;
    }

    if (estado && estado.trim() !== '') {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }

    if (entidad && entidad.trim() !== '') {
      params.push(`%${entidad}%`);
      query += ` AND entidad ILIKE $${params.length}`;
    }

    if (fechaDesde && fechaDesde.trim() !== '') {
      params.push(fechaDesde + ' 00:00:00');
      query += ` AND fecha >= $${params.length}`;
    }

    if (fechaHasta && fechaHasta.trim() !== '') {
      params.push(fechaHasta + ' 23:59:59');
      query += ` AND fecha <= $${params.length}`;
    }

    query += ' ORDER BY id';

    console.log("QUERY:", query);
    console.log("PARAMS:", params);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("ERROR BACKEND:", error);
    res.status(500).json({ mensaje: "Error al obtener el movimiento completo", error: error.message });
  }
};
