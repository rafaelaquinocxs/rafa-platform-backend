"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistoricoResultados = exports.submeterRespostas = exports.iniciarSimulado = exports.getSimulado = exports.getSimulados = void 0;
const Simulado_1 = __importDefault(require("../models/Simulado"));
const Resultado_1 = __importDefault(require("../models/Resultado"));
// Obter todos os simulados
const getSimulados = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const simulados = yield Simulado_1.default.find({ ativo: true }).select('-questoes.respostaCorreta -questoes.explicacao');
        const simuladosBasicos = simulados.map(simulado => ({
            id: simulado._id,
            titulo: simulado.titulo,
            descricao: simulado.descricao,
            materias: simulado.materias,
            quantidadeQuestoes: simulado.questoes.length,
            tempoDuracao: simulado.tempoDuracao
        }));
        res.json({ simulados: simuladosBasicos });
    }
    catch (error) {
        console.error('Erro ao obter simulados:', error);
        res.status(500).json({ message: 'Erro ao obter simulados' });
    }
});
exports.getSimulados = getSimulados;
// Obter um simulado específico
const getSimulado = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const simulado = yield Simulado_1.default.findById(id);
        if (!simulado) {
            return res.status(404).json({ message: 'Simulado não encontrado' });
        }
        res.json({ simulado });
    }
    catch (error) {
        console.error('Erro ao obter simulado:', error);
        res.status(500).json({ message: 'Erro ao obter simulado' });
    }
});
exports.getSimulado = getSimulado;
// Iniciar um simulado (retorna apenas as perguntas, sem as respostas)
const iniciarSimulado = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const simulado = yield Simulado_1.default.findById(id);
        if (!simulado) {
            return res.status(404).json({ message: 'Simulado não encontrado' });
        }
        // Retornar apenas as perguntas, sem as respostas corretas
        const questoesSemRespostas = simulado.questoes.map(questao => ({
            id: questao._id,
            texto: questao.texto,
            opcoes: questao.opcoes,
            materia: questao.materia
        }));
        res.json({
            id: simulado._id,
            titulo: simulado.titulo,
            tempoDuracao: simulado.tempoDuracao,
            questoes: questoesSemRespostas
        });
    }
    catch (error) {
        console.error('Erro ao iniciar simulado:', error);
        res.status(500).json({ message: 'Erro ao iniciar simulado' });
    }
});
exports.iniciarSimulado = iniciarSimulado;
// Submeter respostas de um simulado
const submeterRespostas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { respostas, tempoGasto } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Vem do middleware de auth
        const simulado = yield Simulado_1.default.findById(id);
        if (!simulado) {
            return res.status(404).json({ message: 'Simulado não encontrado' });
        }
        // Calcular resultado
        let acertos = 0;
        const resultadoDetalhado = simulado.questoes.map(questao => {
            var _a;
            const respostaUsuario = (_a = respostas.find((r) => { var _a; return r.questaoId === ((_a = questao._id) === null || _a === void 0 ? void 0 : _a.toString()); })) === null || _a === void 0 ? void 0 : _a.resposta;
            const acertou = respostaUsuario === questao.respostaCorreta;
            if (acertou) {
                acertos++;
            }
            return {
                questaoId: questao._id,
                acertou,
                respostaUsuario,
                respostaCorreta: questao.respostaCorreta,
                explicacao: questao.explicacao
            };
        });
        const percentualAcertos = Math.round((acertos / simulado.questoes.length) * 100);
        // Salvar resultado no banco de dados
        if (userId) {
            yield Resultado_1.default.create({
                userId,
                simuladoId: simulado._id,
                respostas,
                acertos,
                totalQuestoes: simulado.questoes.length,
                percentualAcertos,
                tempoGasto
            });
        }
        const resultado = {
            simuladoId: simulado._id,
            titulo: simulado.titulo,
            totalQuestoes: simulado.questoes.length,
            acertos,
            percentualAcertos,
            tempoGasto,
            resultadoDetalhado
        };
        res.json({ resultado });
    }
    catch (error) {
        console.error('Erro ao submeter respostas:', error);
        res.status(500).json({ message: 'Erro ao submeter respostas' });
    }
});
exports.submeterRespostas = submeterRespostas;
// Obter histórico de resultados do usuário
const getHistoricoResultados = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const resultados = yield Resultado_1.default.find({ userId })
            .populate('simuladoId', 'titulo')
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ resultados });
    }
    catch (error) {
        console.error('Erro ao obter histórico:', error);
        res.status(500).json({ message: 'Erro ao obter histórico' });
    }
});
exports.getHistoricoResultados = getHistoricoResultados;
