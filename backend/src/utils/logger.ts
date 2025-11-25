import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logToFile(entry: LogEntry): void {
    // Skip file logging in test environment
    if (NODE_ENV === 'test') {
      return;
    }

    const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(LOG_DIR, logFileName);
    const logLine = JSON.stringify(entry) + '\n';

    try {
      fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    // Always log to console
    const consoleMessage = `[${entry.timestamp}] ${level}: ${message}`;
    switch (level) {
      case LogLevel.ERROR:
        console.error(consoleMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, data || '');
        break;
      case LogLevel.DEBUG:
        console.debug(consoleMessage, data || '');
        break;
    }

    // Log to file
    this.logToFile(entry);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    // Only log debug messages in development
    if (NODE_ENV === 'development') {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
}

export const logger = new Logger();
