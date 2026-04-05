import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { listarCajas, abrirCaja, registrarMovimiento, cerrarCaja, actualizarCaja, ListarMovimientoCaja, consultarMovimientos, loguearCaja, cajaLogueada, reabrirCaja, EliminarMovimiento } from '../controllers/caja.controller.js';

const router = Router();
/* Cajas */
router.get('/', requireAuth, listarCajas);
router.post('/loguear', requireAuth, loguearCaja);
router.post('/abrir', requireAuth, abrirCaja);
router.put('/actualizar/:id', requireAuth, actualizarCaja);
router.put('/cerrar/:id', requireAuth, cerrarCaja);
router.put('/reabrir/:id', requireAuth, reabrirCaja);
router.get('/activa', requireAuth, cajaLogueada);


/* Movimientos */
router.get('/registros', requireAuth, ListarMovimientoCaja);
router.delete("/movimiento/:id", requireAuth, EliminarMovimiento);
router.post('/registrarMovimiento', requireAuth, registrarMovimiento);
router.get('/:id/movimientos', requireAuth, consultarMovimientos);

export default router;