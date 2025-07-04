import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToFile(filename: string, entry: LogEntry) {
    const logFile = path.join(this.logDir, filename);
    const logLine = JSON.stringify(entry) + '\n';
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any, context?: any) {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: levelName,
      message,
      ...(meta && { meta }),
      ...(context?.userId && { userId: context.userId }),
      ...(context?.requestId && { requestId: context.requestId }),
      ...(context?.ip && { ip: context.ip }),
      ...(context?.userAgent && { userAgent: context.userAgent })
    };

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

  error(message: string, meta?: any, context?: any) {
    this.log(LogLevel.ERROR, 'ERROR', message, meta, context);
  }

  warn(message: string, meta?: any, context?: any) {
    this.log(LogLevel.WARN, 'WARN', message, meta, context);
  }

  info(message: string, meta?: any, context?: any) {
    this.log(LogLevel.INFO, 'INFO', message, meta, context);
  }

  debug(message: string, meta?: any, context?: any) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta, context);
  }

  // Métodos específicos para ASAAS
  asaasRequest(method: string, url: string, data?: any, context?: any) {
    this.info(`ASAAS Request: ${method} ${url}`, { data }, context);
  }

  asaasResponse(method: string, url: string, status: number, data?: any, context?: any) {
    this.info(`ASAAS Response: ${method} ${url} - ${status}`, { data }, context);
  }

  asaasError(method: string, url: string, error: any, context?: any) {
    this.error(`ASAAS Error: ${method} ${url}`, { 
      error: error.message,
      stack: error.stack,
      response: error.response?.data 
    }, context);
  }

  webhookReceived(event: string, data?: any, context?: any) {
    this.info(`Webhook received: ${event}`, { data }, context);
  }

  webhookProcessed(event: string, success: boolean, data?: any, context?: any) {
    if (success) {
      this.info(`Webhook processed successfully: ${event}`, { data }, context);
    } else {
      this.error(`Webhook processing failed: ${event}`, { data }, context);
    }
  }

  paymentCreated(paymentId: string, amount: number, method: string, context?: any) {
    this.info(`Payment created: ${paymentId}`, { 
      amount, 
      method,
      paymentId 
    }, context);
  }

  paymentConfirmed(paymentId: string, amount: number, context?: any) {
    this.info(`Payment confirmed: ${paymentId}`, { 
      amount,
      paymentId 
    }, context);
  }

  paymentFailed(paymentId: string, reason: string, context?: any) {
    this.error(`Payment failed: ${paymentId}`, { 
      reason,
      paymentId 
    }, context);
  }

  subscriptionCreated(subscriptionId: string, planId: string, context?: any) {
    this.info(`Subscription created: ${subscriptionId}`, { 
      subscriptionId,
      planId 
    }, context);
  }

  subscriptionCanceled(subscriptionId: string, reason?: string, context?: any) {
    this.info(`Subscription canceled: ${subscriptionId}`, { 
      subscriptionId,
      reason 
    }, context);
  }

  userAction(action: string, userId: string, details?: any, context?: any) {
    this.info(`User action: ${action}`, { 
      userId,
      details 
    }, { ...context, userId });
  }

  securityEvent(event: string, details: any, context?: any) {
    this.warn(`Security event: ${event}`, details, context);
  }

  // Método para rotacionar logs (executar diariamente)
  rotateLogs() {
    const today = new Date().toISOString().split('T')[0];
    const logFiles = ['error.log', 'combined.log', 'debug.log'];

    logFiles.forEach(filename => {
      const currentFile = path.join(this.logDir, filename);
      const archiveFile = path.join(this.logDir, `${filename}.${today}`);

      if (fs.existsSync(currentFile)) {
        try {
          fs.renameSync(currentFile, archiveFile);
          this.info(`Log rotated: ${filename} -> ${filename}.${today}`);
        } catch (error) {
          this.error(`Failed to rotate log: ${filename}`, error);
        }
      }
    });

    // Limpar logs antigos (manter apenas 30 dias)
    this.cleanOldLogs();
  }

  private cleanOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const files = fs.readdirSync(this.logDir);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo && file.includes('.log.')) {
          fs.unlinkSync(filePath);
          this.info(`Old log file deleted: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to clean old logs', error);
    }
  }

  // Método para obter estatísticas de logs
  getLogStats(): any {
    const stats = {
  totalErrors: 0,
  totalWarnings: 0,
  totalInfo: 0,
  recentErrors: [] as any[],
  logFiles: [] as string[]
};

    try {
      const files = fs.readdirSync(this.logDir);
      stats.logFiles = files as string[];

      // Ler arquivo de erros recentes
      const errorLogPath = path.join(this.logDir, 'error.log');
      if (fs.existsSync(errorLogPath)) {
        const errorLog = fs.readFileSync(errorLogPath, 'utf8');
        const lines = errorLog.trim().split('\n').filter(line => line);
        
        stats.totalErrors = lines.length;
        stats.recentErrors = lines.slice(-10).map((line: string) => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line };
          }
        });
      }

      // Contar warnings e info no combined.log
      const combinedLogPath = path.join(this.logDir, 'combined.log');
      if (fs.existsSync(combinedLogPath)) {
        const combinedLog = fs.readFileSync(combinedLogPath, 'utf8');
        const lines = combinedLog.trim().split('\n').filter(line => line);
        
        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            if (entry.level === 'WARN') stats.totalWarnings++;
            if (entry.level === 'INFO') stats.totalInfo++;
          } catch {
            // Ignorar linhas malformadas
          }
        });
      }
    } catch (error) {
      this.error('Failed to get log stats', error);
    }

    return stats;
  }
}

// Singleton instance
const logger = new Logger();

export default logger;

// Middleware para Express
export const requestLogger = (req: any, res: any, next: any) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();

  req.requestId = requestId;
  req.logger = {
    ...logger,
    context: {
      requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    }
  };

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

