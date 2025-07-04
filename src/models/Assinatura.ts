import mongoose from 'mongoose';

export interface IAssinatura extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  planoId: string;
  asaasCustomerId: string;
  asaasSubscriptionId?: string;
  status: 'ativa' | 'cancelada' | 'suspensa' | 'pendente' | 'vencida';
  dataInicio: Date;
  dataFim: Date;
  proximoVencimento: Date;
  valorMensal: number;
  metodoPagamento: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  ciclo: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  tentativasPagamento: number;
  ultimaCobranca?: Date;
  proximaCobranca?: Date;
  dadosCartao?: {
    bandeira: string;
    ultimosDigitos: string;
    nomePortador: string;
  };
  historico: Array<{
    data: Date;
    evento: string;
    detalhes: string;
    valor?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AssinaturaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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
AssinaturaSchema.methods.adicionarHistorico = function(evento: string, detalhes: string, valor?: number) {
  this.historico.push({
    data: new Date(),
    evento,
    detalhes,
    valor
  });
  return this.save();
};

AssinaturaSchema.methods.ativar = function() {
  this.status = 'ativa';
  return this.adicionarHistorico('ATIVACAO', 'Assinatura ativada com sucesso');
};

AssinaturaSchema.methods.cancelar = function(motivo: string = 'Cancelamento solicitado pelo usuário') {
  this.status = 'cancelada';
  return this.adicionarHistorico('CANCELAMENTO', motivo);
};

AssinaturaSchema.methods.suspender = function(motivo: string = 'Pagamento em atraso') {
  this.status = 'suspensa';
  return this.adicionarHistorico('SUSPENSAO', motivo);
};

AssinaturaSchema.methods.renovar = function(proximaData: Date) {
  this.proximoVencimento = proximaData;
  this.tentativasPagamento = 0;
  return this.adicionarHistorico('RENOVACAO', `Assinatura renovada até ${proximaData.toLocaleDateString('pt-BR')}`);
};

// Métodos estáticos
AssinaturaSchema.statics.buscarPorUsuario = function(userId: string) {
  return this.findOne({ userId, status: { $in: ['ativa', 'pendente'] } })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

AssinaturaSchema.statics.buscarVencidas = function() {
  const hoje = new Date();
  return this.find({
    status: 'ativa',
    proximoVencimento: { $lt: hoje }
  }).populate('userId', 'name email');
};

AssinaturaSchema.statics.buscarParaCobranca = function() {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  
  return this.find({
    status: 'ativa',
    proximaCobranca: { $lte: amanha }
  }).populate('userId', 'name email');
};

// Middleware pre-save
AssinaturaSchema.pre('save', function(next) {
  if (this.isNew) {
    this.adicionarHistorico('CRIACAO', 'Assinatura criada', this.valorMensal);
  }
  next();
});

// Virtual para verificar se está vencida
AssinaturaSchema.virtual('estaVencida').get(function() {
  return this.status === 'ativa' && this.proximoVencimento < new Date();
});

// Virtual para dias até vencimento
AssinaturaSchema.virtual('diasAteVencimento').get(function() {
  const hoje = new Date();
  const vencimento = new Date(this.proximoVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Configurar virtuals no JSON
AssinaturaSchema.set('toJSON', { virtuals: true });
AssinaturaSchema.set('toObject', { virtuals: true });

export default mongoose.model<IAssinatura>('Assinatura', AssinaturaSchema);

