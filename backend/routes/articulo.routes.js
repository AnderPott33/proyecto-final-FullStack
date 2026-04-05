import { Router } from 'express';
import { actualizarArticulo, crearArticulo, obtenerArticulos, obtenerArticulosId, obtenerArticulosCategoriaId, obtenerArticulosIdCodBarra } from '../controllers/articulo.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, obtenerArticulos);
router.get('/:id',requireAuth, obtenerArticulosId);
router.get('/rapido/:id',requireAuth, obtenerArticulosIdCodBarra);
router.get('/categoria/:categoria_id',requireAuth, obtenerArticulosCategoriaId);
router.post('/nuevoArticulo',requireAuth, crearArticulo);
router.put('/actualizarArticulo/:id',requireAuth, actualizarArticulo);

export default router;