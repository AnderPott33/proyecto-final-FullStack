import 'dotenv/config';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || process.env.JWT_SECRETO || 'secret';

const payload = { id: 1, nombre: 'dev-automation', rol: 'admin' };
const token = jwt.sign(payload, secret, { expiresIn: '7d' });

const API = process.env.API_URL || 'http://localhost:5000';

const endpoints = [
  '/api/cuenta?limit=300',
  '/api/entidad?limit=300',
  '/api/formaPago?limit=200',
  '/api/articulo?limit=500',
  '/api/empresa?limit=50',
  '/api/categorias?limit=200',
  '/api/ventas?limit=500',
  '/api/compras?limit=500',
  '/api/marcas?limit=200',
  '/api/timbrados?limit=200'
];

(async () => {
  for (const e of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(API + e, { headers: { Authorization: `Bearer ${token}` } });
      const duration = (Date.now() - start) / 1000;
      const text = await res.text();
      console.log(`${e} -> ${res.status} ${duration}s, bytes=${text.length}`);
    } catch (err) {
      console.error(`${e} -> error`, err.message || err);
    }
    // small delay between requests
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log('done');
  process.exit(0);
})();
