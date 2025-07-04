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
exports.seedDatabase = void 0;
const User_1 = __importDefault(require("../models/User"));
const Simulado_1 = __importDefault(require("../models/Simulado"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar se já existem dados
        const userCount = yield User_1.default.countDocuments();
        const simuladoCount = yield Simulado_1.default.countDocuments();
        if (userCount > 0 && simuladoCount > 0) {
            console.log('📊 Dados já existem no banco');
            return;
        }
        console.log('🌱 Criando dados de exemplo...');
        // Criar usuário administrador
        const adminExists = yield User_1.default.findOne({ email: 'admin@rafa.com' });
        if (!adminExists) {
            const hashedPassword = yield bcryptjs_1.default.hash('admin123', 10);
            yield User_1.default.create({
                nome: 'Administrador',
                email: 'admin@rafa.com',
                senha: hashedPassword,
                role: 'admin'
            });
            console.log('👤 Usuário administrador criado');
        }
        // Criar usuário de teste
        const testUserExists = yield User_1.default.findOne({ email: 'aluno@rafa.com' });
        if (!testUserExists) {
            const hashedPassword = yield bcryptjs_1.default.hash('123456', 10);
            yield User_1.default.create({
                nome: 'Aluno Teste',
                email: 'aluno@rafa.com',
                senha: hashedPassword,
                role: 'user'
            });
            console.log('👤 Usuário de teste criado');
        }
        // Criar simulados de exemplo
        if (simuladoCount === 0) {
            const simulados = [
                {
                    titulo: 'Simulado Completo - Direito Constitucional',
                    descricao: 'Simulado abrangente com questões de Direito Constitucional',
                    materias: ['Direito Constitucional'],
                    tempoDuracao: 3600,
                    questoes: [
                        {
                            texto: 'De acordo com a Constituição Federal, são direitos sociais, EXCETO:',
                            opcoes: [
                                'Educação e saúde',
                                'Alimentação e trabalho',
                                'Propriedade privada',
                                'Moradia e transporte',
                                'Lazer e segurança'
                            ],
                            respostaCorreta: 2,
                            materia: 'Direito Constitucional',
                            explicacao: 'A propriedade privada é um direito individual, previsto no art. 5º, XXII, da CF/88, e não um direito social. Os direitos sociais estão previstos no art. 6º da CF/88.'
                        },
                        {
                            texto: 'O princípio da legalidade na Administração Pública significa que:',
                            opcoes: [
                                'O administrador pode fazer tudo que a lei não proíbe',
                                'O administrador só pode fazer o que a lei permite',
                                'A lei não se aplica à Administração Pública',
                                'O administrador tem discricionariedade total',
                                'A Administração está acima da lei'
                            ],
                            respostaCorreta: 1,
                            materia: 'Direito Constitucional',
                            explicacao: 'O princípio da legalidade estabelece que a Administração Pública só pode fazer aquilo que a lei expressamente permite, diferentemente dos particulares que podem fazer tudo que a lei não proíbe.'
                        },
                        {
                            texto: 'São características dos direitos fundamentais:',
                            opcoes: [
                                'Relatividade, historicidade e universalidade',
                                'Absolutismo, temporalidade e particularidade',
                                'Relatividade, atemporalidade e regionalidade',
                                'Absolutismo, historicidade e universalidade',
                                'Temporalidade, relatividade e particularidade'
                            ],
                            respostaCorreta: 0,
                            materia: 'Direito Constitucional',
                            explicacao: 'Os direitos fundamentais são relativos (não absolutos), históricos (evoluem no tempo) e universais (aplicam-se a todos).'
                        }
                    ]
                },
                {
                    titulo: 'Simulado de Português',
                    descricao: 'Questões de língua portuguesa para concursos',
                    materias: ['Português'],
                    tempoDuracao: 2400,
                    questoes: [
                        {
                            texto: 'Assinale a alternativa em que há erro de concordância verbal:',
                            opcoes: [
                                'Fazem dois anos que ele partiu',
                                'Devem haver soluções para o problema',
                                'Choveu pedras de granizo ontem',
                                'Bateram três horas no relógio da igreja',
                                'Existem pessoas honestas no mundo'
                            ],
                            respostaCorreta: 1,
                            materia: 'Português',
                            explicacao: 'O correto é "Deve haver soluções", pois o verbo "haver" no sentido de "existir" é impessoal e não varia.'
                        },
                        {
                            texto: 'Em qual alternativa o uso da crase está correto?',
                            opcoes: [
                                'Vou à casa de minha mãe',
                                'Refiro-me à pessoas especiais',
                                'Chegamos à uma conclusão',
                                'Ele se dirigiu à ela',
                                'Fomos à pé até lá'
                            ],
                            respostaCorreta: 0,
                            materia: 'Português',
                            explicacao: 'A crase está correta em "Vou à casa de minha mãe" porque há a preposição "a" + artigo "a" antes de substantivo feminino determinado.'
                        }
                    ]
                },
                {
                    titulo: 'Simulado de Raciocínio Lógico',
                    descricao: 'Questões de lógica e matemática básica',
                    materias: ['Raciocínio Lógico', 'Matemática'],
                    tempoDuracao: 1800,
                    questoes: [
                        {
                            texto: 'Se todos os A são B, e alguns B são C, então:',
                            opcoes: [
                                'Todos os A são C',
                                'Alguns A são C',
                                'Nenhum A é C',
                                'Não é possível determinar a relação entre A e C',
                                'Todos os C são A'
                            ],
                            respostaCorreta: 3,
                            materia: 'Raciocínio Lógico',
                            explicacao: 'Com as informações dadas, não é possível determinar com certeza a relação entre A e C, pois não sabemos se os B que são A estão entre os B que são C.'
                        },
                        {
                            texto: 'Em uma sequência lógica: 2, 6, 12, 20, 30, ... Qual é o próximo número?',
                            opcoes: [
                                '40',
                                '42',
                                '44',
                                '46',
                                '48'
                            ],
                            respostaCorreta: 1,
                            materia: 'Raciocínio Lógico',
                            explicacao: 'A sequência segue o padrão n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42.'
                        }
                    ]
                }
            ];
            yield Simulado_1.default.insertMany(simulados);
            console.log('📝 Simulados de exemplo criados');
        }
        console.log('✅ Dados de exemplo criados com sucesso!');
        console.log('👤 Login de teste: aluno@rafa.com / 123456');
        console.log('👤 Login admin: admin@rafa.com / admin123');
    }
    catch (error) {
        console.error('❌ Erro ao criar dados de exemplo:', error);
    }
});
exports.seedDatabase = seedDatabase;
