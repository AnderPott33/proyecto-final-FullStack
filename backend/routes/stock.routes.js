import { Router } from 'express';
import { consultarStockId, ajustarStock, consultarStockCategoriaId,consultarStock, consultarStockMarcaId, consultarMovimientosStock  } from '../controllers/stock.controller.js'; 
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);


router.get('/',requireAuth, consultarStock);
router.get('/detallado',requireAuth, consultarMovimientosStock);
router.get('/:id',requireAuth, consultarStockId);
router.get('/categoria/:categoria_id',requireAuth, consultarStockCategoriaId);
router.get('/marca/:marca_id',requireAuth, consultarStockMarcaId);
router.post('/nuevoAjuste',requireAuth, ajustarStock);


export default router;