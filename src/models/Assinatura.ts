import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface com os campos da assinatura + métodos
export interface IAssinatura extends Document {
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

  // Métodos personalizados
  adicionarHistorico(evento: string, detalhes: string, valor?: number): Promise<IAssinatura>;
  ativar(): Promise<IAssinatura>;
  cancelar(motivo?: string): Promise<IAssinatura>;
  suspender(motivo?: string): Promise<IAssinatura>;
  renovar(proximaData: Date): Promise<IAssinatura>;
}

// Interface para métodos estáticos
export interface AssinaturaModel extends Model<IAssinatura> {
  buscarPorUsuario(userId: string): Promise<IAssinatura | null>;
  buscarVencidas(): Promise<IAssinatura[]>;
  buscarParaCobranca(): Promise<IAssinatura[]>;
}

const AssinaturaSchema = new Schema<IAssinatura, AssinaturaModel>({
  userId: {
    type: Schema.Types.ObjectId,
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
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, required: true },
  proximoVencimento: { type: Date, required: true, index: true },
  valorMensal: { type: Number, required: true, min: 0 },
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
  tentativasPagamento: { type: Number, default: 0, min: 0 },
  ultimaCobranca: { type: Date },
  proximaCobranca: { type: Date, index: true },
  dadosCartao: {
    bandeira: String,
    ultimosDigitos: String,
    nomePortador: String
  },
  historico: [{
    data: { type: Date, default: Date.now },
    evento: { type: String, required: true },
    detalhes: { type: String, required: true },
    valor: { type: Number }
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
AssinaturaSchema.methods.adicionarHistorico = async function (
  evento: string,
  detalhes: string,
  valor?: number
): Promise<IAssinatura> {
  this.historico.push({
    data: new Date(),
    evento,
    detalhes,
    valor
  });
  return this.save();
};

AssinaturaSchema.methods.ativar = function (): Promise<IAssinatura> {
  this.status = 'ativa';
  return this.adicionarHistorico('ATIVACAO', 'Assinatura ativada com sucesso');
};

AssinaturaSchema.methods.cancelar = function (motivo = 'Cancelamento solicitado pelo usuário'): Promise<IAssinatura> {
  this.status = 'cancelada';
  return this.adicionarHistorico('CANCELAMENTO', motivo);
};

AssinaturaSchema.methods.suspender = function (motivo = 'Pagamento em atraso'): Promise<IAssinatura> {
  this.status = 'suspensa';
  return this.adicionarHistorico('SUSPENSAO', motivo);
};

AssinaturaSchema.methods.renovar = function (proximaData: Date): Promise<IAssinatura> {
  this.proximoVencimento = proximaData;
  this.tentativasPagamento = 0;
  return this.adicionarHistorico('RENOVACAO', `Assinatura renovada até ${proximaData.toLocaleDateString('pt-BR')}`);
};

// Métodos estáticos
AssinaturaSchema.statics.buscarPorUsuario = function (userId: string): Promise<IAssinatura | null> {
  return this.findOne({ userId, status: { $in: ['ativa', 'pendente'] } })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

AssinaturaSchema.statics.buscarVencidas = function (): Promise<IAssinatura[]> {
  const hoje = new Date();
  return this.find({
    status: 'ativa',
    proximoVencimento: { $lt: hoje }
  }).populate('userId', 'name email');
};

AssinaturaSchema.statics.buscarParaCobranca = function (): Promise<IAssinatura[]> {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  return this.find({
    status: 'ativa',
    proximaCobranca: { $lte: amanha }
  }).populate('userId', 'name email');
};

// Middleware pre-save
AssinaturaSchema.pre<IAssinatura>('save', async function (next) {
  if (this.isNew) {
    await this.adicionarHistorico('CRIACAO', 'Assinatura criada', this.valorMensal);
  }
  next();
});

// Virtuals
AssinaturaSchema.virtual('estaVencida').get(function (this: IAssinatura) {
  return this.status === 'ativa' && this.proximoVencimento < new Date();
});

AssinaturaSchema.virtual('diasAteVencimento').get(function (this: IAssinatura) {
  const hoje = new Date();
  const vencimento = new Date(this.proximoVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

AssinaturaSchema.set('toJSON', { virtuals: true });
AssinaturaSchema.set('toObject', { virtuals: true });

export default mongoose.model<IAssinatura, AssinaturaModel>('Assinatura', AssinaturaSchema);
