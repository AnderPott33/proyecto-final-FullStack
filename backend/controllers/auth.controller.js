import { pool } from './config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/* Registro de Usuarios */
export const register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // validar duplicado
        const existe = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Usuario ya existe' });
        }

        // hash password
        const hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, password, rol, estado)
       VALUES ($1, $2, $3, $4, 'ACTIVO')
       RETURNING id, nombre, email, rol`,
            [nombre, email, hash, rol || 'cajero']
        );

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Editar Usuario */
export const editarUsuario = async (req, res) => {
    try {
        const { id } = req.params; // id del usuario a editar
        const { nombre, email, password, rol, estado } = req.body;

        // Verificar que el usuario exista
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Si viene password, hashéala
        let hashedPassword = result.rows[0].password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Actualizar usuario
        const updateQuery = `
      UPDATE usuarios
      SET nombre = $1,
          email = $2,
          password = $3,
          rol = $4,
          estado = $5
      WHERE id = $6
      RETURNING id, nombre, email, rol, estado
    `;

        const updateValues = [
            nombre || result.rows[0].nombre,
            email || result.rows[0].email,
            hashedPassword,
            rol || result.rows[0].rol,
            estado || result.rows[0].estado,
            id
        ];

        const updateResult = await pool.query(updateQuery, updateValues);

        res.json({
            msg: 'Usuario actualizado',
            usuario: updateResult.rows[0]
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Login Usuarios */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );


        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Usuario no existe' });
        }

        const usuario = result.rows[0];

        if (usuario.estado !== 'ACTIVO') {
            return res.status(403).json({ error: 'Usuario no habilitado' });
        }

        const valid = await bcrypt.compare(password, usuario.password);

        if (!valid) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        const expiresIn = 2 * 60 * 60 * 1000; // 8 horas en ms
        const expireAt = Date.now() + expiresIn;

        res.json({
            token,
            expireAt, // <-- este es el timestamp que el frontend usará
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener usuario por ID
export const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nombre, email, rol, estado
             FROM usuarios
             ORDER BY id`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// auth.controller.js
export const getUsuario = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, email, rol, estado, caja_logueada FROM usuarios WHERE id = $1',
            [req.user.id] // req.user viene de requireAuth
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Ejemplo Node.js / Express
export const obtenerPuntoUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await pool.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }


const puntos = await pool.query(`
    SELECT 
        pe.*,
        up.activo,  -- 👈 agrega esto
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', t.id,
                    'numero_timbrado', t.numero_timbrado,
                    'fecha_inicio', t.fecha_inicio,
                    'fecha_fin', t.fecha_fin,
                    'numero_inicio', t.numero_inicio,
                    'numero_fin', t.numero_fin,
                    'numero_actual', t.numero_actual,
                    'estado', t.estado,
                    'tipo_documento', tipo_documento,
                    'codigo_emp', t.codigo_emp,
                    'codigo_suc', t.codigo_suc
                )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
        ) AS timbrados
    FROM punto_expedicion pe
    JOIN usuario_punto up ON up.punto_id = pe.id
    LEFT JOIN timbrado t ON t.punto_expedicion_id = pe.id
    WHERE up.usuario_id = $1 
      AND pe.estado = 'ACTIVO'
    GROUP BY pe.id, up.activo
`, [usuario.rows[0].id]);
        res.json(puntos.rows);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar puntos del usuario');
    }
};

/* Obtener los puntos habilitados para el usuario */
/* export const obtenerPuntosUsuarios =  async (req, res) => {
  const usuarioId = req.user.id;
  const puntos = await pool.query(
    `SELECT pe.id, pe.nombre 
     FROM punto_expedicion pe
     JOIN usuario_punto up ON up.punto_id = pe.id
     WHERE up.usuario_id = $1
     ORDER BY pe.id`,
    [usuarioId]
  );
  res.json(puntos.rows);
}; */