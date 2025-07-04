"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simulado_controller_1 = require("../controllers/simulado.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Rotas públicas
router.get('/', simulado_controller_1.getSimulados);
router.get('/:id', simulado_controller_1.getSimulado);
// Rotas protegidas
router.post('/:id/iniciar', auth_middleware_1.authMiddleware, simulado_controller_1.iniciarSimulado);
router.post('/:id/submeter', auth_middleware_1.authMiddleware, simulado_controller_1.submeterRespostas);
router.get('/usuario/historico', auth_middleware_1.authMiddleware, simulado_controller_1.getHistoricoResultados);
exports.default = router;
