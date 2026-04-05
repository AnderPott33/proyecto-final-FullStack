import { pool } from '../config/db.js';

export const obtenerMarcas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM Marcas
            ORDER BY id
            `)

        res.status(200).json(result.rows)

    } catch (error) {
        res.status(500).json(error);
    }
}

export const obtenerMarcasId = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT * FROM Marcas
            WHERE id = $1
            `, [id])

        res.status(200).json(result.rows)

    } catch (error) {
        res.status(500).json(error);
    }
}

export const crearMarca = async (req, res) => {
    const { nombre_marca } = req.body;

    try {

        const result = await pool.query(`
    INSERT INTO Marcas (nombre_marca)
    VALUES ($1)
    RETURNING *
    `,
            [nombre_marca])

        res.status(201).json(result.rows[0])

    } catch (error) {
        res.status(500).json(error);
    }
}

export const editarMarca = async (req, res) => {
    const { id } = req.params;
    const { nombre_marca } = req.body;

    try {
        const result = await pool.query(`
            UPDATE Marcas SET 
            nombre_marca = $1
            WHERE id = $2
            RETURNING *
            `,
            [nombre_marca, id])

        res.status(200).json(result.rows[0])

    } catch (error) {
        res.status(500).json(error);
    }
}

export const deletarMarca = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM Marcas 
            WHERE id = $1
            `,
            [id])

        res.status(200).json(result.rows[0])

    } catch (error) {
        res.status(500).json(error);
        console.error(error);
        
    }
}