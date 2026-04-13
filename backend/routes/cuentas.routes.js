import { Router } from 'express';
import {
    crearCuenta,
    obtenerCuentas,
    obtenerCuentaPorId,
    actualizarCuenta,
    eliminarCuenta,
    obtenerCuentaFormaPago,
    obtenerCuentaFormaPago2,
    obtenerAnaliticoCuenta,
    obtenerAnaliticoCuentaEntidad,
    obtenerSaldosCuentas,
    obtenerSaldosCuentasCobrarPagar,
    obtenerSaldoCuentaEntidad,
    balancePatrimonial
} from '../controllers/cuentas.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren login
router.use(requireAuth);

router.get('/',requireAuth, obtenerCuentas);          // Listar todas las cuentas
router.get('/:id',requireAuth, obtenerCuentaPorId);   // Obtener cuenta específica
router.post('/saldos',requireAuth, obtenerSaldosCuentas);   // Obtener saldos de todas las cuentas
router.post('/balance',requireAuth, balancePatrimonial);   // Obtener saldos de todas las cuentas
router.post('/saldosCobrarPagar',requireAuth, obtenerSaldosCuentasCobrarPagar);   // Obtener saldos de todas las cuentas
router.post('/saldoEntidad',requireAuth, obtenerSaldoCuentaEntidad);   // Obtener saldo de una cuenta para una entidad específica
router.post('/analitico',requireAuth, obtenerAnaliticoCuenta);   // Obtener cuenta específica
router.post('/analiticoEntidad',requireAuth, obtenerAnaliticoCuentaEntidad);   // Obtener cuenta específica
router.post('/formaPago',requireAuth, obtenerCuentaFormaPago);   
router.post('/formaPago2',requireAuth, obtenerCuentaFormaPago2);   
router.post('/',requireAuth, crearCuenta);            // Crear nueva cuenta
router.put('/:id',requireAuth, actualizarCuenta);     // Actualizar cuenta
router.delete('/:id',requireAuth, eliminarCuenta);    // Eliminar cuenta

export default router;