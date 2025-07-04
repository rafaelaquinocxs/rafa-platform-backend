import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import simuladoRoutes from './routes/simulado.routes';
import estatisticaRoutes from './routes/estatistica.routes';
import assinaturaRoutes from './routes/assinatura.routes';
import { seedDatabase } from './utils/seedData';

// Configuração das variáveis de ambiente
dotenv.config();

// Inicialização do app Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Conexão com banco de dados MongoDB
mongoose.connect(process.env.MONGO_URI!)
  .then(async () => {
    console.log('✅ MongoDB conectado com sucesso');
    // Criar dados de exemplo após conectar
    await seedDatabase();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
  });

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/simulados', simuladoRoutes);
app.use('/api/estatisticas', estatisticaRoutes);
app.use('/api/assinaturas', assinaturaRoutes);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
