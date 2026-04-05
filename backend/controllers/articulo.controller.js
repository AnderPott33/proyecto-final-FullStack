import { pool } from "../config/db.js";

export const obtenerArticulos = async (req, res) => {
    try {
        const result = await pool.query(`SELECT
            a.id,
            a.nombre_articulo,
            a.codigo_barra,
            a.precio_venta,
            a.tipo_articulo,
            a.marca_id,
            a.estado,
            a.stock_minimo,
            a.unidad_medida,
            a.proveedor_id,
            a.precio_compra,
            a.tipo_impuesto ,
            a.categoria_id
            FROM articulo a
                        ORDER BY id
            `)

        res.status(200).json(result.rows);

    } catch (error) {
        res.status(500).json(error);
    }
}

export const obtenerArticulosId = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`SELECT
            a.id,
            a.nombre_articulo,
            a.estado,
            a.codigo_barra,
            a.precio_venta,
            a.tipo_articulo,
            a.marca_id,
            a.stock_minimo,
            a.unidad_medida,
            a.proveedor_id,
            a.precio_compra,
            a.tipo_impuesto,
            a.categoria_id
            FROM articulo a
            WHERE id = $1
             `, [id])

        res.status(200).json(result.rows);

    } catch (error) {
        res.status(500).json(error);
    }
}

export const obtenerArticulosIdCodBarra = async (req, res) => {
    let { id } = req.params; // id puede venir como "2*13" o "13"
    
    try {
        let cantidad = 1; // valor por defecto

        // Verificar si viene con formato cantidad*codigo
        if (id.includes('*')) {
            const partes = id.split('*');
            if (partes.length === 2) {
                cantidad = parseFloat(partes[0]);
                id = partes[1]; // el código real
            }
        }

        // Limpiar id para que solo sea números o letras
        id = id.replace(/[^0-9a-zA-Z]/g, "");

        // Consulta por id o codigo_barra
        const result = await pool.query(`
            SELECT
                a.id,
                a.nombre_articulo,
                a.estado,
                a.codigo_barra,
                a.precio_venta,
                a.tipo_articulo,
                a.marca_id,
                a.stock_minimo,
                a.unidad_medida,
                a.proveedor_id,
                a.precio_compra,
                a.tipo_impuesto,
                a.categoria_id
            FROM articulo a
            WHERE a.id = $1 OR a.codigo_barra = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Artículo no encontrado' });
        }

        // Devolver también la cantidad detectada
        const articulo = result.rows[0];
        articulo.cantidad = cantidad;

        res.status(200).json(articulo);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al buscar artículo', error });
    }
}

export const obtenerArticulosCategoriaId = async (req, res) => {
    const { categoria_id } = req.params;
    try {
        const result = await pool.query(`
            SELECT
            a.id,
            a.nombre_articulo,
            a.estado,
            a.codigo_barra,
            a.precio_venta,
            a.tipo_articulo,
            a.marca_id,
            a.stock_minimo,
            a.unidad_medida,
            a.proveedor_id,
            a.precio_compra,
            a.tipo_impuesto,
            a.categoria_id
            FROM articulo a
            WHERE categoria_id = $1
             `, [categoria_id])

        res.status(200).json(result.rows);

    } catch (error) {
        res.status(500).json(error);
    }
}

export const crearArticulo = async (req, res) => {
    let { nombre_articulo, codigo_barra, precio_venta,
        tipo_articulo, marca_id, stock_minimo, unidad_medida,
        proveedor_id, precio_compra, tipo_impuesto, estado, categoria_id } = req.body;

    try {
        proveedor_id = proveedor_id ? parseInt(proveedor_id) : null;
        stock_minimo = stock_minimo ? parseInt(stock_minimo) : null;
        marca_id = marca_id ? parseInt(marca_id) : null;
        categoria_id = categoria_id ? parseInt(categoria_id) : null;
        precio_compra = precio_compra ? parseInt(precio_compra) : null;
        precio_venta = precio_venta ? parseInt(precio_venta) : null;

        const result = await pool.query(
            `INSERT INTO articulo (
                nombre_articulo,
                codigo_barra,
                precio_venta,
                tipo_articulo,
                marca_id,
                stock_minimo,
                unidad_medida,
                proveedor_id,
                precio_compra,
                tipo_impuesto,
                estado,
                categoria_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *`,
            [
                nombre_articulo,
                codigo_barra,
                precio_venta || null,
                tipo_articulo,
                marca_id,
                stock_minimo || null,
                unidad_medida,
                proveedor_id || null,
                precio_compra || null,
                tipo_impuesto,
                estado || "ACTIVO",
                categoria_id || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.log("Error en crearArticulo:", error); // 👈 Para ver el error real en Node
        res.status(500).json({ error: "Error al crear el artículo" });
    }
}


export const actualizarArticulo = async (req, res) => {
    const { id } = req.params;
    let { nombre_articulo, codigo_barra, precio_venta,
        tipo_articulo, estado, marca_id, stock_minimo, unidad_medida,
        proveedor_id, precio_compra, tipo_impuesto, categoria_id } = req.body;

    try {
        proveedor_id = proveedor_id ? parseInt(proveedor_id) : null;
        stock_minimo = stock_minimo ? parseInt(stock_minimo) : null;
        marca_id = marca_id ? parseInt(marca_id) : null;
        categoria_id = categoria_id ? parseInt(categoria_id) : null;
        precio_compra = precio_compra ? parseInt(precio_compra) : null;
        precio_venta = precio_venta ? parseInt(precio_venta) : null;
        const result = await pool.query(
            `UPDATE articulo SET
            nombre_articulo = $1,
            codigo_barra = $2,
            precio_venta = $3,
            tipo_articulo = $4,
            marca_id = $5,
            stock_minimo = $6,
            unidad_medida = $7,
            proveedor_id = $8,
            precio_compra = $9,
            estado = $10,
            tipo_impuesto = $11,
            categoria_id = $12
            WHERE id = $13
           RETURNING *
            `,
            [nombre_articulo, codigo_barra, precio_venta,
                tipo_articulo, marca_id, stock_minimo || null, unidad_medida,
                proveedor_id, precio_compra, estado, tipo_impuesto, categoria_id, id]
        );

        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).json(error);
    }
}


