// Centralized logging utility - replaces console.log/error in production

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    // Only log to console in development
    if (this.isDevelopment) {
      const logMethod = level === 'error' ? console.error : console.log;
      logMethod(`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // In production, could send to monitoring service (Sentry already configured)
    if (!this.isDevelopment && level === 'error') {
      // Error already goes to Sentry via useErrorReporting
      // Don't expose in console
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  // Sanitize sensitive data before logging
  sanitize(data: any): any {
    if (!data) return data;

    const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'apiKey', 'phone', 'email', 'card'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

export const logger = new Logger();
