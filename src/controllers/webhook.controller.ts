import { Request, Response } from 'express';
import asaasService, { AsaasWebhookEvent } from '../services/asaas.service';
import Assinatura from '../models/Assinatura';
import Transacao from '../models/Transacao';
import User from '../models/User';

// Processar webhook do ASAAS
export const processarWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['asaas-access-token'] as string;
    const payload = JSON.stringify(req.body);
    
    // Validar assinatura do webhook
    if (!asaasService.validateWebhook(payload, signature)) {
      console.error('[WEBHOOK] Assinatura inválida');
      return res.status(401).json({ message: 'Assinatura inválida' });
    }

    const webhookEvent: AsaasWebhookEvent = req.body;
    console.log(`[WEBHOOK] Evento recebido: ${webhookEvent.event}`);

    // Processar diferentes tipos de eventos
    switch (webhookEvent.event) {
      case 'PAYMENT_CREATED':
        await processarPagamentoCriado(webhookEvent);
        break;
      
      case 'PAYMENT_AWAITING_PAYMENT':
        await processarPagamentoAguardando(webhookEvent);
        break;
      
      case 'PAYMENT_CONFIRMED':
        await processarPagamentoConfirmado(webhookEvent);
        break;
      
      case 'PAYMENT_RECEIVED':
        await processarPagamentoRecebido(webhookEvent);
        break;
      
      case 'PAYMENT_OVERDUE':
        await processarPagamentoVencido(webhookEvent);
        break;
      
      case 'PAYMENT_DELETED':
        await processarPagamentoDeletado(webhookEvent);
        break;
      
      case 'PAYMENT_RESTORED':
        await processarPagamentoRestaurado(webhookEvent);
        break;
      
      case 'PAYMENT_REFUNDED':
        await processarPagamentoReembolsado(webhookEvent);
        break;
      
      case 'PAYMENT_RECEIVED_IN_CASH':
        await processarPagamentoRecebidoDinheiro(webhookEvent);
        break;
      
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        await processarChargebackSolicitado(webhookEvent);
        break;
      
      case 'PAYMENT_CHARGEBACK_DISPUTE':
        await processarChargebackDisputa(webhookEvent);
        break;
      
      case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
        await processarAguardandoReversaoChargeback(webhookEvent);
        break;
      
      case 'PAYMENT_DUNNING_REQUESTED':
        await processarCobrancaSolicitada(webhookEvent);
        break;
      
      case 'PAYMENT_DUNNING_RECEIVED':
        await processarCobrancaRecebida(webhookEvent);
        break;
      
      case 'PAYMENT_BANK_SLIP_VIEWED':
        await processarBoletoVisualizado(webhookEvent);
        break;
      
      case 'PAYMENT_CHECKOUT_VIEWED':
        await processarCheckoutVisualizado(webhookEvent);
        break;
      
      // Eventos de assinatura
      case 'SUBSCRIPTION_CREATED':
        await processarAssinaturaCriada(webhookEvent);
        break;
      
      case 'SUBSCRIPTION_UPDATED':
        await processarAssinaturaAtualizada(webhookEvent);
        break;
      
      case 'SUBSCRIPTION_DELETED':
        await processarAssinaturaDeletada(webhookEvent);
        break;
      
      default:
        console.log(`[WEBHOOK] Evento não tratado: ${webhookEvent.event}`);
        await logEventoNaoTratado(webhookEvent);
    }

    res.status(200).json({ message: 'Webhook processado com sucesso' });

  } catch (error: any) {
    console.error('[WEBHOOK] Erro ao processar webhook:', error);
    res.status(500).json({ 
      message: 'Erro ao processar webhook',
      details: error.message 
    });
  }
};

