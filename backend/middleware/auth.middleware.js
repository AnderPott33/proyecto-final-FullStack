import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  try {
    // token enviado en header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ error: 'Token malformado' });

    // verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // guardamos datos del usuario en request
    next(); // pasa al siguiente middleware / ruta
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};