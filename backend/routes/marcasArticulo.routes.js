import { Router } from 'express';
import { obtenerMarcas, obtenerMarcasId, crearMarca, editarMarca, deletarMarca } from '../controllers/marcaArticulo.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, obtenerMarcas);
router.get('/:id',requireAuth, obtenerMarcasId);
router.post('/nuevaMarca',requireAuth, crearMarca);
router.put('/editarMarca/:id',requireAuth, editarMarca);
router.delete('/deletarMarca/:id',requireAuth, deletarMarca);

export default router;