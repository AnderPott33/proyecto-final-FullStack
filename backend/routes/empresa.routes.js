import { Router } from 'express';
import { agregarEmpresa, actualizarEmpresa, obtenerEmpresas, buscarPuntoExpedicion, actualizarPuntoExpedicion, agregarPuntoExpedicion } from '../controllers/empresa.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/', requireAuth, obtenerEmpresas);
router.post('/agregarEmpresa', requireAuth, agregarEmpresa)
router.put('/actualizarEmpresa/:id', requireAuth, actualizarEmpresa)
router.post('/agregarPuntoExpedicion', requireAuth, agregarPuntoExpedicion)
router.put('/actualizarPuntoExpedicion/:id', requireAuth, actualizarPuntoExpedicion)
router.get('/puntoExpedicion', requireAuth, buscarPuntoExpedicion)

export default router;