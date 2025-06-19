/**
 * Express application setup with comprehensive middleware and routing
 * Implements security, monitoring, and error handling
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { loadConfig, AppConfig } from './config';
import { SecurityMiddleware } from './middleware/security';
import { LeasingAgreementController } from './controllers/leasingAgreementController';
import { LeasingAgreementService } from './services/leasingAgreementService';
import { Logger } from './utils/logger';

// Mock implementations - in production, these would be real implementations
import {
  ILeasingRepository,
  INotificationService,
  IInventoryService,
  IBillingService,
  IEmployeeService
} from './types';

/**
 * Main application class
 * Configures Express app with all middleware and routes
 */
export class App {
  
  private readonly app: Application;
  private readonly config: AppConfig;
  private readonly logger: Logger;
  private readonly securityMiddleware: SecurityMiddleware;

  constructor() {
    this.app = express();
    this.config = loadConfig();
    this.logger = new Logger('App');
    this.securityMiddleware = new SecurityMiddleware(this.config);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure Express middleware stack
   */
  private setupMiddleware(): void {
    
    // Security middleware (should be first)
    this.app.use(this.securityMiddleware.helmet());
    this.app.use(this.securityMiddleware.rateLimit());
    
    // CORS configuration
    this.app.use(cors({
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request sanitization
    this.app.use(this.securityMiddleware.sanitizeRequest);
    
    // Request logging middleware
    this.app.use(this.requestLoggingMiddleware.bind(this));
  }

  /**
   * Configure application routes
   */
  private setupRoutes(): void {
    
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: this.config.nodeEnv,
        version: '1.0.0'
      });
    });

    // API versioning
    const apiV1 = express.Router();
    
    // Create service instances (in production, use dependency injection container)
    const service = this.createLeasingService();
    const controller = new LeasingAgreementController(service);

    // Leasing agreement routes with proper authentication and authorization
    apiV1.post(
      '/agreements',
      this.securityMiddleware.authenticate,
      this.securityMiddleware.validateCompanyAccess,
      controller.createAgreement.bind(controller)
    );

    apiV1.get(
      '/agreements/:id',
      this.securityMiddleware.authenticate,
      controller.getAgreement.bind(controller)
    );

    apiV1.get(
      '/employees/:employeeId/agreements',
      this.securityMiddleware.authenticate,
      this.securityMiddleware.authorize('manager'),
      controller.getEmployeeAgreements.bind(controller)
    );

    // Mount API routes
    this.app.use('/api/v1', apiV1);

    // 404 handler for unknown routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`
        }
      });
    });
  }

  /**
   * Configure global error handling
   */
  private setupErrorHandling(): void {
    
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      
      const correlationId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      this.logger.error('Unhandled error', {
        correlationId,
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        user: req.user?.id
      });

      // Don't expose internal errors in production
      const message = this.config.nodeEnv === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message,
          correlationId
        }
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      this.logger.error('Unhandled promise rejection', { reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  /**
   * Request logging middleware
   * @param req - Express request
   * @param res - Express response
   * @param next - Next function
   */
  private requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    
    const startTime = Date.now();
    const correlationId = `req-${startTime}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add correlation ID to request for tracking
    (req as any).correlationId = correlationId;
    
    // Log request
    this.logger.info('Request received', {
      correlationId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      
      // Log response (excluding sensitive data)
      const logData: any = {
        correlationId,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      };

      if (res.statusCode >= 400) {
        logData.error = body?.error || body;
      }

      res.app.locals.logger?.info('Request completed', logData);
      
      return originalJson.call(this, body);
    };

    next();
  }

  /**
   * Create leasing service with dependencies
   * In production, this would use a proper DI container
   */
  private createLeasingService(): LeasingAgreementService {
    
    // Mock implementations - replace with real implementations
    const mockRepository: ILeasingRepository = {
      async save(agreement) { return agreement; },
      async findById(id) { return null; },
      async findByEmployeeId(employeeId) { return []; }
    };

    const mockNotificationService: INotificationService = {
      async sendAgreementCreated(employeeId, agreementId) {},
      async sendPaymentDue(employeeId, payment) {}
    };

    const mockInventoryService: IInventoryService = {
      async reserveItem(itemId) { return true; },
      async releaseItem(itemId) {},
      async checkAvailability(itemId) { return true; }
    };

    const mockBillingService: IBillingService = {
      async createBillingRecord(agreement) { return `bill-${agreement.id}`; },
      async updateBillingRecord(agreementId, status) {}
    };

    const mockEmployeeService: IEmployeeService = {
      async getEmployeeType(employeeId) { return 'STANDARD'; },
      async validateEmployee(employeeId, companyId) { return true; }
    };

    return new LeasingAgreementService(
      mockRepository,
      mockNotificationService,
      mockInventoryService,
      mockBillingService,
      mockEmployeeService,
      this.config.leasing,
      this.logger
    );
  }

  /**
   * Start the Express server
   * @param port - Port to listen on
   */
  public start(port?: number): void {
    
    const serverPort = port || this.config.port;
    
    this.app.listen(serverPort, () => {
      this.logger.info('Server started', {
        port: serverPort,
        environment: this.config.nodeEnv,
        version: '1.0.0'
      });
    });
  }

  /**
   * Get Express application instance
   * @returns Express Application
   */
  public getApp(): Application {
    return this.app;
  }
}

// Export singleton instance
export const app = new App();
