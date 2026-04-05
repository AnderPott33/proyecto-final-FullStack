import { pool } from "../config/db.js";

// --- OBTENER tipo de cambio específico ---
export const obtenerCambio = async (req, res) => {
  try {
    const { monedaOrigen, monedaDestino, fecha } = req.body;

    const result = await pool.query(
      `SELECT cambio, fecha_inicio
       FROM tipos_cambio
       WHERE moneda_origen = $1
         AND moneda_destino = $2
       ORDER BY ABS(EXTRACT(EPOCH FROM (fecha_inicio - $3::timestamp)))
       LIMIT 1`,
      [monedaOrigen, monedaDestino, fecha]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró tipo de cambio" });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error obteniendo tipo de cambio:", error);
    res.status(500).json({ mensaje: "Error obteniendo tipo de cambio" });
  }
};

// --- OBTENER todas las cotizaciones activas ---
export const obtenerCambios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tipos_cambio
       ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener cotizaciones:", err);
    res.status(500).json({ error: "Error al obtener cotizaciones" });
  }
};

// --- CREAR o ACTUALIZAR cotizaciones ---
/* export const actualizarCotizaciones = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { cotizaciones } = req.body;

    if (!Array.isArray(cotizaciones)) 
      return res.status(400).json({ error: "Formato inválido" });

    for (const c of cotizaciones) {
      const { moneda_origen, moneda_destino, cambio } = c;

      // 1) Cerrar registro anterior
      await pool.query(
        `UPDATE tipos_cambio
         SET fecha_fin = now()
         WHERE moneda_origen = $1 AND moneda_destino = $2 AND fecha_fin IS NULL`,
        [moneda_origen, moneda_destino]
      );

      // 2) Insertar nuevo registro
      await pool.query(
        `INSERT INTO tipos_cambio (moneda_origen, moneda_destino, cambio, usuario_id)
         VALUES ($1, $2, $3, $4)`,
        [moneda_origen, moneda_destino, cambio, usuario_id]
      );
    }

    res.json({ message: "Cotizaciones actualizadas correctamente" });
  } catch (err) {
    console.error("Error al guardar cotizaciones:", err);
    res.status(500).json({ error: "Error al guardar cotizaciones" });
  }
}; */

export const actualizarCotizaciones = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { cotizaciones } = req.body;

    if (!Array.isArray(cotizaciones)) 
      return res.status(400).json({ error: "Formato inválido" });

    for (const c of cotizaciones) {
      const { moneda_origen, moneda_destino, cambio, fecha_inicio } = c;

      // 🔥 usar fecha del frontend
      const fecha = fecha_inicio || new Date();

      // 1) Cerrar registro anterior
      await pool.query(
        `UPDATE tipos_cambio
         SET fecha_fin = $3
         WHERE moneda_origen = $1 
           AND moneda_destino = $2 
           AND fecha_fin IS NULL`,
        [moneda_origen, moneda_destino, fecha]
      );

      // 2) Insertar nuevo registro
      await pool.query(
        `INSERT INTO tipos_cambio 
         (moneda_origen, moneda_destino, cambio, usuario_id, fecha_inicio)
         VALUES ($1, $2, $3, $4, $5)`,
        [moneda_origen, moneda_destino, cambio, usuario_id, fecha]
      );
    }

    res.json({ message: "Cotizaciones actualizadas correctamente" });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Error al guardar cotizaciones" });
  }
};

// --- ELIMINAR cotización ---
export const eliminarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM tipos_cambio WHERE id = $1`, [id]);
    res.json({ message: "Cotización eliminada" });
  } catch (err) {
    console.error("Error al eliminar cotización:", err);
    res.status(500).json({ error: "Error al eliminar cotización" });
  }
};

export const existeCotizacionHoy = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 1
       FROM tipos_cambio
       WHERE fecha_inicio::date = (NOW() AT TIME ZONE 'America/Asuncion')::date
       LIMIT 1`
    );

    res.json({ existe: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error verificando cotización" });
  }
};