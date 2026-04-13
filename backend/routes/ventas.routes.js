import { Router } from 'express';
import { buscarVenta, buscarVentaId, buscarVentasYDevoluciones, crearVenta, devolverVenta, generarNuevaSeqVenta, inactivarCompraVenta } from '../controllers/ventas.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);


router.get('/',requireAuth, buscarVenta);
router.get('/buscarVentasYDevoluciones',requireAuth, buscarVentasYDevoluciones);
router.get('/:id',requireAuth, buscarVentaId);
router.get('/nuevaSeqVenta/:timbrado',requireAuth, generarNuevaSeqVenta);
/* router.get('/categoria/:categoria_id',requireAuth, consultarStockCategoriaId);
router.get('/marca/:marca_id',requireAuth, consultarStockMarcaId); */
router.post('/nuevaVenta',requireAuth, crearVenta);
router.post('/nuevaDevolucionVenta',requireAuth, devolverVenta);
router.put('/compras-ventas/inactivar/:id',requireAuth, inactivarCompraVenta);


export default router;