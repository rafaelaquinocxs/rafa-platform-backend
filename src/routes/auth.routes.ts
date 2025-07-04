import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';

const router = express.Router();

// Rotas de autenticação
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', getProfile);

export default router;
