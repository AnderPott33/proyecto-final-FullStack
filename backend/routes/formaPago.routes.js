import { Router } from 'express';
import { obtenerFormaPago } from '../controllers/formaPago.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, obtenerFormaPago);

export default router;