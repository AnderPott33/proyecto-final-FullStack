import 'dotenv/config';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || process.env.JWT_SECRETO || 'secret';

// Payload mínimo; ajusta `id` o `nombre` según se necesite para permisos en tu entorno
const payload = {
  id: 1,
  nombre: 'dev-automation',
  rol: 'admin'
};

const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log(token);
