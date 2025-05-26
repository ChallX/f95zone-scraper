import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  constructor() {
    try {
      // Ensure logs directory exists
      const logsDir = path.join(__dirname, '..', '..', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      this.logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack }) => {
            return `${timestamp} [${level}]: ${stack || message}`;
          })
        ),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ 
            filename: path.join(__dirname, '..', '..', 'logs', 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          new winston.transports.File({ 
            filename: path.join(__dirname, '..', '..', 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          })
        ]
      });
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      // Fallback to console logging
      this.logger = console;
    }
  }

  info(message, meta = {}) {
    try {
      if (typeof message !== 'string') {
        message = String(message);
      }
      this.logger.info(message, meta);
    } catch (error) {
      console.log(`[INFO]: ${message}`);
    }
  }

  error(message, meta = {}) {
    try {
      if (typeof message !== 'string') {
        message = String(message);
      }
      this.logger.error(message, meta);
    } catch (error) {
      console.error(`[ERROR]: ${message}`);
    }
  }

  warn(message, meta = {}) {
    try {
      if (typeof message !== 'string') {
        message = String(message);
      }
      this.logger.warn(message, meta);
    } catch (error) {
      console.warn(`[WARN]: ${message}`);
    }
  }

  debug(message, meta = {}) {
    try {
      if (typeof message !== 'string') {
        message = String(message);
      }
      this.logger.debug(message, meta);
    } catch (error) {
      console.log(`[DEBUG]: ${message}`);
    }
  }
}
