"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assinatura_controller_1 = require("../controllers/assinatura.controller");
const router = express_1.default.Router();
// Rotas de planos e assinaturas
router.get('/planos', assinatura_controller_1.getPlanos);
router.get('/planos/:id', assinatura_controller_1.getPlano);
router.get('/usuario/:userId', assinatura_controller_1.getAssinaturaUsuario);
router.post('/', assinatura_controller_1.criarAssinatura);
router.put('/usuario/:userId/cancelar', assinatura_controller_1.cancelarAssinatura);
exports.default = router;
