// routes/cambio.routes.js
import { Router } from 'express';
import { getCambioChaco } from "../controllers/cambio.controller.js";

const router = Router();

router.get("/chaco", getCambioChaco);

export default router;