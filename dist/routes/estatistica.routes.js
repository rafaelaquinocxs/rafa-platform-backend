"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const estatistica_controller_1 = require("../controllers/estatistica.controller");
const router = express_1.default.Router();
// Rotas de estatísticas
router.get('/usuario/:userId/geral', estatistica_controller_1.getEstatisticasGerais);
router.get('/usuario/:userId/materias', estatistica_controller_1.getEstatisticasPorMateria);
router.get('/usuario/:userId/historico', estatistica_controller_1.getHistoricoSimulados);
router.get('/usuario/:userId', estatistica_controller_1.getAllEstatisticas);
exports.default = router;
