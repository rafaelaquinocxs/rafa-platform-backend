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
exports.reprocessarPagamento = exports.getHistoricoTransacoes = exports.cancelarAssinatura = exports.criarAssinatura = exports.getAssinaturaUsuario = exports.getPlano = exports.getPlanos = void 0;
const User_1 = __importDefault(require("../models/User"));
const Assinatura_1 = __importDefault(require("../models/Assinatura"));
const Transacao_1 = __importDefault(require("../models/Transacao"));
const asaas_service_1 = __importDefault(require("../services/asaas.service"));
// Planos disponíveis
const planos = [
    {
        id: 'mensal',
        titulo: 'Mensal',
        preco: 49,
        periodo: 'mensal',
        descricao: 'Acesso a todos os recursos por um mês',
        recursos: [
            'Acesso a todos os simulados',
            'Estatísticas básicas',
            'Suporte por email',
            'Acesso a materiais de estudo',
        ]
    },
    {
        id: 'trimestral',
        titulo: 'Trimestral',
        preco: 129,
        periodo: 'trimestral',
        descricao: 'Acesso a todos os recursos por três meses',
        recursos: [
            'Acesso a todos os simulados',
            'Estatísticas avançadas',
            'Suporte prioritário',
            'Acesso a materiais de estudo',
            'Mapas mentais exclusivos',
        ],
        recomendado: true
    },
    {
        id: 'anual',
        titulo: 'Anual',
        preco: 399,
        periodo: 'anual',
        descricao: 'Acesso a todos os recursos por um ano',
        recursos: [
            'Acesso a todos os simulados',
            'Estatísticas avançadas',
            'Suporte prioritário 24/7',
            'Acesso a materiais de estudo',
            'Mapas mentais exclusivos',
            'Simulados personalizados',
            'Acesso a aulas ao vivo',
        ]
    }
];
// Obter todos os planos disponíveis
const getPlanos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json({ planos });
    }
    catch (error) {
        console.error('Erro ao obter planos:', error);
        res.status(500).json({ message: 'Erro ao obter planos' });
    }
});
exports.getPlanos = getPlanos;
// Obter um plano específico
const getPlano = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const plano = planos.find(p => p.id === id);
        if (!plano) {
            return res.status(404).json({ message: 'Plano não encontrado' });
        }
        res.json({ plano });
    }
    catch (error) {
        console.error('Erro ao obter plano:', error);
        res.status(500).json({ message: 'Erro ao obter plano' });
    }
});
exports.getPlano = getPlano;
// Obter assinatura do usuário
const getAssinaturaUsuario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const assinatura = yield Assinatura_1.default.buscarPorUsuario(userId);
        if (!assinatura) {
            return res.status(404).json({ message: 'Assinatura não encontrada' });
        }
        // Obter detalhes do plano
        const plano = planos.find(p => p.id === assinatura.planoId);
        res.json({
            assinatura: Object.assign(Object.assign({}, assinatura.toObject()), { plano })
        });
    }
    catch (error) {
        console.error('Erro ao obter assinatura:', error);
        res.status(500).json({ message: 'Erro ao obter assinatura' });
    }
});
exports.getAssinaturaUsuario = getAssinaturaUsuario;
// Criar nova assinatura com ASAAS
const criarAssinatura = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, planoId, metodoPagamento, dadosCartao, dadosUsuario } = req.body;
        // Verificar se o plano existe
        const plano = planos.find(p => p.id === planoId);
        if (!plano) {
            return res.status(404).json({ message: 'Plano não encontrado' });
        }
        // Verificar se o usuário existe
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        // Verificar se o usuário já tem uma assinatura ativa
        const assinaturaExistente = yield Assinatura_1.default.buscarPorUsuario(userId);
        if (assinaturaExistente && assinaturaExistente.status === 'ativa') {
            return res.status(400).json({ message: 'Usuário já possui uma assinatura ativa' });
        }
        // Criar ou atualizar cliente no ASAAS
        let asaasCustomerId = '';
        try {
            // Tentar buscar cliente existente primeiro
            if (assinaturaExistente === null || assinaturaExistente === void 0 ? void 0 : assinaturaExistente.asaasCustomerId) {
                asaasCustomerId = assinaturaExistente.asaasCustomerId;
                yield asaas_service_1.default.getCustomer(asaasCustomerId);
            }
            else {
                throw new Error('Cliente não encontrado');
            }
        }
        catch (error) {
            // Criar novo cliente no ASAAS
            const customerData = {
                name: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.nome) || user.name,
                email: user.email,
                phone: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.telefone) || '',
                mobilePhone: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.celular) || '',
                cpfCnpj: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.cpf) || '',
                postalCode: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.cep) || '',
                address: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.endereco) || '',
                addressNumber: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.numero) || '',
                complement: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.complemento) || '',
                province: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.bairro) || '',
                city: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.cidade) || '',
                state: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.estado) || '',
                country: 'Brasil'
            };
            const asaasCustomer = yield asaas_service_1.default.createCustomer(customerData);
            asaasCustomerId = asaasCustomer.id;
        }
        // Calcular datas
        const dataInicio = new Date();
        const dataFim = new Date(dataInicio);
        const proximoVencimento = new Date(dataInicio);
        proximoVencimento.setDate(proximoVencimento.getDate() + 7); // Primeira cobrança em 7 dias
        if (plano.periodo === 'mensal') {
            dataFim.setMonth(dataFim.getMonth() + 1);
        }
        else if (plano.periodo === 'trimestral') {
            dataFim.setMonth(dataFim.getMonth() + 3);
        }
        else if (plano.periodo === 'anual') {
            dataFim.setFullYear(dataFim.getFullYear() + 1);
        }
        // Criar assinatura no banco de dados
        const novaAssinatura = new Assinatura_1.default({
            userId,
            planoId,
            asaasCustomerId,
            status: 'pendente',
            dataInicio,
            dataFim,
            proximoVencimento,
            valorMensal: plano.preco,
            metodoPagamento: asaas_service_1.default.convertBillingType(metodoPagamento),
            ciclo: asaas_service_1.default.convertPlanCycleToAsaas(plano.periodo),
            dadosCartao: dadosCartao ? {
                bandeira: dadosCartao.bandeira,
                ultimosDigitos: dadosCartao.numero.slice(-4),
                nomePortador: dadosCartao.nomePortador
            } : undefined
        });
        yield novaAssinatura.save();
        // Criar assinatura no ASAAS
        try {
            const subscriptionData = {
                customer: asaasCustomerId,
                billingType: asaas_service_1.default.convertBillingType(metodoPagamento),
                value: plano.preco,
                nextDueDate: proximoVencimento.toISOString().split('T')[0],
                cycle: asaas_service_1.default.convertPlanCycleToAsaas(plano.periodo),
                description: `Assinatura ${plano.titulo} - Plataforma RAFA`,
                externalReference: novaAssinatura._id.toString(),
                creditCard: dadosCartao ? {
                    holderName: dadosCartao.nomePortador,
                    number: dadosCartao.numero,
                    expiryMonth: dadosCartao.mesVencimento,
                    expiryYear: dadosCartao.anoVencimento,
                    ccv: dadosCartao.cvv
                } : undefined,
                creditCardHolderInfo: dadosCartao ? {
                    name: dadosCartao.nomePortador,
                    email: user.email,
                    cpfCnpj: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.cpf) || '',
                    postalCode: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.cep) || '',
                    addressNumber: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.numero) || '',
                    addressComplement: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.complemento) || '',
                    phone: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.telefone) || '',
                    mobilePhone: (dadosUsuario === null || dadosUsuario === void 0 ? void 0 : dadosUsuario.celular) || ''
                } : undefined
            };
            const asaasSubscription = yield asaas_service_1.default.createSubscription(subscriptionData);
            // Atualizar assinatura com ID do ASAAS
            novaAssinatura.asaasSubscriptionId = asaasSubscription.id;
            novaAssinatura.status = 'ativa';
            yield novaAssinatura.save();
            yield novaAssinatura.adicionarHistorico('ASSINATURA_CRIADA', `Assinatura criada no ASAAS com ID: ${asaasSubscription.id}`, plano.preco);
        }
        catch (asaasError) {
            console.error('Erro ao criar assinatura no ASAAS:', asaasError);
            // Marcar assinatura como com erro
            yield novaAssinatura.adicionarHistorico('ERRO_ASAAS', `Erro ao criar assinatura no ASAAS: ${asaasError.message}`);
            return res.status(400).json({
                message: 'Erro ao processar pagamento',
                details: asaasError.message
            });
        }
        res.status(201).json({
            message: 'Assinatura criada com sucesso',
            assinatura: Object.assign(Object.assign({}, novaAssinatura.toObject()), { plano })
        });
    }
    catch (error) {
        console.error('Erro ao criar assinatura:', error);
        res.status(500).json({
            message: 'Erro interno do servidor',
            details: error.message
        });
    }
});
exports.criarAssinatura = criarAssinatura;
// Cancelar assinatura
const cancelarAssinatura = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { motivo } = req.body;
        const assinatura = yield Assinatura_1.default.buscarPorUsuario(userId);
        if (!assinatura) {
            return res.status(404).json({ message: 'Assinatura ativa não encontrada' });
        }
        // Cancelar no ASAAS se existir ID
        if (assinatura.asaasSubscriptionId) {
            try {
                yield asaas_service_1.default.cancelSubscription(assinatura.asaasSubscriptionId);
                yield assinatura.adicionarHistorico('CANCELAMENTO_ASAAS', 'Assinatura cancelada no ASAAS com sucesso');
            }
            catch (asaasError) {
                console.error('Erro ao cancelar no ASAAS:', asaasError);
                yield assinatura.adicionarHistorico('ERRO_CANCELAMENTO_ASAAS', `Erro ao cancelar no ASAAS: ${asaasError.message}`);
            }
        }
        // Cancelar localmente
        yield assinatura.cancelar(motivo || 'Cancelamento solicitado pelo usuário');
        res.json({
            message: 'Assinatura cancelada com sucesso',
            assinatura: assinatura.toObject()
        });
    }
    catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        res.status(500).json({
            message: 'Erro ao cancelar assinatura',
            details: error.message
        });
    }
});
exports.cancelarAssinatura = cancelarAssinatura;
// Obter histórico de transações do usuário
const getHistoricoTransacoes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { limite = 10 } = req.query;
        const transacoes = yield Transacao_1.default.buscarPorUsuario(userId, Number(limite));
        res.json({ transacoes });
    }
    catch (error) {
        console.error('Erro ao obter histórico de transações:', error);
        res.status(500).json({ message: 'Erro ao obter histórico de transações' });
    }
});
exports.getHistoricoTransacoes = getHistoricoTransacoes;
// Reprocessar pagamento
const reprocessarPagamento = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transacaoId } = req.params;
        const transacao = yield Transacao_1.default.findById(transacaoId)
            .populate('userId', 'name email')
            .populate('assinaturaId');
        if (!transacao) {
            return res.status(404).json({ message: 'Transação não encontrada' });
        }
        if (transacao.status !== 'overdue' && transacao.status !== 'pending') {
            return res.status(400).json({ message: 'Transação não pode ser reprocessada' });
        }
        // Tentar reprocessar no ASAAS
        try {
            const paymentStatus = yield asaas_service_1.default.getPaymentStatus(transacao.asaasPaymentId);
            // Atualizar status local baseado no ASAAS
            if (paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') {
                yield transacao.receberPagamento(new Date());
                yield transacao.adicionarWebhookEvent('REPROCESSAMENTO_SUCESSO', { status: paymentStatus });
                res.json({
                    message: 'Pagamento confirmado com sucesso',
                    transacao: transacao.toObject()
                });
            }
            else {
                res.json({
                    message: 'Pagamento ainda pendente',
                    status: paymentStatus,
                    transacao: transacao.toObject()
                });
            }
        }
        catch (asaasError) {
            console.error('Erro ao reprocessar no ASAAS:', asaasError);
            yield transacao.adicionarWebhookEvent('ERRO_REPROCESSAMENTO', { error: asaasError.message });
            res.status(400).json({
                message: 'Erro ao reprocessar pagamento',
                details: asaasError.message
            });
        }
    }
    catch (error) {
        console.error('Erro ao reprocessar pagamento:', error);
        res.status(500).json({
            message: 'Erro interno do servidor',
            details: error.message
        });
    }
});
exports.reprocessarPagamento = reprocessarPagamento;
