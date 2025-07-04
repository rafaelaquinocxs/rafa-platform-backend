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
exports.processarWebhook = void 0;
const asaas_service_1 = __importDefault(require("../services/asaas.service"));
const Assinatura_1 = __importDefault(require("../models/Assinatura"));
const Transacao_1 = __importDefault(require("../models/Transacao"));
// Processar webhook do ASAAS
const processarWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = req.headers['asaas-access-token'];
        const payload = JSON.stringify(req.body);
        // Validar assinatura do webhook
        if (!asaas_service_1.default.validateWebhook(payload, signature)) {
            console.error('[WEBHOOK] Assinatura inválida');
            return res.status(401).json({ message: 'Assinatura inválida' });
        }
        const webhookEvent = req.body;
        console.log(`[WEBHOOK] Evento recebido: ${webhookEvent.event}`);
        // Processar diferentes tipos de eventos
        switch (webhookEvent.event) {
            case 'PAYMENT_CREATED':
                yield processarPagamentoCriado(webhookEvent);
                break;
            case 'PAYMENT_AWAITING_PAYMENT':
                yield processarPagamentoAguardando(webhookEvent);
                break;
            case 'PAYMENT_CONFIRMED':
                yield processarPagamentoConfirmado(webhookEvent);
                break;
            case 'PAYMENT_RECEIVED':
                yield processarPagamentoRecebido(webhookEvent);
                break;
            case 'PAYMENT_OVERDUE':
                yield processarPagamentoVencido(webhookEvent);
                break;
            case 'PAYMENT_DELETED':
                yield processarPagamentoDeletado(webhookEvent);
                break;
            case 'PAYMENT_RESTORED':
                yield processarPagamentoRestaurado(webhookEvent);
                break;
            case 'PAYMENT_REFUNDED':
                yield processarPagamentoReembolsado(webhookEvent);
                break;
            case 'PAYMENT_RECEIVED_IN_CASH':
                yield processarPagamentoRecebidoDinheiro(webhookEvent);
                break;
            case 'PAYMENT_CHARGEBACK_REQUESTED':
                yield processarChargebackSolicitado(webhookEvent);
                break;
            case 'PAYMENT_CHARGEBACK_DISPUTE':
                yield processarChargebackDisputa(webhookEvent);
                break;
            case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
                yield processarAguardandoReversaoChargeback(webhookEvent);
                break;
            case 'PAYMENT_DUNNING_REQUESTED':
                yield processarCobrancaSolicitada(webhookEvent);
                break;
            case 'PAYMENT_DUNNING_RECEIVED':
                yield processarCobrancaRecebida(webhookEvent);
                break;
            case 'PAYMENT_BANK_SLIP_VIEWED':
                yield processarBoletoVisualizado(webhookEvent);
                break;
            case 'PAYMENT_CHECKOUT_VIEWED':
                yield processarCheckoutVisualizado(webhookEvent);
                break;
            // Eventos de assinatura
            case 'SUBSCRIPTION_CREATED':
                yield processarAssinaturaCriada(webhookEvent);
                break;
            case 'SUBSCRIPTION_UPDATED':
                yield processarAssinaturaAtualizada(webhookEvent);
                break;
            case 'SUBSCRIPTION_DELETED':
                yield processarAssinaturaDeletada(webhookEvent);
                break;
            default:
                console.log(`[WEBHOOK] Evento não tratado: ${webhookEvent.event}`);
                yield logEventoNaoTratado(webhookEvent);
        }
        res.status(200).json({ message: 'Webhook processado com sucesso' });
    }
    catch (error) {
        console.error('[WEBHOOK] Erro ao processar webhook:', error);
        res.status(500).json({
            message: 'Erro ao processar webhook',
            details: error.message
        });
    }
});
exports.processarWebhook = processarWebhook;
// Processar pagamento criado
function processarPagamentoCriado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const payment = event.payment;
            // Buscar assinatura relacionada
            let assinatura = null;
            if (payment.subscription) {
                assinatura = yield Assinatura_1.default.findOne({ asaasSubscriptionId: payment.subscription });
            }
            else if (payment.externalReference) {
                assinatura = yield Assinatura_1.default.findById(payment.externalReference);
            }
            if (!assinatura) {
                console.error(`[WEBHOOK] Assinatura não encontrada para pagamento ${payment.id}`);
                return;
            }
            // Criar transação no banco de dados
            const transacao = new Transacao_1.default({
                userId: assinatura.userId,
                assinaturaId: assinatura._id,
                asaasPaymentId: payment.id,
                asaasCustomerId: payment.customer,
                tipo: 'assinatura',
                status: 'pending',
                valor: payment.value,
                valorLiquido: payment.netValue || 0,
                metodoPagamento: payment.billingType,
                dataVencimento: new Date(payment.dueDate),
                descricao: payment.description || `Pagamento ${assinatura.planoId}`,
                referencia: payment.externalReference,
                numeroFatura: payment.invoiceNumber,
                linkFatura: payment.invoiceUrl
            });
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_CREATED', event);
            // Atualizar assinatura
            yield assinatura.adicionarHistorico('PAGAMENTO_CRIADO', `Pagamento criado no ASAAS: ${payment.id}`, payment.value);
            console.log(`[WEBHOOK] Pagamento criado: ${payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento criado:', error);
        }
    });
}
// Processar pagamento aguardando
function processarPagamentoAguardando(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'pending';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_AWAITING_PAYMENT', event);
            console.log(`[WEBHOOK] Pagamento aguardando: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento aguardando:', error);
        }
    });
}
// Processar pagamento confirmado
function processarPagamentoConfirmado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id })
                .populate('assinaturaId');
            if (!transacao)
                return;
            // Atualizar transação
            yield transacao.confirmarPagamento(new Date(event.payment.paymentDate || event.payment.clientPaymentDate || Date.now()), event.payment.netValue, event.payment.value - event.payment.netValue);
            yield transacao.adicionarWebhookEvent('PAYMENT_CONFIRMED', event);
            // Atualizar assinatura
            const assinatura = transacao.assinaturaId;
            if (assinatura) {
                assinatura.status = 'ativa';
                assinatura.ultimaCobranca = new Date();
                // Calcular próxima cobrança
                const proximaCobranca = new Date(assinatura.proximoVencimento);
                if (assinatura.ciclo === 'MONTHLY') {
                    proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
                }
                else if (assinatura.ciclo === 'QUARTERLY') {
                    proximaCobranca.setMonth(proximaCobranca.getMonth() + 3);
                }
                else if (assinatura.ciclo === 'YEARLY') {
                    proximaCobranca.setFullYear(proximaCobranca.getFullYear() + 1);
                }
                assinatura.proximaCobranca = proximaCobranca;
                yield assinatura.save();
                yield assinatura.adicionarHistorico('PAGAMENTO_CONFIRMADO', `Pagamento confirmado: ${event.payment.id}`, event.payment.value);
            }
            console.log(`[WEBHOOK] Pagamento confirmado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento confirmado:', error);
        }
    });
}
// Processar pagamento recebido
function processarPagamentoRecebido(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            yield transacao.receberPagamento(new Date(event.payment.paymentDate || event.payment.clientPaymentDate || Date.now()));
            yield transacao.adicionarWebhookEvent('PAYMENT_RECEIVED', event);
            console.log(`[WEBHOOK] Pagamento recebido: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento recebido:', error);
        }
    });
}
// Processar pagamento vencido
function processarPagamentoVencido(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id })
                .populate('assinaturaId');
            if (!transacao)
                return;
            // Marcar transação como vencida
            yield transacao.marcarVencida();
            yield transacao.adicionarWebhookEvent('PAYMENT_OVERDUE', event);
            // Suspender assinatura se muitas tentativas
            const assinatura = transacao.assinaturaId;
            if (assinatura && transacao.tentativas >= 3) {
                yield assinatura.suspender('Pagamento em atraso - múltiplas tentativas falharam');
            }
            console.log(`[WEBHOOK] Pagamento vencido: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento vencido:', error);
        }
    });
}
// Processar pagamento deletado
function processarPagamentoDeletado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.observacoes = 'Pagamento deletado no ASAAS';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_DELETED', event);
            console.log(`[WEBHOOK] Pagamento deletado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento deletado:', error);
        }
    });
}
// Processar pagamento restaurado
function processarPagamentoRestaurado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'pending';
            transacao.observacoes = 'Pagamento restaurado no ASAAS';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_RESTORED', event);
            console.log(`[WEBHOOK] Pagamento restaurado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento restaurado:', error);
        }
    });
}
// Processar pagamento reembolsado
function processarPagamentoReembolsado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            yield transacao.processarReembolso('Reembolso processado pelo ASAAS');
            yield transacao.adicionarWebhookEvent('PAYMENT_REFUNDED', event);
            console.log(`[WEBHOOK] Pagamento reembolsado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento reembolsado:', error);
        }
    });
}
// Processar pagamento recebido em dinheiro
function processarPagamentoRecebidoDinheiro(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'received_in_cash';
            transacao.dataPagamento = new Date();
            transacao.dataConfirmacao = new Date();
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_RECEIVED_IN_CASH', event);
            console.log(`[WEBHOOK] Pagamento recebido em dinheiro: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar pagamento recebido em dinheiro:', error);
        }
    });
}
// Processar chargeback solicitado
function processarChargebackSolicitado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'chargeback_requested';
            transacao.motivoFalha = 'Chargeback solicitado';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_CHARGEBACK_REQUESTED', event);
            console.log(`[WEBHOOK] Chargeback solicitado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar chargeback solicitado:', error);
        }
    });
}
// Processar disputa de chargeback
function processarChargebackDisputa(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'chargeback_dispute';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_CHARGEBACK_DISPUTE', event);
            console.log(`[WEBHOOK] Disputa de chargeback: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar disputa de chargeback:', error);
        }
    });
}
// Processar aguardando reversão de chargeback
function processarAguardandoReversaoChargeback(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'awaiting_chargeback_reversal';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_AWAITING_CHARGEBACK_REVERSAL', event);
            console.log(`[WEBHOOK] Aguardando reversão de chargeback: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar aguardando reversão de chargeback:', error);
        }
    });
}
// Processar cobrança solicitada
function processarCobrancaSolicitada(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'dunning_requested';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_DUNNING_REQUESTED', event);
            console.log(`[WEBHOOK] Cobrança solicitada: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar cobrança solicitada:', error);
        }
    });
}
// Processar cobrança recebida
function processarCobrancaRecebida(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            transacao.status = 'dunning_received';
            yield transacao.save();
            yield transacao.adicionarWebhookEvent('PAYMENT_DUNNING_RECEIVED', event);
            console.log(`[WEBHOOK] Cobrança recebida: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar cobrança recebida:', error);
        }
    });
}
// Processar boleto visualizado
function processarBoletoVisualizado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            yield transacao.adicionarWebhookEvent('PAYMENT_BANK_SLIP_VIEWED', event);
            console.log(`[WEBHOOK] Boleto visualizado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar boleto visualizado:', error);
        }
    });
}
// Processar checkout visualizado
function processarCheckoutVisualizado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.payment)
            return;
        try {
            const transacao = yield Transacao_1.default.findOne({ asaasPaymentId: event.payment.id });
            if (!transacao)
                return;
            yield transacao.adicionarWebhookEvent('PAYMENT_CHECKOUT_VIEWED', event);
            console.log(`[WEBHOOK] Checkout visualizado: ${event.payment.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar checkout visualizado:', error);
        }
    });
}
// Processar assinatura criada
function processarAssinaturaCriada(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.subscription)
            return;
        try {
            const subscription = event.subscription;
            // Buscar assinatura pelo external reference
            const assinatura = yield Assinatura_1.default.findById(subscription.externalReference);
            if (!assinatura)
                return;
            yield assinatura.adicionarHistorico('WEBHOOK_ASSINATURA_CRIADA', `Webhook de assinatura criada recebido: ${subscription.id}`);
            console.log(`[WEBHOOK] Assinatura criada: ${subscription.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar assinatura criada:', error);
        }
    });
}
// Processar assinatura atualizada
function processarAssinaturaAtualizada(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.subscription)
            return;
        try {
            const subscription = event.subscription;
            const assinatura = yield Assinatura_1.default.findOne({ asaasSubscriptionId: subscription.id });
            if (!assinatura)
                return;
            // Atualizar dados da assinatura
            assinatura.proximoVencimento = new Date(subscription.nextDueDate);
            assinatura.valorMensal = subscription.value;
            if (subscription.status === 'ACTIVE') {
                assinatura.status = 'ativa';
            }
            else if (subscription.status === 'EXPIRED') {
                assinatura.status = 'vencida';
            }
            yield assinatura.save();
            yield assinatura.adicionarHistorico('WEBHOOK_ASSINATURA_ATUALIZADA', `Webhook de assinatura atualizada recebido: ${subscription.id}`);
            console.log(`[WEBHOOK] Assinatura atualizada: ${subscription.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar assinatura atualizada:', error);
        }
    });
}
// Processar assinatura deletada
function processarAssinaturaDeletada(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.subscription)
            return;
        try {
            const subscription = event.subscription;
            const assinatura = yield Assinatura_1.default.findOne({ asaasSubscriptionId: subscription.id });
            if (!assinatura)
                return;
            yield assinatura.cancelar('Assinatura cancelada via webhook do ASAAS');
            console.log(`[WEBHOOK] Assinatura deletada: ${subscription.id}`);
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao processar assinatura deletada:', error);
        }
    });
}
// Log de evento não tratado
function logEventoNaoTratado(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`[WEBHOOK] Evento não tratado: ${event.event}`, JSON.stringify(event, null, 2));
            // Aqui você pode implementar um sistema de log mais robusto
            // Por exemplo, salvar em uma collection específica para eventos não tratados
        }
        catch (error) {
            console.error('[WEBHOOK] Erro ao logar evento não tratado:', error);
        }
    });
}
