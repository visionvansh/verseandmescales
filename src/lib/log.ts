// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private env: string = process.env.NODE_ENV || 'development';
  
  debug(message: string, meta: any = {}) {
    this.log('debug', message, meta);
  }
  
  info(message: string, meta: any = {}) {
    this.log('info', message, meta);
  }
  
  warn(message: string, meta: any = {}) {
    this.log('warn', message, meta);
  }
  
  error(message: string, meta: any = {}) {
    this.log('error', message, meta);
  }
  
  private log(level: LogLevel, message: string, meta: any) {
    // In production, you'd use a real logging service like Winston
    if (this.env === 'production') {
      // Send to logging service
      const logData = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      };
      
      // For development, just console log
      console[level](JSON.stringify(logData));
    } else {
      console[level](message, meta);
    }
  }
}

export const logger = new Logger();