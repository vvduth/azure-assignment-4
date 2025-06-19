/**
 * Enhanced type definitions for Leasing Agreement system
 * Includes proper validation, error handling, and business rules
 */

// Core domain types with enhanced safety
export interface LeasingAgreement {
  readonly id: string;
  readonly employeeId: string;
  readonly itemId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: AgreementStatus;
  readonly price: number;
  readonly currency: CurrencyCode;
  readonly companyId: string;
  readonly paymentSchedule: PaymentSchedule[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Strict enum types for better type safety
export type AgreementStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
export type EmployeeType = 'STANDARD' | 'PREMIUM' | 'VIP';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';

// Payment schedule with enhanced tracking
export interface PaymentSchedule {
  readonly id: string;
  readonly dueDate: Date;
  readonly amount: number;
  readonly status: PaymentStatus;
  readonly paymentId?: string;
  readonly attemptCount: number;
  readonly lastAttemptDate?: Date;
}

// Request/Response DTOs for API layer
export interface CreateAgreementRequest {
  readonly employeeId: string;
  readonly itemId: string;
  readonly startDate: string; // ISO date string
  readonly endDate: string;   // ISO date string
  readonly price: number;
  readonly currency: CurrencyCode;
  readonly companyId: string;
  readonly paymentFrequency: PaymentFrequency;
  readonly metadata?: Record<string, unknown>;
}

export interface AgreementResponse {
  readonly id: string;
  readonly status: AgreementStatus;
  readonly totalCost: number;
  readonly paymentSchedule: PaymentScheduleResponse[];
  readonly createdAt: string;
}

export interface PaymentScheduleResponse {
  readonly id: string;
  readonly dueDate: string;
  readonly amount: number;
  readonly status: PaymentStatus;
}

// Error types for better error handling
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public readonly rule: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

// Configuration interfaces
export interface LeasingConfig {
  readonly maxLeasingDuration: number;
  readonly minLeasingDuration: number;
  readonly maxPrice: number;
  readonly supportedCurrencies: CurrencyCode[];
  readonly employeeDiscounts: Record<EmployeeType, number>;
  readonly longTermDiscount: number;
  readonly longTermThreshold: number;
}

// Service interfaces for dependency injection
export interface ILeasingRepository {
  save(agreement: LeasingAgreement): Promise<LeasingAgreement>;
  findById(id: string): Promise<LeasingAgreement | null>;
  findByEmployeeId(employeeId: string): Promise<LeasingAgreement[]>;
}

export interface INotificationService {
  sendAgreementCreated(employeeId: string, agreementId: string): Promise<void>;
  sendPaymentDue(employeeId: string, payment: PaymentSchedule): Promise<void>;
}

export interface IInventoryService {
  reserveItem(itemId: string): Promise<boolean>;
  releaseItem(itemId: string): Promise<void>;
  checkAvailability(itemId: string): Promise<boolean>;
}

export interface IBillingService {
  createBillingRecord(agreement: LeasingAgreement): Promise<string>;
  updateBillingRecord(agreementId: string, status: AgreementStatus): Promise<void>;
}

export interface IEmployeeService {
  getEmployeeType(employeeId: string): Promise<EmployeeType>;
  validateEmployee(employeeId: string, companyId: string): Promise<boolean>;
}
