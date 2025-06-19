/**
 * Enhanced Leasing Agreement Controller with proper error handling,
 * authentication, and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { 
  CreateAgreementRequest, 
  AgreementResponse, 
  ValidationError, 
  BusinessRuleError,
  PaymentScheduleResponse 
} from '../types';
import { LeasingAgreementService } from '../services/leasingAgreementService';
import { Logger } from '../utils/logger';

/**
 * HTTP status codes for consistent responses
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
} as const;

/**
 * Standardized error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
    correlationId: string;
  };
}

/**
 * Controller for leasing agreement endpoints
 * Handles HTTP requests with proper validation and error handling
 */
export class LeasingAgreementController {
  
  private readonly logger: Logger;

  constructor(private readonly service: LeasingAgreementService) {
    this.logger = new Logger('LeasingAgreementController');
  }

  /**
   * Create new leasing agreement
   * POST /api/agreements
   */
  async createAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    const correlationId = this.generateCorrelationId();
    
    try {
      // Log incoming request (excluding sensitive data)
      this.logger.info('Creating leasing agreement', {
        correlationId,
        userId: req.user?.id,
        companyId: req.body?.companyId
      });

      // Validate authentication
      if (!req.user?.id) {
        this.sendErrorResponse(res, 'UNAUTHORIZED', 'Authentication required', correlationId);
        return;
      }

      // Validate request body exists
      if (!req.body) {
        this.sendErrorResponse(res, 'BAD_REQUEST', 'Request body is required', correlationId);
        return;
      }

      // Validate content type
      if (!req.is('application/json')) {
        this.sendErrorResponse(res, 'BAD_REQUEST', 'Content-Type must be application/json', correlationId);
        return;
      }

      // Create agreement request object
      const agreementRequest: CreateAgreementRequest = {
        employeeId: req.body.employeeId,
        itemId: req.body.itemId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        price: req.body.price,
        currency: req.body.currency,
        companyId: req.body.companyId,
        paymentFrequency: req.body.paymentFrequency,
        metadata: req.body.metadata
      };

      // Validate user has access to company
      if (!this.hasCompanyAccess(req.user, agreementRequest.companyId)) {
        this.sendErrorResponse(res, 'FORBIDDEN', 'Access denied to company resources', correlationId);
        return;
      }

      // Process agreement through service
      const agreement = await this.service.processLeasingAgreement(agreementRequest);
      
      // Format response
      const response: AgreementResponse = {
        id: agreement.id,
        status: agreement.status,
        totalCost: agreement.price,
        paymentSchedule: agreement.paymentSchedule.map(this.formatPaymentSchedule),
        createdAt: agreement.createdAt.toISOString()
      };

      this.logger.info('Agreement created successfully', {
        correlationId,
        agreementId: agreement.id,
        userId: req.user.id
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: response,
        correlationId
      });

    } catch (error) {
      this.handleError(error, res, correlationId, next);
    }
  }

  /**
   * Get agreement by ID
   * GET /api/agreements/:id
   */
  async getAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    const correlationId = this.generateCorrelationId();
    
    try {
      const agreementId = req.params.id;
      
      if (!agreementId) {
        this.sendErrorResponse(res, 'BAD_REQUEST', 'Agreement ID is required', correlationId);
        return;
      }

      // Validate authentication
      if (!req.user?.id) {
        this.sendErrorResponse(res, 'UNAUTHORIZED', 'Authentication required', correlationId);
        return;
      }

      this.logger.info('Retrieving agreement', {
        correlationId,
        agreementId,
        userId: req.user.id
      });

      // This would typically call a service method to get the agreement
      // For now, returning a placeholder response
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Agreement retrieval endpoint - implementation pending',
        correlationId
      });

    } catch (error) {
      this.handleError(error, res, correlationId, next);
    }
  }

  /**
   * Get agreements for employee
   * GET /api/employees/:employeeId/agreements
   */
  async getEmployeeAgreements(req: Request, res: Response, next: NextFunction): Promise<void> {
    const correlationId = this.generateCorrelationId();
    
    try {
      const employeeId = req.params.employeeId;
      
      if (!employeeId) {
        this.sendErrorResponse(res, 'BAD_REQUEST', 'Employee ID is required', correlationId);
        return;
      }

      // Validate authentication
      if (!req.user?.id) {
        this.sendErrorResponse(res, 'UNAUTHORIZED', 'Authentication required', correlationId);
        return;
      }

      this.logger.info('Retrieving employee agreements', {
        correlationId,
        employeeId,
        userId: req.user.id
      });

      // This would typically call a service method to get employee agreements
      // For now, returning a placeholder response
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Employee agreements endpoint - implementation pending',
        correlationId
      });

    } catch (error) {
      this.handleError(error, res, correlationId, next);
    }
  }

  /**
   * Centralized error handling
   * @param error - Error to handle
   * @param res - Response object
   * @param correlationId - Correlation ID
   * @param next - Next function
   */
  private handleError(
    error: unknown, 
    res: Response, 
    correlationId: string, 
    next: NextFunction
  ): void {
    
    // Log error details
    this.logger.error('Request failed', { correlationId }, error as Error);

    if (error instanceof ValidationError) {
      this.sendErrorResponse(
        res, 
        'VALIDATION_ERROR', 
        error.message, 
        correlationId,
        error.field
      );
    } else if (error instanceof BusinessRuleError) {
      this.sendErrorResponse(
        res, 
        'BUSINESS_RULE_ERROR', 
        error.message, 
        correlationId
      );
    } else {
      // For unexpected errors, don't expose internal details
      this.sendErrorResponse(
        res, 
        'INTERNAL_ERROR', 
        'An unexpected error occurred', 
        correlationId
      );
    }
  }

  /**
   * Send standardized error response
   * @param res - Response object
   * @param code - Error code
   * @param message - Error message
   * @param correlationId - Correlation ID
   * @param field - Field name for validation errors
   */
  private sendErrorResponse(
    res: Response, 
    code: string, 
    message: string, 
    correlationId: string,
    field?: string
  ): void {
    
    const statusCode = this.getStatusCodeForError(code);
    
    const errorResponse: ErrorResponse = {
      error: {
        code,
        message,
        field,
        correlationId
      }
    };

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Map error codes to HTTP status codes
   * @param errorCode - Error code
   * @returns HTTP status code
   */
  private getStatusCodeForError(errorCode: string): number {
    switch (errorCode) {
      case 'VALIDATION_ERROR':
        return HTTP_STATUS.BAD_REQUEST;
      case 'BUSINESS_RULE_ERROR':
        return HTTP_STATUS.CONFLICT;
      case 'UNAUTHORIZED':
        return HTTP_STATUS.UNAUTHORIZED;
      case 'FORBIDDEN':
        return HTTP_STATUS.FORBIDDEN;
      case 'NOT_FOUND':
        return HTTP_STATUS.NOT_FOUND;
      default:
        return HTTP_STATUS.INTERNAL_ERROR;
    }
  }

  /**
   * Check if user has access to company resources
   * @param user - Authenticated user
   * @param companyId - Company ID to check access for
   * @returns boolean - Whether user has access
   */
  private hasCompanyAccess(user: any, companyId: string): boolean {
    // In a real implementation, this would check user permissions
    // For now, assume user has access if they have a company ID that matches
    return user.companyId === companyId || user.role === 'admin';
  }

  /**
   * Format payment schedule for API response
   * @param payment - Payment schedule item
   * @returns Formatted payment schedule response
   */
  private formatPaymentSchedule(payment: any): PaymentScheduleResponse {
    return {
      id: payment.id,
      dueDate: payment.dueDate.toISOString(),
      amount: payment.amount,
      status: payment.status
    };
  }

  /**
   * Generate correlation ID for request tracking
   * @returns Unique correlation ID
   */
  private generateCorrelationId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
