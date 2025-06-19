/**
 * Input validation utilities with comprehensive business rule validation
 * Provides type-safe validation with detailed error messages
 */

import { ValidationError, CreateAgreementRequest, CurrencyCode, PaymentFrequency } from '../types';

// Core validation utilities
export class Validator {
  
  /**
   * Validates create agreement request with comprehensive checks
   * @param request - The request to validate
   * @returns Promise<void> - Throws ValidationError if invalid
   */
  static async validateCreateAgreementRequest(request: CreateAgreementRequest): Promise<void> {
    // Basic required field validation
    if (!request.employeeId?.trim()) {
      throw new ValidationError('Employee ID is required', 'employeeId', 'REQUIRED');
    }
    
    if (!request.itemId?.trim()) {
      throw new ValidationError('Item ID is required', 'itemId', 'REQUIRED');
    }
    
    if (!request.companyId?.trim()) {
      throw new ValidationError('Company ID is required', 'companyId', 'REQUIRED');
    }

    // Date validation with business rules
    const startDate = this.validateAndParseDate(request.startDate, 'startDate');
    const endDate = this.validateAndParseDate(request.endDate, 'endDate');
    
    this.validateDateRange(startDate, endDate);
    
    // Financial validation
    this.validatePrice(request.price);
    this.validateCurrency(request.currency);
    this.validatePaymentFrequency(request.paymentFrequency);
    
    // ID format validation
    this.validateIdFormat(request.employeeId, 'employeeId');
    this.validateIdFormat(request.itemId, 'itemId');
    this.validateIdFormat(request.companyId, 'companyId');
  }

  /**
   * Validates and parses ISO date string
   * @param dateString - ISO date string to parse
   * @param fieldName - Field name for error reporting
   * @returns Date - Parsed date object
   */
  private static validateAndParseDate(dateString: string, fieldName: string): Date {
    if (!dateString?.trim()) {
      throw new ValidationError(`${fieldName} is required`, fieldName, 'REQUIRED');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${fieldName} must be a valid ISO date`, fieldName, 'INVALID_FORMAT');
    }

    return date;
  }

  /**
   * Validates date range follows business rules
   * @param startDate - Agreement start date
   * @param endDate - Agreement end date
   */
  private static validateDateRange(startDate: Date, endDate: Date): void {
    const now = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(now.getFullYear() + 5); // Max 5 years in future

    // Start date cannot be in the past (allow same day)
    if (startDate < new Date(now.toDateString())) {
      throw new ValidationError('Start date cannot be in the past', 'startDate', 'PAST_DATE');
    }

    // End date must be after start date
    if (endDate <= startDate) {
      throw new ValidationError('End date must be after start date', 'endDate', 'INVALID_RANGE');
    }

    // Maximum lease duration is 5 years
    if (endDate > maxFutureDate) {
      throw new ValidationError('Lease duration cannot exceed 5 years', 'endDate', 'DURATION_EXCEEDED');
    }

    // Minimum lease duration is 30 days
    const minEndDate = new Date(startDate);
    minEndDate.setDate(startDate.getDate() + 30);
    
    if (endDate < minEndDate) {
      throw new ValidationError('Minimum lease duration is 30 days', 'endDate', 'DURATION_TOO_SHORT');
    }
  }

  /**
   * Validates price follows business rules
   * @param price - Price to validate
   */
  private static validatePrice(price: number): void {
    if (typeof price !== 'number' || isNaN(price)) {
      throw new ValidationError('Price must be a valid number', 'price', 'INVALID_TYPE');
    }

    if (price <= 0) {
      throw new ValidationError('Price must be greater than zero', 'price', 'INVALID_VALUE');
    }

    if (price > 1000000) { // Max $1M
      throw new ValidationError('Price cannot exceed $1,000,000', 'price', 'EXCEEDS_LIMIT');
    }

    // Check for reasonable decimal places (max 2)
    if (price.toString().includes('.') && price.toString().split('.')[1].length > 2) {
      throw new ValidationError('Price cannot have more than 2 decimal places', 'price', 'INVALID_PRECISION');
    }
  }

  /**
   * Validates currency code
   * @param currency - Currency code to validate
   */
  private static validateCurrency(currency: string): void {
    const supportedCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CAD'];
    
    if (!supportedCurrencies.includes(currency as CurrencyCode)) {
      throw new ValidationError(
        `Currency must be one of: ${supportedCurrencies.join(', ')}`, 
        'currency', 
        'UNSUPPORTED_CURRENCY'
      );
    }
  }

  /**
   * Validates payment frequency
   * @param frequency - Payment frequency to validate
   */
  private static validatePaymentFrequency(frequency: string): void {
    const validFrequencies: PaymentFrequency[] = ['MONTHLY', 'QUARTERLY', 'ANNUALLY'];
    
    if (!validFrequencies.includes(frequency as PaymentFrequency)) {
      throw new ValidationError(
        `Payment frequency must be one of: ${validFrequencies.join(', ')}`, 
        'paymentFrequency', 
        'INVALID_FREQUENCY'
      );
    }
  }

  /**
   * Validates ID format (UUID or alphanumeric)
   * @param id - ID to validate
   * @param fieldName - Field name for error reporting
   */
  private static validateIdFormat(id: string, fieldName: string): void {
    // Allow UUID format or alphanumeric with hyphens/underscores
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (id.length < 3 || id.length > 50) {
      throw new ValidationError(
        `${fieldName} must be between 3 and 50 characters`, 
        fieldName, 
        'INVALID_LENGTH'
      );
    }

    if (!idPattern.test(id)) {
      throw new ValidationError(
        `${fieldName} contains invalid characters`, 
        fieldName, 
        'INVALID_FORMAT'
      );
    }
  }

  /**
   * Sanitizes string input to prevent XSS
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  /**
   * Validates metadata object
   * @param metadata - Metadata to validate
   */
  static validateMetadata(metadata?: Record<string, unknown>): void {
    if (!metadata) return;

    // Limit metadata size
    const serialized = JSON.stringify(metadata);
    if (serialized.length > 10000) { // 10KB limit
      throw new ValidationError('Metadata size cannot exceed 10KB', 'metadata', 'SIZE_EXCEEDED');
    }

    // Check for suspicious content
    if (serialized.includes('<script>') || serialized.includes('javascript:')) {
      throw new ValidationError('Metadata contains prohibited content', 'metadata', 'PROHIBITED_CONTENT');
    }
  }
}
