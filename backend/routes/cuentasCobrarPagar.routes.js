import { Router } from 'express';
import {
    obtenerCuentasCobrarPagar
} from '../controllers/cuentasCobrarPagar.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.post('/',requireAuth, obtenerCuentasCobrarPagar);          // Listar todas las cuentas


export default router;