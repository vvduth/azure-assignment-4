/**
 * Enhanced Leasing Agreement Service with proper error handling,
 * transaction management, and business rule enforcement
 */

import { 
  LeasingAgreement, 
  CreateAgreementRequest, 
  PaymentSchedule, 
  PaymentFrequency,
  EmployeeType,
  ValidationError,
  BusinessRuleError,
  LeasingConfig,
  ILeasingRepository,
  INotificationService,
  IInventoryService,
  IBillingService,
  IEmployeeService
} from '../types';
import { Validator } from '../utils/validation';
import { Logger } from '../utils/logger';

/**
 * Main service class for leasing agreement operations
 * Implements proper transaction handling and business rules
 */
export class LeasingAgreementService {
  
  constructor(
    private readonly repository: ILeasingRepository,
    private readonly notificationService: INotificationService,
    private readonly inventoryService: IInventoryService,
    private readonly billingService: IBillingService,
    private readonly employeeService: IEmployeeService,
    private readonly config: LeasingConfig,
    private readonly logger: Logger
  ) {}

  /**
   * Process new leasing agreement with full transaction support
   * @param request - Agreement creation request
   * @returns Promise<LeasingAgreement> - Created agreement
   */
  async processLeasingAgreement(request: CreateAgreementRequest): Promise<LeasingAgreement> {
    const correlationId = this.generateCorrelationId();
    
    try {
      this.logger.info('Processing leasing agreement', { 
        correlationId, 
        employeeId: request.employeeId,
        itemId: request.itemId 
      });

      // Step 1: Validate input thoroughly
      await Validator.validateCreateAgreementRequest(request);
      
      // Step 2: Business rule validation
      await this.validateBusinessRules(request);
      
      // Step 3: Create agreement object
      const agreement = await this.createAgreementFromRequest(request);
      
      // Step 4: Execute transaction with rollback capability
      return await this.executeAgreementTransaction(agreement, correlationId);
      
    } catch (error:any) {
      this.logger.error('Failed to process leasing agreement', { 
        correlationId, 
        error: error.message,
        request 
      });
      throw error;
    }
  }

