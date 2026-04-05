import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { actualizarTimbrado, agregarTimbrado, buscarTimbrado } from '../controllers/timbrados.controller.js'

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/', requireAuth, buscarTimbrado);
router.post('/agregarTimbrado',requireAuth, agregarTimbrado);
router.put('/actualizarTimbrado/:id',requireAuth, actualizarTimbrado);


export default router;