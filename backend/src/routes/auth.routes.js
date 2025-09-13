// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { login, logout, refresh } from '../controllers/auth.controller.js';
import requireDJ from '../middleware/requireDJ.js';

const router = Router();

router.post('/dj/login', login);
router.post('/dj/logout', requireDJ, logout);
router.get('/dj/refresh', refresh); // no requireDJ para permitir renovación

export default router;