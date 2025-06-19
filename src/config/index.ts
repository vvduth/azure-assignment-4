/**
 * Application configuration with environment-based settings
 * Provides type-safe configuration management
 */

import { LeasingConfig } from '../types';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  leasing: LeasingConfig;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

/**
 * Load and validate configuration from environment variables
 * @returns AppConfig - Validated configuration object
 */
export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'leasing_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD
    },
    
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    
    leasing: {
      maxLeasingDuration: parseInt(process.env.MAX_LEASING_DURATION || '60', 10),
      minLeasingDuration: parseInt(process.env.MIN_LEASING_DURATION || '1', 10),
      maxPrice: parseInt(process.env.MAX_PRICE || '1000000', 10),
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
      employeeDiscounts: {
        STANDARD: 1.0,
        PREMIUM: 0.9,
        VIP: 0.8
      },
      longTermDiscount: parseFloat(process.env.LONG_TERM_DISCOUNT || '0.8'),
      longTermThreshold: parseInt(process.env.LONG_TERM_THRESHOLD || '12', 10)
    },
    
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    },
    
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true'
    }
  };
}
