import { Router } from 'express';
import { registrarMovimiento } from '../controllers/movimiento.controller.js';
import { listarMovimientos } from '../controllers/movimiento.controller.js';
import { obtenerMovimientoCompleto } from '../controllers/movimiento.controller.js';
import { inactivarMovimiento } from '../controllers/movimiento.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, listarMovimientos);
router.put('/inactivar/:id',requireAuth, inactivarMovimiento);
router.get('/:id',requireAuth, obtenerMovimientoCompleto);
router.post('/',requireAuth, registrarMovimiento);

export default router;