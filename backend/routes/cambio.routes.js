import { Router } from 'express';
import { actualizarCotizaciones, obtenerCambio, existeCotizacionHoy } from '../controllers/cambio.controller.js';
import { obtenerCambios } from '../controllers/cambio.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/existe-hoy',requireAuth, existeCotizacionHoy);
router.post('/',requireAuth, obtenerCambio);
router.get('/cambios',requireAuth, obtenerCambios);
router.post('/actualizar',requireAuth, actualizarCotizaciones);

export default router;