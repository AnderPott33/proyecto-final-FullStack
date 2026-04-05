import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import authPuntosExpRoutes from './routes/authPuntosExp.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import empresaRoutes from './routes/empresa.routes.js';
import cuentaRoutes from './routes/cuentas.routes.js';
import cambiosRoutes from './routes/cambio.routes.js';
import movimietosRoutes from './routes/movimiento.routes.js';
import formaPagoRoutes from './routes/formaPago.routes.js';
import entidadRoutes from './routes/entidad.routes.js';
import articuloRoutes from './routes/articulo.routes.js'
import stockRoutes from './routes/stock.routes.js'
import categoriasRoutes from './routes/categoriasArticulo.routes.js'
import marcasRoutes from './routes/marcasArticulo.routes.js'
import ventasRoutes from './routes/ventas.routes.js';
import comprasRoutes from './routes/compras.routes.js';
import timbradosRoutes from './routes/timbrados.routes.js'

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// rutas
app.use('/api/auth', authRoutes);
app.use('/api/authPuntos', authPuntosExpRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/entidad', entidadRoutes);
app.use('/api/movimiento', cajaRoutes);
app.use('/api/cuenta', cuentaRoutes);
app.use('/api/cambio', cambiosRoutes);
app.use('/api/movimientos', movimietosRoutes);
app.use('/api/formaPago', formaPagoRoutes);
app.use('/api/entidades', entidadRoutes);
app.use('/api/articulo', articuloRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/timbrados', timbradosRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});