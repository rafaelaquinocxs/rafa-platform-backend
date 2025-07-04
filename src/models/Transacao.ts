import mongoose from 'mongoose';

export interface ITransacao extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  assinaturaId: mongoose.Types.ObjectId;
  asaasPaymentId: string;
  asaasCustomerId: string;
  tipo: 'assinatura' | 'pagamento_avulso' | 'reembolso';
  status: 'pending' | 'confirmed' | 'received' | 'overdue' | 'refunded' | 'received_in_cash' | 'refund_requested' | 'chargeback_requested' | 'chargeback_dispute' | 'awaiting_chargeback_reversal' | 'dunning_requested' | 'dunning_received' | 'awaiting_risk_analysis';
  valor: number;
  valorLiquido: number;
  taxaAsaas: number;
  metodoPagamento: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  dataVencimento: Date;
  dataPagamento?: Date;
  dataConfirmacao?: Date;
  descricao: string;
  referencia?: string;
  numeroFatura?: string;
  linkFatura?: string;
  linkBoleto?: string;
  codigoPix?: string;
  qrCodePix?: string;
  dadosCartao?: {
    bandeira: string;
    ultimosDigitos: string;
    nomePortador: string;
  };
  tentativas: number;
  proximaTentativa?: Date;
  motivoFalha?: string;
  webhookEvents: Array<{
    evento: string;
    data: Date;
    payload: any;
  }>;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransacaoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assinaturaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assinatura',
    required: true,
    index: true
  },
  asaasPaymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  asaasCustomerId: {
    type: String,
    required: true,
    index: true
  },
  tipo: {
    type: String,
    enum: ['assinatura', 'pagamento_avulso', 'reembolso'],
    default: 'assinatura',
    index: true
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed', 
      'received',
      'overdue',
      'refunded',
      'received_in_cash',
      'refund_requested',
      'chargeback_requested',
      'chargeback_dispute',
      'awaiting_chargeback_reversal',
      'dunning_requested',
      'dunning_received',
      'awaiting_risk_analysis'
    ],
    default: 'pending',
    index: true
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  valorLiquido: {
    type: Number,
    default: 0,
    min: 0
  },
  taxaAsaas: {
    type: Number,
    default: 0,
    min: 0
  },
  metodoPagamento: {
    type: String,
    enum: ['CREDIT_CARD', 'BOLETO', 'PIX'],
    required: true,
    index: true
  },
  dataVencimento: {
    type: Date,
    required: true,
    index: true
  },
  dataPagamento: {
    type: Date,
    index: true
  },
  dataConfirmacao: {
    type: Date,
    index: true
  },
  descricao: {
    type: String,
    required: true
  },
  referencia: {
    type: String,
    index: true
  },
  numeroFatura: {
    type: String
  },
  linkFatura: {
    type: String
  },
  linkBoleto: {
    type: String
  },
  codigoPix: {
    type: String
  },
  qrCodePix: {
    type: String
  },
  dadosCartao: {
    bandeira: String,
    ultimosDigitos: String,
    nomePortador: String
  },
  tentativas: {
    type: Number,
    default: 0,
    min: 0
  },
  proximaTentativa: {
    type: Date,
    index: true
  },
  motivoFalha: {
    type: String
  },
  webhookEvents: [{
    evento: {
      type: String,
      required: true
    },
    data: {
      type: Date,
      default: Date.now
    },
    payload: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  observacoes: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'transacoes'
});

// Índices compostos
TransacaoSchema.index({ userId: 1, status: 1 });
TransacaoSchema.index({ assinaturaId: 1, status: 1 });
TransacaoSchema.index({ dataVencimento: 1, status: 1 });
TransacaoSchema.index({ dataPagamento: 1, status: 1 });
TransacaoSchema.index({ metodoPagamento: 1, status: 1 });

// Métodos de instância
TransacaoSchema.methods.adicionarWebhookEvent = function(evento: string, payload: any) {
  this.webhookEvents.push({
    evento,
    data: new Date(),
    payload
  });
  return this.save();
};

TransacaoSchema.methods.confirmarPagamento = function(dataPagamento: Date, valorLiquido: number, taxaAsaas: number) {
  this.status = 'confirmed';
  this.dataPagamento = dataPagamento;
  this.dataConfirmacao = new Date();
  this.valorLiquido = valorLiquido;
  this.taxaAsaas = taxaAsaas;
  return this.save();
};

