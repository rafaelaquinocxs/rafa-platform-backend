import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// Interfaces para ASAAS
interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
  observations?: string;
}

interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  split?: any[];
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
}

interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  status?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type: 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  postalService?: boolean;
  split?: any[];
  callback?: {
    successUrl: string;
    autoRedirect: boolean;
  };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
}

interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    installment?: string;
    paymentLink?: string;
    value: number;
    netValue: number;
    originalValue?: number;
    interestValue?: number;
    description?: string;
    billingType: string;
    pixTransaction?: string;
    status: string;
    dueDate: string;
    originalDueDate: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    installmentNumber?: number;
    invoiceUrl: string;
    invoiceNumber: string;
    externalReference?: string;
    deleted: boolean;
    anticipated: boolean;
    anticipable: boolean;
  };
  subscription?: {
    id: string;
    customer: string;
    paymentLink?: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    description?: string;
    billingType: string;
    status: string;
    deleted: boolean;
    externalReference?: string;
  };
}

class AsaasService {
  private api: AxiosInstance;
  private apiKey: string;
  private environment: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.environment = process.env.ASAAS_ENVIRONMENT || 'sandbox';
    this.webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || '';
    
    const baseURL = this.environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';

    this.api = axios.create({
      baseURL,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'RAFA-Platform/1.0'
      },
      timeout: 30000
    });

    // Interceptor para logs
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[ASAAS] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[ASAAS] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`[ASAAS] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[ASAAS] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Validar webhook
  validateWebhook(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('[ASAAS] Webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Gerenciar clientes
  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      const response = await this.api.post('/customers', customerData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error creating customer:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cliente no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    try {
      const response = await this.api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error getting customer:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar cliente no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async updateCustomer(customerId: string, customerData: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    try {
      const response = await this.api.post(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error updating customer:', error.response?.data || error.message);
      throw new Error(`Erro ao atualizar cliente no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Gerenciar assinaturas
  async createSubscription(subscriptionData: AsaasSubscription): Promise<AsaasSubscription> {
    try {
      const response = await this.api.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error creating subscription:', error.response?.data || error.message);
      throw new Error(`Erro ao criar assinatura no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    try {
      const response = await this.api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error getting subscription:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar assinatura no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async updateSubscription(subscriptionId: string, subscriptionData: Partial<AsaasSubscription>): Promise<AsaasSubscription> {
    try {
      const response = await this.api.post(`/subscriptions/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error updating subscription:', error.response?.data || error.message);
      throw new Error(`Erro ao atualizar assinatura no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    try {
      const response = await this.api.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error canceling subscription:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Gerenciar pagamentos
  async createPayment(paymentData: AsaasPayment): Promise<AsaasPayment> {
    try {
      const response = await this.api.post('/payments', paymentData);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error creating payment:', error.response?.data || error.message);
      throw new Error(`Erro ao criar pagamento no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    try {
      const response = await this.api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ASAAS] Error getting payment:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar pagamento no ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const payment = await this.getPayment(paymentId);
      return payment.status || 'UNKNOWN';
    } catch (error: any) {
      console.error('[ASAAS] Error getting payment status:', error);
      throw error;
    }
  }

  // Utilitários
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatCPF(cpf: string): string {
    return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }

  // Converter ciclos de plano para ASAAS
  convertPlanCycleToAsaas(periodo: string): string {
    const cycleMap: { [key: string]: string } = {
      'mensal': 'MONTHLY',
      'trimestral': 'QUARTERLY',
      'semestral': 'SEMIANNUALLY',
      'anual': 'YEARLY'
    };
    return cycleMap[periodo] || 'MONTHLY';
  }

  // Converter tipo de pagamento
  convertBillingType(tipo: string): string {
    const typeMap: { [key: string]: string } = {
      'cartao': 'CREDIT_CARD',
      'boleto': 'BOLETO',
      'pix': 'PIX'
    };
    return typeMap[tipo] || 'CREDIT_CARD';
  }
}

export default new AsaasService();
export { AsaasCustomer, AsaasSubscription, AsaasPayment, AsaasWebhookEvent };