// Processar pagamento criado
async function processarPagamentoCriado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const payment = event.payment;
    
    // Buscar assinatura relacionada
    let assinatura = null;
    if (payment.subscription) {
      assinatura = await Assinatura.findOne({ asaasSubscriptionId: payment.subscription });
    } else if (payment.externalReference) {
      assinatura = await Assinatura.findById(payment.externalReference);
    }

    if (!assinatura) {
      console.error(`[WEBHOOK] Assinatura não encontrada para pagamento ${payment.id}`);
      return;
    }

    // Criar transação no banco de dados
    const transacao = new Transacao({
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

    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_CREATED', event);

    // Atualizar assinatura
    await assinatura.adicionarHistorico(
      'PAGAMENTO_CRIADO',
      `Pagamento criado no ASAAS: ${payment.id}`,
      payment.value
    );

    console.log(`[WEBHOOK] Pagamento criado: ${payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento criado:', error);
  }
}

// Processar pagamento aguardando
async function processarPagamentoAguardando(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'pending';
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_AWAITING_PAYMENT', event);

    console.log(`[WEBHOOK] Pagamento aguardando: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento aguardando:', error);
  }
}

// Processar pagamento confirmado
async function processarPagamentoConfirmado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id })
      .populate('assinaturaId');
    
    if (!transacao) return;

    // Atualizar transação
    await (transacao as any).confirmarPagamento(
      new Date(event.payment.paymentDate || event.payment.clientPaymentDate || Date.now()),
      event.payment.netValue,
      event.payment.value - event.payment.netValue
    );

    await (transacao as any).adicionarWebhookEvent('PAYMENT_CONFIRMED', event);

    // Atualizar assinatura
    const assinatura = transacao.assinaturaId as any;
    if (assinatura) {
      assinatura.status = 'ativa';
      assinatura.ultimaCobranca = new Date();
      
      // Calcular próxima cobrança
      const proximaCobranca = new Date(assinatura.proximoVencimento);
      if (assinatura.ciclo === 'MONTHLY') {
        proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
      } else if (assinatura.ciclo === 'QUARTERLY') {
        proximaCobranca.setMonth(proximaCobranca.getMonth() + 3);
      } else if (assinatura.ciclo === 'YEARLY') {
        proximaCobranca.setFullYear(proximaCobranca.getFullYear() + 1);
      }
      
      assinatura.proximaCobranca = proximaCobranca;
      await assinatura.save();

      await assinatura.adicionarHistorico(
        'PAGAMENTO_CONFIRMADO',
        `Pagamento confirmado: ${event.payment.id}`,
        event.payment.value
      );
    }

    console.log(`[WEBHOOK] Pagamento confirmado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento confirmado:', error);
  }
}

// Processar pagamento recebido
async function processarPagamentoRecebido(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    await (transacao as any).receberPagamento(
      new Date(event.payment.paymentDate || event.payment.clientPaymentDate || Date.now())
    );

    await (transacao as any).adicionarWebhookEvent('PAYMENT_RECEIVED', event);

    console.log(`[WEBHOOK] Pagamento recebido: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento recebido:', error);
  }
}

// Processar pagamento vencido
async function processarPagamentoVencido(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id })
      .populate('assinaturaId');
    
    if (!transacao) return;

    // Marcar transação como vencida
    await (transacao as any).marcarVencida();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_OVERDUE', event);

    // Suspender assinatura se muitas tentativas
    const assinatura = transacao.assinaturaId as any;
    if (assinatura && transacao.tentativas >= 3) {
      await assinatura.suspender('Pagamento em atraso - múltiplas tentativas falharam');
    }

    console.log(`[WEBHOOK] Pagamento vencido: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento vencido:', error);
  }
}

// Processar pagamento deletado
async function processarPagamentoDeletado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.observacoes = 'Pagamento deletado no ASAAS';
    await transacao.save();
    await (transacao as any).marcarVencida('PAYMENT_DELETED', event);

    console.log(`[WEBHOOK] Pagamento deletado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento deletado:', error);
  }
}

// Processar pagamento restaurado
async function processarPagamentoRestaurado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'pending';
    transacao.observacoes = 'Pagamento restaurado no ASAAS';
    await transacao.save();
    await (transacao as any).marcarVencida('PAYMENT_RESTORED', event);

    console.log(`[WEBHOOK] Pagamento restaurado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento restaurado:', error);
  }
}

// Processar pagamento reembolsado
async function processarPagamentoReembolsado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    await (transacao as any).processarReembolso(motivo);
    await (transacao as any).marcarVencida('PAYMENT_REFUNDED', event);

    console.log(`[WEBHOOK] Pagamento reembolsado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento reembolsado:', error);
  }
}

// Processar pagamento recebido em dinheiro
async function processarPagamentoRecebidoDinheiro(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'received_in_cash';
    transacao.dataPagamento = new Date();
    transacao.dataConfirmacao = new Date();
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_RECEIVED_IN_CASH', event);

    console.log(`[WEBHOOK] Pagamento recebido em dinheiro: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento recebido em dinheiro:', error);
  }
}

// Processar chargeback solicitado
async function processarChargebackSolicitado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'chargeback_requested';
    transacao.motivoFalha = 'Chargeback solicitado';
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_CHARGEBACK_REQUESTED', event);

    console.log(`[WEBHOOK] Chargeback solicitado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar chargeback solicitado:', error);
  }
}

