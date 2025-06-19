/**
 * Security middleware for authentication, authorization, and request validation
 * Implements JWT-based authentication with role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppConfig } from '../config';
import { Logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        companyId: string;
        role: string;
      };
    }
  }
}

/**
 * Security middleware class with comprehensive protection
 */
export class SecurityMiddleware {
  
  private readonly logger: Logger;
  
  constructor(private readonly config: AppConfig) {
    this.logger = new Logger('SecurityMiddleware');
  }

  /**
   * Configure Helmet for security headers
   * @returns Helmet middleware
   */
  helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  /**
   * Rate limiting middleware
   * @returns Rate limiting middleware
   */
  rateLimit() {
    return rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        });
        
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later'
          }
        });
      }
    });
  }

  /**
   * Authentication middleware - validates JWT tokens
   * @param req - Express request
   * @param res - Express response
   * @param next - Next function
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required'
          }
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // In a real implementation, you would verify the JWT token here
      // For this example, we'll mock the token validation
      const user = this.validateToken(token);
      
      if (!user) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          }
        });
        return;
      }

      req.user = user;
      next();
      
    } catch (error) {
      this.logger.error('Authentication failed', { error: (error as Error).message });
      
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed'
        }
      });
    }
  };

  /**
   * Authorization middleware - checks user permissions
   * @param requiredRole - Required role for access
   * @returns Authorization middleware function
   */
  authorize = (requiredRole?: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      if (requiredRole && req.user.role !== requiredRole && req.user.role !== 'admin') {
        this.logger.warn('Authorization failed', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRole,
          endpoint: req.path
        });
        
        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions for this operation'
          }
        });
        return;
      }

      next();
    };
  };

  /**
   * Company access validation middleware
   * Ensures user can only access their company's resources
   */
  validateCompanyAccess = (req: Request, res: Response, next: NextFunction): void => {
    
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Extract company ID from request (body, params, or query)
    const requestCompanyId = req.body?.companyId || req.params?.companyId || req.query?.companyId;
    
    if (!requestCompanyId) {
      res.status(400).json({
        error: {
          code: 'MISSING_COMPANY_ID',
          message: 'Company ID is required'
        }
      });
      return;
    }

    // Allow admin users to access any company
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user belongs to the requested company
    if (req.user.companyId !== requestCompanyId) {
      this.logger.warn('Company access denied', {
        userId: req.user.id,
        userCompanyId: req.user.companyId,
        requestedCompanyId: requestCompanyId,
        endpoint: req.path
      });
      
      res.status(403).json({
        error: {
          code: 'COMPANY_ACCESS_DENIED',
          message: 'Access denied to company resources'
        }
      });
      return;
    }

    next();
  };

  /**
   * Request sanitization middleware
   * Removes potentially harmful content from requests
   */
  sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
    
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }

    next();
  };

  /**
   * Validate JWT token (mock implementation)
   * In production, this would use a proper JWT library
   * @param token - JWT token to validate
   * @returns User object or null
   */
  private validateToken(token: string): any | null {
    // Mock implementation - in real app, use jsonwebtoken library
    try {
      // For demo purposes, accept any token that looks like base64
      if (token.length > 10) {
        return {
          id: 'user123',
          email: 'user@example.com',
          companyId: 'comp1',
          role: 'user'
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Recursively sanitize an object
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          // Remove potential XSS content
          sanitized[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }
}
