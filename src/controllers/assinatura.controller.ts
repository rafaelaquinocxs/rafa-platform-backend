import { Request, Response } from 'express';
import User from '../models/User';
import Assinatura from '../models/Assinatura';
import Transacao from '../models/Transacao';
import asaasService from '../services/asaas.service';
import { v4 as uuidv4 } from 'uuid';

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

// Função auxiliar para verificar se um método existe no objeto
const hasMethod = (obj: any, methodName: string): boolean => {
  return obj && typeof obj[methodName] === 'function';
};

// Obter todos os planos disponíveis
export const getPlanos = async (req: Request, res: Response) => {
  try {
    res.json({ planos });
  } catch (error) {
    console.error('Erro ao obter planos:', error);
    res.status(500).json({ message: 'Erro ao obter planos' });
  }
};

// Obter um plano específico
export const getPlano = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const plano = planos.find(p => p.id === id);
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    res.json({ plano });
  } catch (error) {
    console.error('Erro ao obter plano:', error);
    res.status(500).json({ message: 'Erro ao obter plano' });
  }
};

// Obter assinatura do usuário
export const getAssinaturaUsuario = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const assinatura = await Assinatura.buscarPorUsuario(userId);
    if (!assinatura) {
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    // Obter detalhes do plano
    const plano = planos.find(p => p.id === assinatura.planoId);

    res.json({ 
      assinatura: {
        ...assinatura.toObject(),
        plano
      } 
    });
  } catch (error) {
    console.error('Erro ao obter assinatura:', error);
    res.status(500).json({ message: 'Erro ao obter assinatura' });
  }
};

// Criar nova assinatura com ASAAS
export const criarAssinatura = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      planoId, 
      metodoPagamento,
      dadosCartao,
      dadosUsuario 
    } = req.body;
    
    // Verificar se o plano existe
    const plano = planos.find(p => p.id === planoId);
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const assinaturaExistente = await Assinatura.buscarPorUsuario(userId);
    if (assinaturaExistente && assinaturaExistente.status === 'ativa') {
      return res.status(400).json({ message: 'Usuário já possui uma assinatura ativa' });
    }

    // Criar ou atualizar cliente no ASAAS
    let asaasCustomerId = '';
    
    try {
      // Tentar buscar cliente existente primeiro
      if (assinaturaExistente?.asaasCustomerId) {
        asaasCustomerId = assinaturaExistente.asaasCustomerId;
        await asaasService.getCustomer(asaasCustomerId);
      } else {
        throw new Error('Cliente não encontrado');
      }
    } catch (error) {
      // Criar novo cliente no ASAAS
      const customerData = {
        name: dadosUsuario?.nome || user.nome,
        email: user.email,
        phone: dadosUsuario?.telefone || '',
        mobilePhone: dadosUsuario?.celular || '',
        cpfCnpj: dadosUsuario?.cpf || '',
        postalCode: dadosUsuario?.cep || '',
        address: dadosUsuario?.endereco || '',
        addressNumber: dadosUsuario?.numero || '',
        complement: dadosUsuario?.complemento || '',
        province: dadosUsuario?.bairro || '',
        city: dadosUsuario?.cidade || '',
        state: dadosUsuario?.estado || '',
        country: 'Brasil'
      };

      const asaasCustomer = await asaasService.createCustomer(customerData);
      asaasCustomerId = asaasCustomer.id!;
    }

    // Calcular datas
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio);
    const proximoVencimento = new Date(dataInicio);
    proximoVencimento.setDate(proximoVencimento.getDate() + 7); // Primeira cobrança em 7 dias
    
    if (plano.periodo === 'mensal') {
      dataFim.setMonth(dataFim.getMonth() + 1);
    } else if (plano.periodo === 'trimestral') {
      dataFim.setMonth(dataFim.getMonth() + 3);
    } else if (plano.periodo === 'anual') {
      dataFim.setFullYear(dataFim.getFullYear() + 1);
    }

    // Criar assinatura no banco de dados
    const novaAssinatura = new Assinatura({
      userId,
      planoId,
      asaasCustomerId,
      status: 'pendente',
      dataInicio,
      dataFim,
      proximoVencimento,
      valorMensal: plano.preco,
      metodoPagamento: asaasService.convertBillingType(metodoPagamento),
      ciclo: asaasService.convertPlanCycleToAsaas(plano.periodo),
      dadosCartao: dadosCartao ? {
        bandeira: dadosCartao.bandeira,
        ultimosDigitos: dadosCartao.numero.slice(-4),
        nomePortador: dadosCartao.nomePortador
      } : undefined
    });

    await novaAssinatura.save();

    // Criar assinatura no ASAAS
    try {
      const subscriptionData = {
        customer: asaasCustomerId,
        billingType: asaasService.convertBillingType(metodoPagamento) as 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED',
        value: plano.preco,
        nextDueDate: proximoVencimento.toISOString().split('T')[0],
        cycle: asaasService.convertPlanCycleToAsaas(plano.periodo) as 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' | 'WEEKLY' | 'BIWEEKLY',
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
          cpfCnpj: dadosUsuario?.cpf || '',
          postalCode: dadosUsuario?.cep || '',
          addressNumber: dadosUsuario?.numero || '',
          addressComplement: dadosUsuario?.complemento || '',
          phone: dadosUsuario?.telefone || '',
          mobilePhone: dadosUsuario?.celular || ''
        } : undefined
      };

      const asaasSubscription = await asaasService.createSubscription(subscriptionData);
      
      // Atualizar assinatura com ID do ASAAS
      novaAssinatura.asaasSubscriptionId = asaasSubscription.id;
      novaAssinatura.status = 'ativa';
      await novaAssinatura.save();

      // Adicionar histórico com verificação de método
      if (hasMethod(novaAssinatura, 'adicionarHistorico')) {
        await (novaAssinatura as any).adicionarHistorico(
          'ASSINATURA_CRIADA', 
          `Assinatura criada no ASAAS com ID: ${asaasSubscription.id}`,
          plano.preco
        );
      }

    } catch (asaasError: any) {
      console.error('Erro ao criar assinatura no ASAAS:', asaasError);
      
      // Marcar assinatura como com erro
      if (hasMethod(novaAssinatura, 'adicionarHistorico')) {
        await (novaAssinatura as any).adicionarHistorico(
          'ERRO_ASAAS', 
          `Erro ao criar assinatura no ASAAS: ${asaasError.message}`
        );
      }
      
      return res.status(400).json({ 
        message: 'Erro ao processar pagamento',
        details: asaasError.message 
      });
    }

    res.status(201).json({ 
      message: 'Assinatura criada com sucesso',
      assinatura: {
        ...novaAssinatura.toObject(),
        plano
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

// Cancelar assinatura
export const cancelarAssinatura = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { motivo } = req.body;
    
    const assinatura = await Assinatura.buscarPorUsuario(userId);
    if (!assinatura) {
      return res.status(404).json({ message: 'Assinatura ativa não encontrada' });
    }

    // Cancelar no ASAAS se existir ID
    if (assinatura.asaasSubscriptionId) {
      try {
        await asaasService.cancelSubscription(assinatura.asaasSubscriptionId);
        
        // Adicionar histórico com verificação de método
        if (hasMethod(assinatura, 'adicionarHistorico')) {
          await (assinatura as any).adicionarHistorico(
            'CANCELAMENTO_ASAAS', 
            'Assinatura cancelada no ASAAS com sucesso'
          );
        }
      } catch (asaasError: any) {
        console.error('Erro ao cancelar no ASAAS:', asaasError);
        
        // Adicionar histórico de erro com verificação de método
        if (hasMethod(assinatura, 'adicionarHistorico')) {
          await (assinatura as any).adicionarHistorico(
            'ERRO_CANCELAMENTO_ASAAS', 
            `Erro ao cancelar no ASAAS: ${asaasError.message}`
          );
        }
      }
    }

    // Cancelar localmente com verificação de método
    if (hasMethod(assinatura, 'cancelar')) {
      await (assinatura as any).cancelar(motivo || 'Cancelamento solicitado pelo usuário');
    }

    res.json({ 
      message: 'Assinatura cancelada com sucesso',
      assinatura: assinatura.toObject()
    });

  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ 
      message: 'Erro ao cancelar assinatura',
      details: error.message 
    });
  }
};

