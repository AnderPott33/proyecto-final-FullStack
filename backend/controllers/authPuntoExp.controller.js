import { pool } from '../config/db.js'

export const obtenerAutorizacionesPuntos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
            up.id,
            up.usuario_id,
            up.punto_id,
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
    const { usuario_id, punto_id } = req.body;
    try {
        const result = await pool.query(`UPDATE usuario_punto SET usuario_id = $1, punto_id = $2 WHERE id = $3`,
            [usuario_id, punto_id, id]
        )
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error(error);
    }
}

export const crearAutorizacionesPuntos = async (req, res) => {
    const { usuario_id, punto_id } = req.body;
    try {
        const nuevoId = await pool.query(`SELECT COALESCE(MAX(id),0) +1 as NEWID FROM usuario_punto`)
        const idd = nuevoId.rows[0].newid;
        const result = await pool.query(`INSERT INTO usuario_punto (id, usuario_id, punto_id)
            VALUES ($1, $2, $3)`,
            [idd, usuario_id, punto_id]
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error);
    }
}


export const eliminarAutorizacionesPuntos = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`DELETE FROM usuario_punto WHERE id = $1`,
            [id]
        )
        res.status(204).json(result.rows[0])
    } catch (error) {
        console.error(error);
    }
}