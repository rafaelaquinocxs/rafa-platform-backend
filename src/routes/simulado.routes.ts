import express from 'express';
import { 
  getSimulados, 
  getSimulado, 
  iniciarSimulado, 
  submeterRespostas,
  getHistoricoResultados 
} from '../controllers/simulado.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Rotas públicas
router.get('/', getSimulados);
router.get('/:id', getSimulado);

// Rotas protegidas
router.post('/:id/iniciar', authMiddleware, iniciarSimulado);
router.post('/:id/submeter', authMiddleware, submeterRespostas);
router.get('/usuario/historico', authMiddleware, getHistoricoResultados);

export default router;