// Obter histórico de transações do usuário
export const getHistoricoTransacoes = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limite = 10 } = req.query;
    
    const transacoes = await Transacao.buscarPorUsuario(userId, Number(limite));
    
    res.json({ transacoes });
  } catch (error) {
    console.error('Erro ao obter histórico de transações:', error);
    res.status(500).json({ message: 'Erro ao obter histórico de transações' });
  }
};

// Reprocessar pagamento
export const reprocessarPagamento = async (req: Request, res: Response) => {
  try {
    const { transacaoId } = req.params;
    
    const transacao = await Transacao.findById(transacaoId)
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
      const paymentStatus = await asaasService.getPaymentStatus(transacao.asaasPaymentId);
      
      // Atualizar status local baseado no ASAAS
      if (paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') {
        if (hasMethod(transacao, 'receberPagamento')) {
          await (transacao as any).receberPagamento(new Date());
        }
        
        if (hasMethod(transacao, 'adicionarWebhookEvent')) {
          await (transacao as any).adicionarWebhookEvent('REPROCESSAMENTO_SUCESSO', { status: paymentStatus });
        }
        
        res.json({ 
          message: 'Pagamento confirmado com sucesso',
          transacao: transacao.toObject()
        });
      } else {
        res.json({ 
          message: 'Pagamento ainda pendente',
          status: paymentStatus,
          transacao: transacao.toObject()
        });
      }
      
    } catch (asaasError: any) {
      console.error('Erro ao reprocessar no ASAAS:', asaasError);
      
      if (hasMethod(transacao, 'adicionarWebhookEvent')) {
        await (transacao as any).adicionarWebhookEvent('ERRO_REPROCESSAMENTO', { error: asaasError.message });
      }
      
      res.status(400).json({ 
        message: 'Erro ao reprocessar pagamento',
        details: asaasError.message 
      });
    }

  } catch (error: any) {
    console.error('Erro ao reprocessar pagamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      details: error.message 
    });
  }
};