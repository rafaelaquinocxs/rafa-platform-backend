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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const simulado_routes_1 = __importDefault(require("./routes/simulado.routes"));
const estatistica_routes_1 = __importDefault(require("./routes/estatistica.routes"));
const assinatura_routes_1 = __importDefault(require("./routes/assinatura.routes"));
const seedData_1 = require("./utils/seedData");
// Configuração das variáveis de ambiente
dotenv_1.default.config();
// Inicialização do app Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express_1.default.json());
// Conexão com banco de dados MongoDB
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('✅ MongoDB conectado com sucesso');
    // Criar dados de exemplo após conectar
    yield (0, seedData_1.seedDatabase)();
}))
    .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
});
// Rotas
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/simulados', simulado_routes_1.default);
app.use('/api/estatisticas', estatistica_routes_1.default);
app.use('/api/assinaturas', assinatura_routes_1.default);
// Rota básica para teste
app.get('/', (req, res) => {
    res.json({
        message: 'API da plataforma RAFA está funcionando!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            simulados: '/api/simulados',
            estatisticas: '/api/estatisticas',
            assinaturas: '/api/assinaturas'
        }
    });
});
// Rota para informações da API
app.get('/api', (req, res) => {
    res.json({
        name: 'RAFA Platform API',
        version: '1.0.0',
        description: 'API para plataforma educacional de concursos públicos',
        endpoints: {
            'POST /api/auth/register': 'Registrar usuário',
            'POST /api/auth/login': 'Login de usuário',
            'GET /api/simulados': 'Listar simulados',
            'POST /api/simulados/:id/iniciar': 'Iniciar simulado',
            'POST /api/simulados/:id/submeter': 'Submeter respostas'
        }
    });
});
// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Rota não encontrada',
        availableRoutes: ['/api', '/api/auth', '/api/simulados']
    });
});
// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 API disponível em: http://localhost:${PORT}`);
    console.log(`📖 Documentação: http://localhost:${PORT}/api`);
});
