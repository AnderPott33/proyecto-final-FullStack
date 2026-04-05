import { pool } from './config/db.js';

export const obtenerEntidad = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM entidades`);

    // Devuelve siempre un array, aunque esté vacío
    res.status(200).json(result.rows);
    
  } catch (error) {
    console.error("Error obteniendo entidades:", error);
    res.status(500).json({ mensaje: "Error obteniendo entidades" });
  }
};

export const crearEntidad = async (req, res) => {
  const {
    tipo,
    nombre,
    es_generico,
    tipo_documento,
    ruc,
    documento_identidad,
    telefono,
    email,
    direccion,
    ciudad,
    departamento,
    pais,
    estado,
    observaciones,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO entidades
      (tipo, nombre, es_generico, tipo_documento, ruc, documento_identidad, telefono, email, direccion, ciudad, departamento, pais, estado, observaciones)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        tipo,
        nombre,
        es_generico || false,
        tipo_documento || null,
        ruc || null,
        documento_identidad || null,
        telefono || null,
        email || null,
        direccion || null,
        ciudad || null,
        departamento || null,
        pais || "Paraguay",
        estado || "ACTIVO",
        observaciones || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear entidad:", error);
    res.status(500).json({ message: "Error al crear entidad" });
  }
};

// Actualizar entidad
export const actualizarEntidad = async (req, res) => {
  const { id } = req.params;
  const {
    tipo,
    nombre,
    es_generico,
    tipo_documento,
    ruc,
    documento_identidad,
    telefono,
    email,
    direccion,
    ciudad,
    departamento,
    pais,
    estado,
    observaciones,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE entidades SET
        tipo=$1,
        nombre=$2,
        es_generico=$3,
        tipo_documento=$4,
        ruc=$5,
        documento_identidad=$6,
        telefono=$7,
        email=$8,
        direccion=$9,
        ciudad=$10,
        departamento=$11,
        pais=$12,
        estado=$13,
        observaciones=$14
      WHERE id=$15
      RETURNING *`,
      [
        tipo,
        nombre,
        es_generico || false,
        tipo_documento || null,
        ruc || null,
        documento_identidad || null,
        telefono || null,
        email || null,
        direccion || null,
        ciudad || null,
        departamento || null,
        pais || "Paraguay",
        estado || "ACTIVO",
        observaciones || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Entidad no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar entidad:", error);
    res.status(500).json({ message: "Error al actualizar entidad" });
  }
};
