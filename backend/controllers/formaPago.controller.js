import { pool } from './config/db.js';

export const obtenerFormaPago = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM forma_pago`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener formas de pago" });
  }
};