"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const questaoSchema = new mongoose_1.default.Schema({
    texto: { type: String, required: true },
    opcoes: [{ type: String, required: true }],
    respostaCorreta: { type: Number, required: true },
    materia: { type: String, required: true },
    explicacao: { type: String, required: true }
});
const simuladoSchema = new mongoose_1.default.Schema({
    titulo: { type: String, required: true },
    descricao: { type: String },
    materias: [{ type: String, required: true }],
    questoes: [questaoSchema],
    tempoDuracao: { type: Number, required: true },
    ativo: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
exports.default = mongoose_1.default.model('Simulado', simuladoSchema);
