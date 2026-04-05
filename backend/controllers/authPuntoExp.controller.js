import { pool } from '../config/db.js'

export const obtenerAutorizacionesPuntos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
            up.id,
            up.usuario_id,
            up.punto_id,
            up.activo,
            u.nombre as usuario_nombre,
            pe.nombre as punto_nombre
            FROM usuario_punto up
            LEFT JOIN usuarios u ON u.id = up.usuario_id
            LEFT JOIN punto_expedicion pe ON pe.id = up.punto_id
            `)
        res.status(200).json(result.rows)
    } catch (error) {
        console.error(error);
    }
}
export const actualizarAutorizacionesPuntos = async (req, res) => {
    const { id } = req.params;
    const { usuario_id, punto_id, activo } = req.body;
    try {
        const result = await pool.query(`UPDATE usuario_punto SET usuario_id = $1, punto_id = $2, activo = $3 WHERE id = $4`,
            [usuario_id, punto_id, activo, id]
        )
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error(error);
    }
}

export const crearAutorizacionesPuntos = async (req, res) => {
    const { usuario_id, punto_id, activo } = req.body;
    try {
        const nuevoId = await pool.query(`SELECT COALESCE(MAX(id),0) +1 as NEWID FROM usuario_punto`)
        const idd = nuevoId.rows[0].newid;
        const result = await pool.query(`INSERT INTO usuario_punto (id, usuario_id, punto_id, activo)
            VALUES ($1, $2, $3, $4)`,
            [idd, usuario_id, punto_id, activo]
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error);
    }
}

