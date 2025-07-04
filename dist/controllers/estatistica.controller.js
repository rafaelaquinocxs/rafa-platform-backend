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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEstatisticas = exports.getHistoricoSimulados = exports.getEstatisticasPorMateria = exports.getEstatisticasGerais = void 0;
// Mock de estatísticas para desenvolvimento
const estatisticas = {
    geral: {
        totalSimulados: 24,
        totalQuestoes: 1200,
        acertos: 816,
        erros: 384,
        tempoMedio: '2m 30s',
    },
    materias: [
        { id: 1, nome: 'Direito Constitucional', acertos: 78, total: 300, tempo: '2m 15s' },
        { id: 2, nome: 'Direito Administrativo', acertos: 65, total: 250, tempo: '2m 45s' },
        { id: 3, nome: 'Português', acertos: 82, total: 200, tempo: '1m 50s' },
        { id: 4, nome: 'Raciocínio Lógico', acertos: 70, total: 150, tempo: '3m 10s' },
        { id: 5, nome: 'Informática', acertos: 75, total: 100, tempo: '2m 05s' },
        { id: 6, nome: 'Direito Penal', acertos: 60, total: 200, tempo: '2m 55s' },
    ],
    historico: [
        { id: 1, data: '20/04/2025', tipo: 'Simulado Completo', acertos: 75, total: 100, tempo: '2h 15m' },
        { id: 2, data: '18/04/2025', tipo: 'Direito Administrativo', acertos: 32, total: 50, tempo: '1h 20m' },
        { id: 3, data: '15/04/2025', tipo: 'Português', acertos: 41, total: 50, tempo: '1h 05m' },
        { id: 4, data: '10/04/2025', tipo: 'Simulado Completo', acertos: 68, total: 100, tempo: '2h 30m' },
        { id: 5, data: '05/04/2025', tipo: 'Raciocínio Lógico', acertos: 35, total: 50, tempo: '1h 25m' },
    ]
};
// Obter estatísticas gerais do usuário
const getEstatisticasGerais = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Em uma implementação real, buscaríamos do banco de dados com base no ID do usuário
        // que viria do token JWT
        const userId = req.params.userId || '1';
        res.json({ estatisticas: estatisticas.geral });
    }
    catch (error) {
        console.error('Erro ao obter estatísticas gerais:', error);
        res.status(500).json({ message: 'Erro ao obter estatísticas gerais' });
    }
});
exports.getEstatisticasGerais = getEstatisticasGerais;
// Obter estatísticas por matéria
const getEstatisticasPorMateria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Em uma implementação real, buscaríamos do banco de dados com base no ID do usuário
        const userId = req.params.userId || '1';
        res.json({ estatisticas: estatisticas.materias });
    }
    catch (error) {
        console.error('Erro ao obter estatísticas por matéria:', error);
        res.status(500).json({ message: 'Erro ao obter estatísticas por matéria' });
    }
});
exports.getEstatisticasPorMateria = getEstatisticasPorMateria;
// Obter histórico de simulados
const getHistoricoSimulados = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Em uma implementação real, buscaríamos do banco de dados com base no ID do usuário
        const userId = req.params.userId || '1';
        res.json({ historico: estatisticas.historico });
    }
    catch (error) {
        console.error('Erro ao obter histórico de simulados:', error);
        res.status(500).json({ message: 'Erro ao obter histórico de simulados' });
    }
});
exports.getHistoricoSimulados = getHistoricoSimulados;
// Obter todas as estatísticas (geral, por matéria e histórico)
const getAllEstatisticas = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Em uma implementação real, buscaríamos do banco de dados com base no ID do usuário
        const userId = req.params.userId || '1';
        res.json({ estatisticas });
    }
    catch (error) {
        console.error('Erro ao obter todas as estatísticas:', error);
        res.status(500).json({ message: 'Erro ao obter todas as estatísticas' });
    }
});
exports.getAllEstatisticas = getAllEstatisticas;
