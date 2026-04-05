import { pool } from "../config/db.js";

export const buscarTimbrado = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM timbrado`);
        res.status(200).json(result.rows)
    } catch (error) {
        console.log(error);
    }
}

export const agregarTimbrado = async (req, res) => {
    const { numero_timbrado, fecha_inicio, fecha_fin, tipo_documento, punto_expedicion_id, empresa_id, codigo_emp, codigo_suc, numero_inicio, numero_fin, numero_actual, estado } = req.body;
    try {
        const result = await pool.query(`
            INSERT INTO timbrado (numero_timbrado, fecha_inicio, fecha_fin, tipo_documento, punto_expedicion_id, empresa_id, codigo_emp, codigo_suc, numero_inicio, numero_fin, numero_actual, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 )
            `, [numero_timbrado, fecha_inicio, fecha_fin, tipo_documento, punto_expedicion_id, empresa_id, codigo_emp, codigo_suc, numero_inicio, numero_fin, numero_actual, estado]
        );
        res.status(201).json(result.rows)
    } catch (error) {
        console.error(error);
    }
}

export const actualizarTimbrado = async (req, res) => {
    const { id } = req.params;
    const { numero_timbrado, fecha_inicio, fecha_fin, tipo_documento, punto_expedicion_id, empresa_id, codigo_emp, codigo_suc, numero_inicio, numero_fin, numero_actual, estado } = req.body;
    try {
        const result = await pool.query(`
            UPDATE timbrado SET 
            numero_timbrado = $1,
            fecha_inicio = $2, 
            fecha_fin = $3,
            tipo_documento = $4, 
            punto_expedicion_id = $5, 
            empresa_id = $6, 
            codigo_emp = $7,
            codigo_suc = $8,
            numero_inicio = $9,
            numero_fin = $10,
            numero_actual = $11,
            estado = $12
            WHERE id = $13
            `, [numero_timbrado, fecha_inicio, fecha_fin, tipo_documento, punto_expedicion_id, empresa_id, codigo_emp, codigo_suc, numero_inicio, numero_fin, numero_actual, estado, id]
        );
        res.status(201).json(result.rows)
    } catch (error) {
        console.error(error);
    }
}