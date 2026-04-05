import { Router } from 'express';
import { register, login, editarUsuario, obtenerUsuarioPorId, obtenerUsuarios, getUsuario, obtenerPuntoUsuario } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';


const router = Router();

router.get('/me', requireAuth, getUsuario);
router.get('/', requireAuth, obtenerUsuarios);  
router.get('/:id', requireAuth, obtenerUsuarioPorId);
router.post('/register', requireAuth, register);
router.post('/login', login);
router.get('/puntos/usuario/:id', requireAuth, obtenerPuntoUsuario)
router.put('/:id', requireAuth, editarUsuario);

export default router;