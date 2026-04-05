import { Router } from 'express';
import { actualizarAutorizacionesPuntos, crearAutorizacionesPuntos, obtenerAutorizacionesPuntos, eliminarAutorizacionesPuntos } from '../controllers/authPuntoExp.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/', requireAuth, obtenerAutorizacionesPuntos);
router.post('/agregarAuthPuntos', requireAuth, crearAutorizacionesPuntos);
router.put('/actualizarAuthPuntos/:id', requireAuth, actualizarAutorizacionesPuntos);
router.delete('/eliminarAuthPuntos/:id', requireAuth, eliminarAutorizacionesPuntos);


export default router;