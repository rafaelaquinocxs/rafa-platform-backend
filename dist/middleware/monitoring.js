"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringRoutes = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class MonitoringService {
    constructor() {
        this.responseTimes = [];
        this.asaasResponseTimes = [];
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                byMethod: {},
                byStatus: {},
                averageResponseTime: 0
            },
            asaas: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0
            },
            payments: {
                total: 0,
                successful: 0,
                failed: 0,
                pending: 0,
                totalAmount: 0
            },
            subscriptions: {
                active: 0,
                canceled: 0,
                expired: 0,
                created: 0
            },
            errors: {
                total: 0,
                byType: {},
                recent: []
            }
        };
        // Reset métricas diariamente
        setInterval(() => {
            this.resetDailyMetrics();
        }, 24 * 60 * 60 * 1000);
    }
    // Middleware para monitorar requests
    requestMonitoring() {
        return (req, res, next) => {
            const startTime = Date.now();
            // Incrementar contadores
            this.metrics.requests.total++;
            this.metrics.requests.byMethod[req.method] = (this.metrics.requests.byMethod[req.method] || 0) + 1;
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.responseTimes.push(responseTime);
                // Manter apenas os últimos 1000 tempos de resposta
                if (this.responseTimes.length > 1000) {
                    this.responseTimes = this.responseTimes.slice(-1000);
                }
                // Atualizar métricas
                this.metrics.requests.byStatus[res.statusCode] = (this.metrics.requests.byStatus[res.statusCode] || 0) + 1;
                this.metrics.requests.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    this.metrics.requests.success++;
                }
                else {
                    this.metrics.requests.errors++;
                }
                // Log de performance para requests lentos
                if (responseTime > 5000) {
                    logger_1.default.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
                        responseTime,
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode
                    });
                }
            });
            next();
        };
    }
    // Monitorar requests para ASAAS
    trackAsaasRequest(success, responseTime) {
        this.metrics.asaas.totalRequests++;
        this.asaasResponseTimes.push(responseTime);
        if (this.asaasResponseTimes.length > 1000) {
            this.asaasResponseTimes = this.asaasResponseTimes.slice(-1000);
        }
        this.metrics.asaas.averageResponseTime = this.asaasResponseTimes.reduce((a, b) => a + b, 0) / this.asaasResponseTimes.length;
        if (success) {
            this.metrics.asaas.successfulRequests++;
        }
        else {
            this.metrics.asaas.failedRequests++;
        }
    }
    // Monitorar pagamentos
    trackPayment(status, amount) {
        this.metrics.payments.total++;
        this.metrics.payments[status]++;
        if (status === 'successful') {
            this.metrics.payments.totalAmount += amount;
        }
    }
    // Monitorar assinaturas
    trackSubscription(action) {
        this.metrics.subscriptions[action]++;
        if (action === 'created') {
            this.metrics.subscriptions.active++;
        }
        else if (action === 'canceled' || action === 'expired') {
            this.metrics.subscriptions.active = Math.max(0, this.metrics.subscriptions.active - 1);
        }
    }
    // Monitorar erros
    trackError(error, type = 'general') {
        this.metrics.errors.total++;
        this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;
        // Adicionar aos erros recentes
        this.metrics.errors.recent.unshift({
            timestamp: new Date().toISOString(),
            message: error.message,
            type,
            stack: error.stack
        });
        // Manter apenas os últimos 50 erros
        if (this.metrics.errors.recent.length > 50) {
            this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 50);
        }
    }
    // Obter métricas atuais
    getMetrics() {
        return Object.assign({}, this.metrics);
    }
    // Obter status de saúde do sistema
    getHealthStatus() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        // Calcular taxa de erro dos últimos minutos
        const recentErrors = this.metrics.errors.recent.filter(error => new Date(error.timestamp).getTime() > oneMinuteAgo).length;
        const errorRate = this.metrics.requests.total > 0 ?
            (this.metrics.requests.errors / this.metrics.requests.total) * 100 : 0;
        const asaasErrorRate = this.metrics.asaas.totalRequests > 0 ?
            (this.metrics.asaas.failedRequests / this.metrics.asaas.totalRequests) * 100 : 0;
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            checks: {
                errorRate: {
                    status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical',
                    value: errorRate,
                    threshold: 5
                },
                responseTime: {
                    status: this.metrics.requests.averageResponseTime < 1000 ? 'healthy' :
                        this.metrics.requests.averageResponseTime < 3000 ? 'warning' : 'critical',
                    value: this.metrics.requests.averageResponseTime,
                    threshold: 1000
                },
                asaasIntegration: {
                    status: asaasErrorRate < 10 ? 'healthy' : asaasErrorRate < 25 ? 'warning' : 'critical',
                    value: asaasErrorRate,
                    threshold: 10
                },
                recentErrors: {
                    status: recentErrors < 5 ? 'healthy' : recentErrors < 15 ? 'warning' : 'critical',
                    value: recentErrors,
                    threshold: 5
                }
            }
        };
        // Determinar status geral
        const checkStatuses = Object.values(status.checks).map(check => check.status);
        if (checkStatuses.includes('critical')) {
            status.status = 'critical';
        }
        else if (checkStatuses.includes('warning')) {
            status.status = 'warning';
        }
        return status;
    }
    // Reset métricas diárias
    resetDailyMetrics() {
        logger_1.default.info('Resetting daily metrics', this.metrics);
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                byMethod: {},
                byStatus: {},
                averageResponseTime: 0
            },
            asaas: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0
            },
            payments: {
                total: 0,
                successful: 0,
                failed: 0,
                pending: 0,
                totalAmount: 0
            },
            subscriptions: Object.assign(Object.assign({}, this.metrics.subscriptions), { created: 0 // Reset apenas criações diárias
             }),
            errors: {
                total: 0,
                byType: {},
                recent: []
            }
        };
        this.responseTimes = [];
        this.asaasResponseTimes = [];
    }
    // Gerar relatório de performance
    generatePerformanceReport() {
        const metrics = this.getMetrics();
        const health = this.getHealthStatus();
        return {
            summary: {
                totalRequests: metrics.requests.total,
                successRate: metrics.requests.total > 0 ?
                    ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%' : '0%',
                averageResponseTime: Math.round(metrics.requests.averageResponseTime) + 'ms',
                errorRate: metrics.requests.total > 0 ?
                    ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%' : '0%'
            },
            asaas: {
                totalRequests: metrics.asaas.totalRequests,
                successRate: metrics.asaas.totalRequests > 0 ?
                    ((metrics.asaas.successfulRequests / metrics.asaas.totalRequests) * 100).toFixed(2) + '%' : '0%',
                averageResponseTime: Math.round(metrics.asaas.averageResponseTime) + 'ms'
            },
            payments: {
                total: metrics.payments.total,
                successful: metrics.payments.successful,
                failed: metrics.payments.failed,
                pending: metrics.payments.pending,
                totalAmount: 'R$ ' + metrics.payments.totalAmount.toFixed(2),
                successRate: metrics.payments.total > 0 ?
                    ((metrics.payments.successful / metrics.payments.total) * 100).toFixed(2) + '%' : '0%'
            },
            subscriptions: {
                active: metrics.subscriptions.active,
                created: metrics.subscriptions.created,
                canceled: metrics.subscriptions.canceled,
                expired: metrics.subscriptions.expired
            },
            health: health.status,
            timestamp: new Date().toISOString()
        };
    }
}
// Singleton instance
const monitoring = new MonitoringService();
exports.default = monitoring;
// Middleware de tratamento de erros
const errorHandler = (error, req, res, next) => {
    var _a;
    // Determinar tipo de erro
    let errorType = 'general';
    if (error.message.includes('ASAAS'))
        errorType = 'asaas';
    if (error.message.includes('MongoDB'))
        errorType = 'database';
    if (error.message.includes('JWT'))
        errorType = 'authentication';
    if (error.message.includes('validation'))
        errorType = 'validation';
    // Rastrear erro
    monitoring.trackError(error, errorType);
    // Log do erro
    logger_1.default.error(`Unhandled error: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        type: errorType
    }, {
        requestId: req.requestId,
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        ip: req.ip
    });
    // Resposta baseada no ambiente
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            requestId: req.requestId
        });
    }
    else {
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack,
            requestId: req.requestId
        });
    }
};
exports.errorHandler = errorHandler;
// Middleware para endpoints de monitoramento
const monitoringRoutes = (req, res, next) => {
    if (req.path === '/health') {
        return res.json(monitoring.getHealthStatus());
    }
    if (req.path === '/metrics') {
        return res.json(monitoring.getMetrics());
    }
    if (req.path === '/performance') {
        return res.json(monitoring.generatePerformanceReport());
    }
    next();
};
exports.monitoringRoutes = monitoringRoutes;
