import { Router } from 'express';
import { obtenerEntidad } from '../controllers/entidades.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { crearEntidad } from '../controllers/entidades.controller.js';
import { actualizarEntidad } from '../controllers/entidades.controller.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, obtenerEntidad);
router.put('/:id',requireAuth, actualizarEntidad);
router.post('/nueva',requireAuth, crearEntidad);


export default router;