// Processar disputa de chargeback
async function processarChargebackDisputa(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'chargeback_dispute';
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_CHARGEBACK_DISPUTE', event);

    console.log(`[WEBHOOK] Disputa de chargeback: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar disputa de chargeback:', error);
  }
}

// Processar aguardando reversão de chargeback
async function processarAguardandoReversaoChargeback(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'awaiting_chargeback_reversal';
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_AWAITING_CHARGEBACK_REVERSAL', event);

    console.log(`[WEBHOOK] Aguardando reversão de chargeback: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar aguardando reversão de chargeback:', error);
  }
}

// Processar cobrança solicitada
async function processarCobrancaSolicitada(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'dunning_requested';
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_DUNNING_REQUESTED', event);

    console.log(`[WEBHOOK] Cobrança solicitada: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar cobrança solicitada:', error);
  }
}

// Processar cobrança recebida
async function processarCobrancaRecebida(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    transacao.status = 'dunning_received';
    await transacao.save();
    await (transacao as any).adicionarWebhookEvent('PAYMENT_DUNNING_RECEIVED', event);

    console.log(`[WEBHOOK] Cobrança recebida: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar cobrança recebida:', error);
  }
}

// Processar boleto visualizado
async function processarBoletoVisualizado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    await (transacao as any).adicionarWebhookEvent('PAYMENT_BANK_SLIP_VIEWED', event);

    console.log(`[WEBHOOK] Boleto visualizado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar boleto visualizado:', error);
  }
}

// Processar checkout visualizado
async function processarCheckoutVisualizado(event: AsaasWebhookEvent) {
  if (!event.payment) return;

  try {
    const transacao = await Transacao.findOne({ asaasPaymentId: event.payment.id });
    if (!transacao) return;

    await (transacao as any).adicionarWebhookEvent('PAYMENT_CHECKOUT_VIEWED', event);

    console.log(`[WEBHOOK] Checkout visualizado: ${event.payment.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar checkout visualizado:', error);
  }
}

// Processar assinatura criada
async function processarAssinaturaCriada(event: AsaasWebhookEvent) {
  if (!event.subscription) return;

  try {
    const subscription = event.subscription;
    
    // Buscar assinatura pelo external reference
    const assinatura = await Assinatura.findById(subscription.externalReference);
    if (!assinatura) return;

    await assinatura.adicionarHistorico(
      'WEBHOOK_ASSINATURA_CRIADA',
      `Webhook de assinatura criada recebido: ${subscription.id}`
    );

    console.log(`[WEBHOOK] Assinatura criada: ${subscription.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar assinatura criada:', error);
  }
}

// Processar assinatura atualizada
async function processarAssinaturaAtualizada(event: AsaasWebhookEvent) {
  if (!event.subscription) return;

  try {
    const subscription = event.subscription;
    
    const assinatura = await Assinatura.findOne({ asaasSubscriptionId: subscription.id });
    if (!assinatura) return;

    // Atualizar dados da assinatura
    assinatura.proximoVencimento = new Date(subscription.nextDueDate);
    assinatura.valorMensal = subscription.value;
    
    if (subscription.status === 'ACTIVE') {
      assinatura.status = 'ativa';
    } else if (subscription.status === 'EXPIRED') {
      assinatura.status = 'vencida';
    }

    await assinatura.save();
    await assinatura.adicionarHistorico(
      'WEBHOOK_ASSINATURA_ATUALIZADA',
      `Webhook de assinatura atualizada recebido: ${subscription.id}`
    );

    console.log(`[WEBHOOK] Assinatura atualizada: ${subscription.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar assinatura atualizada:', error);
  }
}

// Processar assinatura deletada
async function processarAssinaturaDeletada(event: AsaasWebhookEvent) {
  if (!event.subscription) return;

  try {
    const subscription = event.subscription;
    
    const assinatura = await Assinatura.findOne({ asaasSubscriptionId: subscription.id });
    if (!assinatura) return;

    await assinatura.cancelar('Assinatura cancelada via webhook do ASAAS');

    console.log(`[WEBHOOK] Assinatura deletada: ${subscription.id}`);

  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar assinatura deletada:', error);
  }
}

// Log de evento não tratado
async function logEventoNaoTratado(event: AsaasWebhookEvent) {
  try {
    console.log(`[WEBHOOK] Evento não tratado: ${event.event}`, JSON.stringify(event, null, 2));
    
    // Aqui você pode implementar um sistema de log mais robusto
    // Por exemplo, salvar em uma collection específica para eventos não tratados
    
  } catch (error) {
    console.error('[WEBHOOK] Erro ao logar evento não tratado:', error);
  }
}

