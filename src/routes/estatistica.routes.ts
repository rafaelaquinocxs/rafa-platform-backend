import express from 'express';
import { 
  getEstatisticasGerais, 
  getEstatisticasPorMateria, 
  getHistoricoSimulados,
  getAllEstatisticas 
} from '../controllers/estatistica.controller';

const router = express.Router();

// Rotas de estatísticas
router.get('/usuario/:userId/geral', getEstatisticasGerais);
router.get('/usuario/:userId/materias', getEstatisticasPorMateria);
router.get('/usuario/:userId/historico', getHistoricoSimulados);
router.get('/usuario/:userId', getAllEstatisticas);

export default router;
