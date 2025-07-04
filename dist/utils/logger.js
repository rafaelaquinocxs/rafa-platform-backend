"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.LogLevel = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor() {
        this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
        this.logDir = path_1.default.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
    }
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    formatTimestamp() {
        return new Date().toISOString();
    }
    writeToFile(filename, entry) {
        const logFile = path_1.default.join(this.logDir, filename);
        const logLine = JSON.stringify(entry) + '\n';
        try {
            fs_1.default.appendFileSync(logFile, logLine);
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    log(level, levelName, message, meta, context) {
        if (level > this.logLevel)
            return;
        const entry = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ timestamp: this.formatTimestamp(), level: levelName, message }, (meta && { meta })), ((context === null || context === void 0 ? void 0 : context.userId) && { userId: context.userId })), ((context === null || context === void 0 ? void 0 : context.requestId) && { requestId: context.requestId })), ((context === null || context === void 0 ? void 0 : context.ip) && { ip: context.ip })), ((context === null || context === void 0 ? void 0 : context.userAgent) && { userAgent: context.userAgent }));
        // Console output
        const consoleMessage = `[${entry.timestamp}] ${levelName.toUpperCase()}: ${message}`;
        switch (level) {
            case LogLevel.ERROR:
                console.error(consoleMessage, meta || '');
                this.writeToFile('error.log', entry);
                this.writeToFile('combined.log', entry);
                break;
            case LogLevel.WARN:
                console.warn(consoleMessage, meta || '');
                this.writeToFile('combined.log', entry);
                break;
            case LogLevel.INFO:
                console.info(consoleMessage, meta || '');
                this.writeToFile('combined.log', entry);
                break;
            case LogLevel.DEBUG:
                console.debug(consoleMessage, meta || '');
                this.writeToFile('debug.log', entry);
                break;
        }
    }
    error(message, meta, context) {
        this.log(LogLevel.ERROR, 'ERROR', message, meta, context);
    }
    warn(message, meta, context) {
        this.log(LogLevel.WARN, 'WARN', message, meta, context);
    }
    info(message, meta, context) {
        this.log(LogLevel.INFO, 'INFO', message, meta, context);
    }
    debug(message, meta, context) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, meta, context);
    }
    // Métodos específicos para ASAAS
    asaasRequest(method, url, data, context) {
        this.info(`ASAAS Request: ${method} ${url}`, { data }, context);
    }
    asaasResponse(method, url, status, data, context) {
        this.info(`ASAAS Response: ${method} ${url} - ${status}`, { data }, context);
    }
    asaasError(method, url, error, context) {
        var _a;
        this.error(`ASAAS Error: ${method} ${url}`, {
            error: error.message,
            stack: error.stack,
            response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.data
        }, context);
    }
    webhookReceived(event, data, context) {
        this.info(`Webhook received: ${event}`, { data }, context);
    }
    webhookProcessed(event, success, data, context) {
        if (success) {
            this.info(`Webhook processed successfully: ${event}`, { data }, context);
        }
        else {
            this.error(`Webhook processing failed: ${event}`, { data }, context);
        }
    }
    paymentCreated(paymentId, amount, method, context) {
        this.info(`Payment created: ${paymentId}`, {
            amount,
            method,
            paymentId
        }, context);
    }
    paymentConfirmed(paymentId, amount, context) {
        this.info(`Payment confirmed: ${paymentId}`, {
            amount,
            paymentId
        }, context);
    }
    paymentFailed(paymentId, reason, context) {
        this.error(`Payment failed: ${paymentId}`, {
            reason,
            paymentId
        }, context);
    }
    subscriptionCreated(subscriptionId, planId, context) {
        this.info(`Subscription created: ${subscriptionId}`, {
            subscriptionId,
            planId
        }, context);
    }
    subscriptionCanceled(subscriptionId, reason, context) {
        this.info(`Subscription canceled: ${subscriptionId}`, {
            subscriptionId,
            reason
        }, context);
    }
    userAction(action, userId, details, context) {
        this.info(`User action: ${action}`, {
            userId,
            details
        }, Object.assign(Object.assign({}, context), { userId }));
    }
    securityEvent(event, details, context) {
        this.warn(`Security event: ${event}`, details, context);
    }
    // Método para rotacionar logs (executar diariamente)
    rotateLogs() {
        const today = new Date().toISOString().split('T')[0];
        const logFiles = ['error.log', 'combined.log', 'debug.log'];
        logFiles.forEach(filename => {
            const currentFile = path_1.default.join(this.logDir, filename);
            const archiveFile = path_1.default.join(this.logDir, `${filename}.${today}`);
            if (fs_1.default.existsSync(currentFile)) {
                try {
                    fs_1.default.renameSync(currentFile, archiveFile);
                    this.info(`Log rotated: ${filename} -> ${filename}.${today}`);
                }
                catch (error) {
                    this.error(`Failed to rotate log: ${filename}`, error);
                }
            }
        });
        // Limpar logs antigos (manter apenas 30 dias)
        this.cleanOldLogs();
    }
    cleanOldLogs() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        try {
            const files = fs_1.default.readdirSync(this.logDir);
            files.forEach(file => {
                const filePath = path_1.default.join(this.logDir, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.mtime < thirtyDaysAgo && file.includes('.log.')) {
                    fs_1.default.unlinkSync(filePath);
                    this.info(`Old log file deleted: ${file}`);
                }
            });
        }
        catch (error) {
            this.error('Failed to clean old logs', error);
        }
    }
    // Método para obter estatísticas de logs
    getLogStats() {
        const stats = {
            totalErrors: 0,
            totalWarnings: 0,
            totalInfo: 0,
            recentErrors: [],
            logFiles: []
        };
        try {
            const files = fs_1.default.readdirSync(this.logDir);
            stats.logFiles = files;
            // Ler arquivo de erros recentes
            const errorLogPath = path_1.default.join(this.logDir, 'error.log');
            if (fs_1.default.existsSync(errorLogPath)) {
                const errorLog = fs_1.default.readFileSync(errorLogPath, 'utf8');
                const lines = errorLog.trim().split('\n').filter(line => line);
                stats.totalErrors = lines.length;
                stats.recentErrors = lines.slice(-10).map(line => {
                    try {
                        return JSON.parse(line);
                    }
                    catch (_a) {
                        return { message: line };
                    }
                });
            }
            // Contar warnings e info no combined.log
            const combinedLogPath = path_1.default.join(this.logDir, 'combined.log');
            if (fs_1.default.existsSync(combinedLogPath)) {
                const combinedLog = fs_1.default.readFileSync(combinedLogPath, 'utf8');
                const lines = combinedLog.trim().split('\n').filter(line => line);
                lines.forEach(line => {
                    try {
                        const entry = JSON.parse(line);
                        if (entry.level === 'WARN')
                            stats.totalWarnings++;
                        if (entry.level === 'INFO')
                            stats.totalInfo++;
                    }
                    catch (_a) {
                        // Ignorar linhas malformadas
                    }
                });
            }
        }
        catch (error) {
            this.error('Failed to get log stats', error);
        }
        return stats;
    }
}
// Singleton instance
const logger = new Logger();
exports.default = logger;
// Middleware para Express
const requestLogger = (req, res, next) => {
    var _a;
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    req.requestId = requestId;
    req.logger = Object.assign(Object.assign({}, logger), { context: {
            requestId,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
        } });
    logger.info(`${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    }, req.logger.context);
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration
        }, req.logger.context);
    });
    next();
};
exports.requestLogger = requestLogger;
