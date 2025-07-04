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
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class AsaasService {
    constructor() {
        this.apiKey = process.env.ASAAS_API_KEY || '';
        this.environment = process.env.ASAAS_ENVIRONMENT || 'sandbox';
        this.webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || '';
        const baseURL = this.environment === 'production'
            ? 'https://www.asaas.com/api/v3'
            : 'https://sandbox.asaas.com/api/v3';
        this.api = axios_1.default.create({
            baseURL,
            headers: {
                'access_token': this.apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'RAFA-Platform/1.0'
            },
            timeout: 30000
        });
        // Interceptor para logs
        this.api.interceptors.request.use((config) => {
            var _a;
            console.log(`[ASAAS] ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('[ASAAS] Request error:', error);
            return Promise.reject(error);
        });
        this.api.interceptors.response.use((response) => {
            console.log(`[ASAAS] Response ${response.status} from ${response.config.url}`);
            return response;
        }, (error) => {
            var _a;
            console.error('[ASAAS] Response error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            return Promise.reject(error);
        });
    }
    // Validar webhook
    validateWebhook(payload, signature) {
        if (!this.webhookSecret) {
            console.warn('[ASAAS] Webhook secret not configured');
            return false;
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    // Gerenciar clientes
    createCustomer(customerData) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.post('/customers', customerData);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error creating customer:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao criar cliente no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    getCustomer(customerId) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.get(`/customers/${customerId}`);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error getting customer:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao buscar cliente no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    updateCustomer(customerId, customerData) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.post(`/customers/${customerId}`, customerData);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error updating customer:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao atualizar cliente no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    // Gerenciar assinaturas
    createSubscription(subscriptionData) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.post('/subscriptions', subscriptionData);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error creating subscription:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao criar assinatura no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    getSubscription(subscriptionId) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.get(`/subscriptions/${subscriptionId}`);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error getting subscription:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao buscar assinatura no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    updateSubscription(subscriptionId, subscriptionData) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.post(`/subscriptions/${subscriptionId}`, subscriptionData);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error updating subscription:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao atualizar assinatura no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    cancelSubscription(subscriptionId) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.delete(`/subscriptions/${subscriptionId}`);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error canceling subscription:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao cancelar assinatura no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    // Gerenciar pagamentos
    createPayment(paymentData) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.post('/payments', paymentData);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error creating payment:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao criar pagamento no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    getPayment(paymentId) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.api.get(`/payments/${paymentId}`);
                return response.data;
            }
            catch (error) {
                console.error('[ASAAS] Error getting payment:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(`Erro ao buscar pagamento no ASAAS: ${((_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.description) || error.message}`);
            }
        });
    }
    getPaymentStatus(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payment = yield this.getPayment(paymentId);
                return payment.status || 'UNKNOWN';
            }
            catch (error) {
                console.error('[ASAAS] Error getting payment status:', error);
                throw error;
            }
        });
    }
    // Utilitários
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    formatCPF(cpf) {
        return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    validateCPF(cpf) {
        const cleanCPF = cpf.replace(/\D/g, '');
        if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
            return false;
        }
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11)
            remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9)))
            return false;
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11)
            remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(10)))
            return false;
        return true;
    }
    // Converter ciclos de plano para ASAAS
    convertPlanCycleToAsaas(periodo) {
        const cycleMap = {
            'mensal': 'MONTHLY',
            'trimestral': 'QUARTERLY',
            'semestral': 'SEMIANNUALLY',
            'anual': 'YEARLY'
        };
        return cycleMap[periodo] || 'MONTHLY';
    }
    // Converter tipo de pagamento
    convertBillingType(tipo) {
        const typeMap = {
            'cartao': 'CREDIT_CARD',
            'boleto': 'BOLETO',
            'pix': 'PIX'
        };
        return typeMap[tipo] || 'CREDIT_CARD';
    }
}
exports.default = new AsaasService();
