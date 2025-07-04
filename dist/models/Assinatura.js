"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const AssinaturaSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planoId: {
        type: String,
        required: true,
        enum: ['mensal', 'trimestral', 'semestral', 'anual']
    },
    asaasCustomerId: {
        type: String,
        required: true,
        index: true
    },
    asaasSubscriptionId: {
        type: String,
        index: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['ativa', 'cancelada', 'suspensa', 'pendente', 'vencida'],
        default: 'pendente',
        index: true
    },
    dataInicio: {
        type: Date,
        required: true
    },
    dataFim: {
        type: Date,
        required: true
    },
    proximoVencimento: {
        type: Date,
        required: true,
        index: true
    },
    valorMensal: {
        type: Number,
        required: true,
        min: 0
    },
    metodoPagamento: {
        type: String,
        enum: ['CREDIT_CARD', 'BOLETO', 'PIX'],
        required: true
    },
    ciclo: {
        type: String,
        enum: ['MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'],
        required: true
    },
    tentativasPagamento: {
        type: Number,
        default: 0,
        min: 0
    },
    ultimaCobranca: {
        type: Date
    },
    proximaCobranca: {
        type: Date,
        index: true
    },
    dadosCartao: {
        bandeira: String,
        ultimosDigitos: String,
        nomePortador: String
    },
    historico: [{
            data: {
                type: Date,
                default: Date.now
            },
            evento: {
                type: String,
                required: true
            },
            detalhes: {
                type: String,
                required: true
            },
            valor: {
                type: Number
            }
        }]
}, {
    timestamps: true,
    collection: 'assinaturas'
});
// Índices compostos
AssinaturaSchema.index({ userId: 1, status: 1 });
AssinaturaSchema.index({ asaasCustomerId: 1, status: 1 });
AssinaturaSchema.index({ proximoVencimento: 1, status: 1 });
// Métodos de instância
AssinaturaSchema.methods.adicionarHistorico = function (evento, detalhes, valor) {
    this.historico.push({
        data: new Date(),
        evento,
        detalhes,
        valor
    });
    return this.save();
};
AssinaturaSchema.methods.ativar = function () {
    this.status = 'ativa';
    return this.adicionarHistorico('ATIVACAO', 'Assinatura ativada com sucesso');
};
AssinaturaSchema.methods.cancelar = function (motivo = 'Cancelamento solicitado pelo usuário') {
    this.status = 'cancelada';
    return this.adicionarHistorico('CANCELAMENTO', motivo);
};
AssinaturaSchema.methods.suspender = function (motivo = 'Pagamento em atraso') {
    this.status = 'suspensa';
    return this.adicionarHistorico('SUSPENSAO', motivo);
};
AssinaturaSchema.methods.renovar = function (proximaData) {
    this.proximoVencimento = proximaData;
    this.tentativasPagamento = 0;
    return this.adicionarHistorico('RENOVACAO', `Assinatura renovada até ${proximaData.toLocaleDateString('pt-BR')}`);
};
// Métodos estáticos
AssinaturaSchema.statics.buscarPorUsuario = function (userId) {
    return this.findOne({ userId, status: { $in: ['ativa', 'pendente'] } })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
};
AssinaturaSchema.statics.buscarVencidas = function () {
    const hoje = new Date();
    return this.find({
        status: 'ativa',
        proximoVencimento: { $lt: hoje }
    }).populate('userId', 'name email');
};
AssinaturaSchema.statics.buscarParaCobranca = function () {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return this.find({
        status: 'ativa',
        proximaCobranca: { $lte: amanha }
    }).populate('userId', 'name email');
};
// Middleware pre-save
AssinaturaSchema.pre('save', function (next) {
    if (this.isNew) {
        this.adicionarHistorico('CRIACAO', 'Assinatura criada', this.valorMensal);
    }
    next();
});
// Virtual para verificar se está vencida
AssinaturaSchema.virtual('estaVencida').get(function () {
    return this.status === 'ativa' && this.proximoVencimento < new Date();
});
// Virtual para dias até vencimento
AssinaturaSchema.virtual('diasAteVencimento').get(function () {
    const hoje = new Date();
    const vencimento = new Date(this.proximoVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
// Configurar virtuals no JSON
AssinaturaSchema.set('toJSON', { virtuals: true });
AssinaturaSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Assinatura', AssinaturaSchema);