TransacaoSchema.methods.receberPagamento = function(dataPagamento: Date) {
  this.status = 'received';
  this.dataPagamento = dataPagamento;
  if (!this.dataConfirmacao) {
    this.dataConfirmacao = new Date();
  }
  return this.save();
};

TransacaoSchema.methods.marcarVencida = function() {
  this.status = 'overdue';
  this.tentativas += 1;
  
  // Próxima tentativa em 3 dias
  const proximaTentativa = new Date();
  proximaTentativa.setDate(proximaTentativa.getDate() + 3);
  this.proximaTentativa = proximaTentativa;
  
  return this.save();
};

TransacaoSchema.methods.processarReembolso = function(motivo: string) {
  this.status = 'refunded';
  this.observacoes = motivo;
  return this.save();
};

// Métodos estáticos
TransacaoSchema.statics.buscarPorUsuario = function(userId: string, limite: number = 10) {
  return this.find({ userId })
    .populate('assinaturaId', 'planoId')
    .sort({ createdAt: -1 })
    .limit(limite);
};

TransacaoSchema.statics.buscarVencidas = function() {
  const hoje = new Date();
  return this.find({
    status: 'pending',
    dataVencimento: { $lt: hoje }
  }).populate('userId', 'name email')
    .populate('assinaturaId', 'planoId');
};

TransacaoSchema.statics.buscarParaReprocessar = function() {
  const agora = new Date();
  return this.find({
    status: 'overdue',
    tentativas: { $lt: 3 },
    proximaTentativa: { $lte: agora }
  }).populate('userId', 'name email')
    .populate('assinaturaId', 'planoId asaasSubscriptionId');
};

TransacaoSchema.statics.relatorioFinanceiro = function(dataInicio: Date, dataFim: Date) {
  return this.aggregate([
    {
      $match: {
        dataConfirmacao: {
          $gte: dataInicio,
          $lte: dataFim
        },
        status: { $in: ['confirmed', 'received'] }
      }
    },
    {
      $group: {
        _id: {
          ano: { $year: '$dataConfirmacao' },
          mes: { $month: '$dataConfirmacao' },
          metodoPagamento: '$metodoPagamento'
        },
        totalTransacoes: { $sum: 1 },
        valorTotal: { $sum: '$valor' },
        valorLiquido: { $sum: '$valorLiquido' },
        taxasTotal: { $sum: '$taxaAsaas' }
      }
    },
    {
      $sort: {
        '_id.ano': 1,
        '_id.mes': 1,
        '_id.metodoPagamento': 1
      }
    }
  ]);
};

// Virtual para verificar se está vencida
TransacaoSchema.virtual('estaVencida').get(function() {
  return this.status === 'pending' && this.dataVencimento < new Date();
});

// Virtual para dias até vencimento
TransacaoSchema.virtual('diasAteVencimento').get(function() {
  const hoje = new Date();
  const vencimento = new Date(this.dataVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual para status em português
TransacaoSchema.virtual('statusPtBr').get(function() {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'received': 'Recebido',
    'overdue': 'Vencido',
    'refunded': 'Reembolsado',
    'received_in_cash': 'Recebido em Dinheiro',
    'refund_requested': 'Reembolso Solicitado',
    'chargeback_requested': 'Chargeback Solicitado',
    'chargeback_dispute': 'Disputa de Chargeback',
    'awaiting_chargeback_reversal': 'Aguardando Reversão de Chargeback',
    'dunning_requested': 'Cobrança Solicitada',
    'dunning_received': 'Cobrança Recebida',
    'awaiting_risk_analysis': 'Aguardando Análise de Risco'
  };
  return statusMap[this.status] || this.status;
});

// Configurar virtuals no JSON
TransacaoSchema.set('toJSON', { virtuals: true });
TransacaoSchema.set('toObject', { virtuals: true });

interface TransacaoModel extends mongoose.Model<ITransacao> {
  buscarPorUsuario(userId: string, limite?: number): Promise<ITransacao[]>;
  buscarVencidas(): Promise<ITransacao[]>;
  buscarParaReprocessar(): Promise<ITransacao[]>;
  relatorioFinanceiro(dataInicio: Date, dataFim: Date): Promise<any[]>;
}

export default mongoose.model<ITransacao, TransacaoModel>('Transacao', TransacaoSchema);

