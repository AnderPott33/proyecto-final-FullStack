import { pool } from '../config/db.js';

export const obtenerEmpresas = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM empresa');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const agregarEmpresa = async (req, res) => {
  const { razon_social, nombre_fantasia, ruc, dv, direccion, telefono, email, estado, cuenta_ingreso_venta, cuenta_gasto_compra, cuenta_iva_credito, cuenta_iva_debito, codigo_suc } = req.body;
  try {
    const result = await pool.query(`
  INSERT INTO empresa
    (razon_social,
    nombre_fantasia,
    ruc,
    dv,
    direccion,
    telefono,
    email,
    estado,
    cuenta_ingreso_venta,
     cuenta_gasto_compra,
      cuenta_iva_credito,
       cuenta_iva_debito,
       codigo_suc
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, $13)
  `, [razon_social, nombre_fantasia, ruc, dv, direccion, telefono, email, estado, cuenta_ingreso_venta, cuenta_gasto_compra, cuenta_iva_credito, cuenta_iva_debito, codigo_suc]
    )

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
};

export const actualizarEmpresa = async (req, res) => {
  const { id } = req.params;
  const { razon_social, nombre_fantasia, ruc, dv, direccion, telefono, email, estado, cuenta_ingreso_venta, cuenta_gasto_compra, cuenta_iva_credito, cuenta_iva_debito, codigo_suc } = req.body;
  try {
    const result = await pool.query(`
  UPDATE empresa SET
    razon_social = $1,
    nombre_fantasia = $2,
    ruc = $3,
    dv = $4,
    direccion = $5,
    telefono = $6,
    email = $7,
    estado = $8,
    cuenta_ingreso_venta = $9,
    cuenta_gasto_compra = $10, 
    cuenta_iva_credito = $11, 
    cuenta_iva_debito = $12,
    codigo_suc = $13
    WHERE id = $14
  `, [razon_social, nombre_fantasia, ruc, dv, direccion, telefono, email, estado, cuenta_ingreso_venta, cuenta_gasto_compra, cuenta_iva_credito, cuenta_iva_debito, codigo_suc, id]
    )

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
};

export const buscarPuntoExpedicion = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM punto_expedicion`);

    res.status(200).json(result.rows)
  } catch (error) {
    res.status(500).json(error);
  }
}


export const agregarPuntoExpedicion = async (req, res) => {
  let { empresa_id, nombre, codigo, direccion, telefono, correo, estado, timbrado } = req.body;
  try {

    empresa_id = parseInt(empresa_id) || null;
    const result = await pool.query(
      `INSERT INTO punto_expedicion (empresa_id,nombre,codigo,direccion,telefono,correo,estado,timbrado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [empresa_id, nombre, codigo, direccion, telefono, correo, estado, timbrado]
    );

    res.status(200).json(result.rows[0])

  } catch (error) {
    console.error(error);
  }
}

export const actualizarPuntoExpedicion = async (req, res) => {
  const { id } = req.params;
  let { empresa_id, nombre, codigo, direccion, telefono, correo, estado, timbrado } = req.body;
  try {
    empresa_id = parseInt(empresa_id) || null;
    const result = await pool.query(
      `UPDATE punto_expedicion SET 
      empresa_id = $1,
      nombre = $2,
      codigo = $3,
      direccion = $4,
      telefono = $5,
      correo = $6,
      estado = $7,
      timbrado = $8
      WHERE id = $9`,
      [empresa_id, nombre, codigo, direccion, telefono, correo, estado, timbrado, id]
    );

    res.status(200).json(result.rows[0])

  } catch (error) {
    console.error(error);
  }
}