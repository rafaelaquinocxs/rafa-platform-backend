import express from 'express';
import { 
  getPlanos, 
  getPlano, 
  getAssinaturaUsuario, 
  criarAssinatura, 
  cancelarAssinatura 
} from '../controllers/assinatura.controller';

const router = express.Router();

// Rotas de planos e assinaturas
router.get('/planos', getPlanos);
router.get('/planos/:id', getPlano);
router.get('/usuario/:userId', getAssinaturaUsuario);
router.post('/', criarAssinatura);
router.put('/usuario/:userId/cancelar', cancelarAssinatura);

export default router;
