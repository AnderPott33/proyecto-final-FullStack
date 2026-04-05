import { pool } from '../config/db.js';

export const obtenerCategorias = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM categorias
            ORDER BY id
            `)

        res.status(200).json(result.rows)

    } catch (error) {
        res.status(500).json(error);
    }
}

export const obtenerCategoriasId = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT * FROM categorias
            WHERE id = $1
            `, [id])

        res.status(200).json(result.rows)

    } catch (error) {
        res.status(500).json(error);
    }
}

export const crearCategoria = async (req, res) => {
    const { nombre_categoria } = req.body;

    try {

        const result = await pool.query(`
    INSERT INTO categorias (nombre_categoria)
    VALUES ($1)
    RETURNING *
    `,
            [nombre_categoria])

        res.status(201).json(result.rows[0])

    } catch (error) {
        res.status(500).json(error);
    }
}

export const editarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre_categoria } = req.body;

    try {
        const result = await pool.query(`
            UPDATE categorias SET 
            nombre_categoria = $1
            WHERE id = $2
            RETURNING *
            `,
            [nombre_categoria, id])

        res.status(200).json(result.rows[0])

    } catch (error) {
        res.status(500).json(error);
    }
}

export const deletarCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM categorias 
            WHERE id = $1
            `,
            [id])

        res.status(200).json(result.rows[0])

    } catch (error) {
        res.status(500).json(error);
        console.error(error);
        
    }
}