  /**
   * Calculate total leasing cost with business rules
   * @param price - Base price
   * @param startDate - Lease start date
   * @param endDate - Lease end date  
   * @param employeeType - Employee type for discounts
   * @returns Promise<number> - Total calculated cost
   */
  async calculateLeasingCost(
    price: number, 
    startDate: Date, 
    endDate: Date, 
    employeeType: EmployeeType
  ): Promise<number> {
    
    // Calculate duration in months
    const durationMonths = this.calculateDurationInMonths(startDate, endDate);
    
    // Apply long-term discount if applicable
    const longTermMultiplier = durationMonths >= this.config.longTermThreshold 
      ? this.config.longTermDiscount 
      : 1.0;
    
    // Apply employee type discount
    const employeeMultiplier = this.config.employeeDiscounts[employeeType] || 1.0;
    
    // Calculate final cost
    const totalCost = price * longTermMultiplier * employeeMultiplier;
    
    this.logger.info('Cost calculation completed', {
      basePrice: price,
      durationMonths,
      longTermMultiplier,
      employeeMultiplier,
      totalCost
    });
    
    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate payment schedule based on frequency and duration
   * @param agreement - Leasing agreement
   * @param frequency - Payment frequency
   * @returns Promise<PaymentSchedule[]> - Generated payment schedule
   */
  async generatePaymentSchedule(
    agreement: LeasingAgreement, 
    frequency: PaymentFrequency
  ): Promise<PaymentSchedule[]> {
    
    const schedules: PaymentSchedule[] = [];
    const totalAmount = agreement.price;
    
    // Calculate payment intervals based on frequency
    const intervalMonths = this.getIntervalMonths(frequency);
    const totalPayments = Math.ceil(
      this.calculateDurationInMonths(agreement.startDate, agreement.endDate) / intervalMonths
    );
    
    // Calculate payment amount (distribute evenly)
    const paymentAmount = Math.round((totalAmount / totalPayments) * 100) / 100;
    let remainingAmount = totalAmount;
    
    // Generate payment schedule
    let currentDate = new Date(agreement.startDate);
    
    for (let i = 0; i < totalPayments; i++) {
      // Last payment gets any remainder due to rounding
      const amount = i === totalPayments - 1 ? remainingAmount : paymentAmount;
      
      schedules.push({
        id: `${agreement.id}-payment-${i + 1}`,
        dueDate: new Date(currentDate),
        amount,
        status: 'PENDING',
        attemptCount: 0
      });
      
      remainingAmount -= amount;
      
      // Move to next payment date
      currentDate.setMonth(currentDate.getMonth() + intervalMonths);
    }
    
    this.logger.info('Payment schedule generated', {
      agreementId: agreement.id,
      totalPayments,
      frequency,
      totalAmount
    });
    
    return schedules;
  }

  /**
   * Validate business rules for agreement creation
   * @param request - Agreement request to validate
   */
  private async validateBusinessRules(request: CreateAgreementRequest): Promise<void> {
    
    // Validate employee exists and belongs to company
    const isValidEmployee = await this.employeeService.validateEmployee(
      request.employeeId, 
      request.companyId
    );
    
    if (!isValidEmployee) {
      throw new BusinessRuleError(
        'Employee does not exist or does not belong to specified company',
        'EMPLOYEE_VALIDATION',
        'INVALID_EMPLOYEE'
      );
    }
    
    // Check item availability
    const isItemAvailable = await this.inventoryService.checkAvailability(request.itemId);
    
    if (!isItemAvailable) {
      throw new BusinessRuleError(
        'Requested item is not available for leasing',
        'ITEM_AVAILABILITY',
        'ITEM_UNAVAILABLE'
      );
    }
    
    // Validate price limits
    if (request.price > this.config.maxPrice) {
      throw new BusinessRuleError(
        `Price exceeds maximum allowed amount of ${this.config.maxPrice}`,
        'PRICE_LIMIT',
        'PRICE_EXCEEDED'
      );
    }
  }

  /**
   * Create agreement object from validated request
   * @param request - Validated request
   * @returns Promise<LeasingAgreement> - Created agreement object
   */
  private async createAgreementFromRequest(request: CreateAgreementRequest): Promise<LeasingAgreement> {
    
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const employeeType = await this.employeeService.getEmployeeType(request.employeeId);
    
    // Calculate total cost with discounts
    const totalCost = await this.calculateLeasingCost(
      request.price, 
      startDate, 
      endDate, 
      employeeType
    );
      // Generate payment schedule first
    const tempAgreement = {
      id: this.generateAgreementId(),
      employeeId: request.employeeId,
      itemId: request.itemId,
      startDate,
      endDate,
      status: 'DRAFT' as const,
      price: totalCost,
      currency: request.currency,
      companyId: request.companyId,
      paymentSchedule: [] as PaymentSchedule[],
      metadata: request.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const paymentSchedule = await this.generatePaymentSchedule(
      tempAgreement as LeasingAgreement, 
      request.paymentFrequency
    );
    
    // Create final agreement with payment schedule
    const agreement: LeasingAgreement = {
      ...tempAgreement,
      paymentSchedule
    };
    
    return agreement;
  }

  /**
   * Execute agreement creation transaction with rollback capability
   * @param agreement - Agreement to create
   * @param correlationId - Correlation ID for tracking
   * @returns Promise<LeasingAgreement> - Created agreement
   */
  private async executeAgreementTransaction(
    agreement: LeasingAgreement, 
    correlationId: string
  ): Promise<LeasingAgreement> {
    
    const operations: (() => Promise<void>)[] = [];
    
    try {
      // Step 1: Reserve inventory item
      await this.inventoryService.reserveItem(agreement.itemId);
      operations.push(() => this.inventoryService.releaseItem(agreement.itemId));
      
      // Step 2: Save agreement to database
      const savedAgreement = await this.repository.save({
        ...agreement,
        status: 'PENDING'
      });
      
      // Step 3: Create billing record
      const billingId = await this.billingService.createBillingRecord(savedAgreement);
      this.logger.info('Billing record created', { agreementId: savedAgreement.id, billingId });
      
      // Step 4: Send notification (non-critical, don't rollback for this)
      try {
        await this.notificationService.sendAgreementCreated(
          savedAgreement.employeeId, 
          savedAgreement.id
        );
      } catch (notificationError:any) {
        this.logger.warn('Notification failed but agreement created', { 
          correlationId,
          error: notificationError.message 
        });
      }
      
      // Update status to active
      const finalAgreement = await this.repository.save({
        ...savedAgreement,
        status: 'ACTIVE',
        updatedAt: new Date()
      });
      
      this.logger.info('Agreement processed successfully', { 
        correlationId,
        agreementId: finalAgreement.id 
      });
      
      return finalAgreement;
      
    } catch (error) {
      // Rollback operations in reverse order
      for (const rollback of operations.reverse()) {
        try {
          await rollback();
        } catch (rollbackError:any) {
          this.logger.error('Rollback failed', { 
            correlationId,
            error: rollbackError.message 
          });
        }
      }
      
      throw error;
    }
  }

  /**
   * Calculate duration between dates in months
   * @param startDate - Start date
   * @param endDate - End date
   * @returns number - Duration in months
   */
  private calculateDurationInMonths(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Get interval months for payment frequency
   * @param frequency - Payment frequency
   * @returns number - Months between payments
   */
  private getIntervalMonths(frequency: PaymentFrequency): number {
    switch (frequency) {
      case 'MONTHLY': return 1;
      case 'QUARTERLY': return 3;
      case 'ANNUALLY': return 12;
      default: return 1;
    }
  }

  /**
   * Generate unique agreement ID
   * @returns string - Unique agreement ID
   */
  private generateAgreementId(): string {
    return `LA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID for request tracking
   * @returns string - Unique correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
