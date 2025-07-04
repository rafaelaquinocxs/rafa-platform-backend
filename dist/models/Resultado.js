"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const resultadoSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    simuladoId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Simulado', required: true },
    respostas: [{
            questaoId: { type: String, required: true },
            resposta: { type: Number, required: true }
        }],
    acertos: { type: Number, required: true },
    totalQuestoes: { type: Number, required: true },
    percentualAcertos: { type: Number, required: true },
    tempoGasto: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});
exports.default = mongoose_1.default.model('Resultado', resultadoSchema);
