import { Router } from 'express';
import { obtenerCategorias, obtenerCategoriasId, crearCategoria, editarCategoria, deletarCategoria } from '../controllers/categoriaArticulo.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, obtenerCategorias);
router.get('/:id',requireAuth, obtenerCategoriasId);
router.post('/nuevaCategoria',requireAuth, crearCategoria);
router.put('/editarCategoria/:id',requireAuth, editarCategoria);
router.delete('/deletarCategoria/:id',requireAuth, deletarCategoria);

export default router;