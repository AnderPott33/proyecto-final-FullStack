import { Router } from 'express';
import { buscarCompra, buscarComprasId, crearCompra, devolverCompra, buscarComprasYDevoluciones } from '../controllers/compras.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);


router.get('/',requireAuth, buscarCompra);
/* router.get('/:id',requireAuth, buscarVentaId); */
/* router.get('/nuevaSeqVenta/:timbrado',requireAuth, generarNuevaSeqVenta); */
/* router.get('/categoria/:categoria_id',requireAuth, consultarStockCategoriaId);
router.get('/marca/:marca_id',requireAuth, consultarStockMarcaId); */
router.post('/nuevaCompra',requireAuth, crearCompra);
 router.post('/nuevaDevolucionCompra',requireAuth, devolverCompra);
 router.get('/devolver/:id',requireAuth, buscarComprasId);
 router.get('/buscarComprasyDevulucion',requireAuth, buscarComprasYDevoluciones);
/*router.get('/imprimir/:tipo/:id',requireAuth, imprimirVenta); */


export default router;