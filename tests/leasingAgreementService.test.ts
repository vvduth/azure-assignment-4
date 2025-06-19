/**
 * Comprehensive unit tests for Leasing Agreement Service
 * Tests business logic, error handling, and edge cases
 */

import { LeasingAgreementService } from '../src/services/leasingAgreementService';
import { 
  CreateAgreementRequest, 
  LeasingAgreement,
  EmployeeType,
  ValidationError,
  BusinessRuleError,
  LeasingConfig,
  ILeasingRepository,
  INotificationService,
  IInventoryService,
  IBillingService,
  IEmployeeService
} from '../src/types';
import { Logger } from '../src/utils/logger';

// Mock implementations for dependencies
class MockLeasingRepository implements ILeasingRepository {
  private agreements: Map<string, LeasingAgreement> = new Map();
  
  async save(agreement: LeasingAgreement): Promise<LeasingAgreement> {
    this.agreements.set(agreement.id, agreement);
    return agreement;
  }
  
  async findById(id: string): Promise<LeasingAgreement | null> {
    return this.agreements.get(id) || null;
  }
  
  async findByEmployeeId(employeeId: string): Promise<LeasingAgreement[]> {
    return Array.from(this.agreements.values())
      .filter(a => a.employeeId === employeeId);
  }
}

class MockNotificationService implements INotificationService {
  public sentNotifications: Array<{ employeeId: string; agreementId: string }> = [];
  public sentPaymentNotifications: Array<{ employeeId: string; paymentId: string }> = [];
  
  async sendAgreementCreated(employeeId: string, agreementId: string): Promise<void> {
    this.sentNotifications.push({ employeeId, agreementId });
  }
  
  async sendPaymentDue(employeeId: string, payment: any): Promise<void> {
    this.sentPaymentNotifications.push({ employeeId, paymentId: payment.id });
  }
}

class MockInventoryService implements IInventoryService {
  private reservedItems: Set<string> = new Set();
  private availableItems: Set<string> = new Set(['item1', 'item2', 'item3']);
  
  async reserveItem(itemId: string): Promise<boolean> {
    if (this.availableItems.has(itemId) && !this.reservedItems.has(itemId)) {
      this.reservedItems.add(itemId);
      return true;
    }
    return false;
  }
  
  async releaseItem(itemId: string): Promise<void> {
    this.reservedItems.delete(itemId);
  }
  
  async checkAvailability(itemId: string): Promise<boolean> {
    return this.availableItems.has(itemId) && !this.reservedItems.has(itemId);
  }
}

class MockBillingService implements IBillingService {
  public billingRecords: Array<{ agreementId: string; billingId: string }> = [];
  
  async createBillingRecord(agreement: LeasingAgreement): Promise<string> {
    const billingId = `bill-${agreement.id}`;
    this.billingRecords.push({ agreementId: agreement.id, billingId });
    return billingId;
  }
  
  async updateBillingRecord(agreementId: string, status: any): Promise<void> {
    // Mock implementation
  }
}

class MockEmployeeService implements IEmployeeService {
  private employees: Map<string, { type: EmployeeType; companyId: string }> = new Map();
  
  constructor() {
    this.employees.set('emp1', { type: 'STANDARD', companyId: 'comp1' });
    this.employees.set('emp2', { type: 'PREMIUM', companyId: 'comp1' });
    this.employees.set('emp3', { type: 'VIP', companyId: 'comp2' });
  }
  
  async getEmployeeType(employeeId: string): Promise<EmployeeType> {
    return this.employees.get(employeeId)?.type || 'STANDARD';
  }
  
  async validateEmployee(employeeId: string, companyId: string): Promise<boolean> {
    const employee = this.employees.get(employeeId);
    return employee?.companyId === companyId;
  }
}

// Test configuration
const testConfig: LeasingConfig = {
  maxLeasingDuration: 60,
  minLeasingDuration: 1,
  maxPrice: 1000000,
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
  employeeDiscounts: {
    STANDARD: 1.0,
    PREMIUM: 0.9,
    VIP: 0.8
  },
  longTermDiscount: 0.8,
  longTermThreshold: 12
};

describe('LeasingAgreementService', () => {
  let service: LeasingAgreementService;
  let mockRepository: MockLeasingRepository;
  let mockNotificationService: MockNotificationService;
  let mockInventoryService: MockInventoryService;
  let mockBillingService: MockBillingService;
  let mockEmployeeService: MockEmployeeService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRepository = new MockLeasingRepository();
    mockNotificationService = new MockNotificationService();
    mockInventoryService = new MockInventoryService();
    mockBillingService = new MockBillingService();
    mockEmployeeService = new MockEmployeeService();
    mockLogger = new Logger('TestService');
    
    service = new LeasingAgreementService(
      mockRepository,
      mockNotificationService,
      mockInventoryService,
      mockBillingService,
      mockEmployeeService,
      testConfig,
      mockLogger
    );
  });

  describe('processLeasingAgreement', () => {
    
    it('should create agreement successfully with valid input', async () => {
      const request: CreateAgreementRequest = {
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        price: 1000,
        currency: 'USD',
        companyId: 'comp1',
        paymentFrequency: 'MONTHLY'
      };

      const result = await service.processLeasingAgreement(request);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe('emp1');
      expect(result.status).toBe('ACTIVE');
      expect(result.paymentSchedule.length).toBeGreaterThan(0);
      expect(mockNotificationService.sentNotifications).toHaveLength(1);
      expect(mockBillingService.billingRecords).toHaveLength(1);
    });

    it('should throw ValidationError for invalid employee ID', async () => {
      const request: CreateAgreementRequest = {
        employeeId: '',
        itemId: 'item1',
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        price: 1000,
        currency: 'USD',
        companyId: 'comp1',
        paymentFrequency: 'MONTHLY'
      };

      await expect(service.processLeasingAgreement(request))
        .rejects.toThrow(ValidationError);
    });

    it('should throw BusinessRuleError for unavailable item', async () => {
      const request: CreateAgreementRequest = {
        employeeId: 'emp1',
        itemId: 'unavailable-item',
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        price: 1000,
        currency: 'USD',
        companyId: 'comp1',
        paymentFrequency: 'MONTHLY'
      };

      await expect(service.processLeasingAgreement(request))
        .rejects.toThrow(BusinessRuleError);
    });

    it('should throw BusinessRuleError for employee-company mismatch', async () => {
      const request: CreateAgreementRequest = {
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        price: 1000,
        currency: 'USD',
        companyId: 'wrong-company',
        paymentFrequency: 'MONTHLY'
      };

      await expect(service.processLeasingAgreement(request))
        .rejects.toThrow(BusinessRuleError);
    });
  });

  describe('calculateLeasingCost', () => {
    
    it('should calculate cost correctly for standard employee', async () => {
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-12-01');
      
      const cost = await service.calculateLeasingCost(1000, startDate, endDate, 'STANDARD');
      
      expect(cost).toBe(1000); // No discounts for standard employee, short term
    });

    it('should apply premium employee discount', async () => {
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-12-01');
      
      const cost = await service.calculateLeasingCost(1000, startDate, endDate, 'PREMIUM');
      
      expect(cost).toBe(900); // 10% discount for premium employee
    });

    it('should apply VIP employee discount', async () => {
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-12-01');
      
      const cost = await service.calculateLeasingCost(1000, startDate, endDate, 'VIP');
      
      expect(cost).toBe(800); // 20% discount for VIP employee
    });

    it('should apply long-term discount for leases over 12 months', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2026-06-01'); // 17 months
      
      const cost = await service.calculateLeasingCost(1000, startDate, endDate, 'STANDARD');
      
      expect(cost).toBe(800); // 20% long-term discount
    });

    it('should apply both employee and long-term discounts', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2026-06-01'); // 17 months
      
      const cost = await service.calculateLeasingCost(1000, startDate, endDate, 'PREMIUM');
      
      expect(cost).toBe(720); // 10% employee discount + 20% long-term discount
    });
  });

  describe('generatePaymentSchedule', () => {
    
    it('should generate monthly payment schedule correctly', async () => {
      const agreement: LeasingAgreement = {
        id: 'test-id',
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-01'), // 5 months
        status: 'DRAFT',
        price: 1000,
        currency: 'USD',
        companyId: 'comp1',
        paymentSchedule: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const schedule = await service.generatePaymentSchedule(agreement, 'MONTHLY');
      
      expect(schedule).toHaveLength(5); // 5 monthly payments
      expect(schedule[0].amount).toBe(200); // 1000 / 5
      expect(schedule.every(p => p.status === 'PENDING')).toBe(true);
    });

    it('should generate quarterly payment schedule correctly', async () => {
      const agreement: LeasingAgreement = {
        id: 'test-id',
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-01-01'), // 12 months
        status: 'DRAFT',
        price: 1200,
        currency: 'USD',
        companyId: 'comp1',
        paymentSchedule: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const schedule = await service.generatePaymentSchedule(agreement, 'QUARTERLY');
      
      expect(schedule).toHaveLength(4); // 4 quarterly payments
      expect(schedule[0].amount).toBe(300); // 1200 / 4
    });

    it('should handle payment amount rounding correctly', async () => {
      const agreement: LeasingAgreement = {
        id: 'test-id',
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-04-01'), // 3 months
        status: 'DRAFT',
        price: 100, // Will create payments of 33.33 each
        currency: 'USD',
        companyId: 'comp1',
        paymentSchedule: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const schedule = await service.generatePaymentSchedule(agreement, 'MONTHLY');
      
      expect(schedule).toHaveLength(3);
      
      // First two payments should be 33.33, last payment gets remainder
      expect(schedule[0].amount).toBe(33.33);
      expect(schedule[1].amount).toBe(33.33);
      expect(schedule[2].amount).toBe(33.34); // Gets the extra cent
      
      // Total should equal original price
      const total = schedule.reduce((sum, p) => sum + p.amount, 0);
      expect(total).toBe(100);
    });
  });

  describe('error handling and rollback', () => {
    
    it('should rollback inventory reservation on billing failure', async () => {
      // Mock billing service to fail
      mockBillingService.createBillingRecord = jest.fn().mockRejectedValue(new Error('Billing failed'));
      
      const request: CreateAgreementRequest = {
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-12-01T00:00:00.000Z',
        price: 1000,
        currency: 'USD',
        companyId: 'comp1',
        paymentFrequency: 'MONTHLY'
      };

      await expect(service.processLeasingAgreement(request))
        .rejects.toThrow('Billing failed');
      
      // Item should be available again after rollback
      const isAvailable = await mockInventoryService.checkAvailability('item1');
      expect(isAvailable).toBe(true);
    });
  });

  describe('edge cases', () => {
    
    it('should handle leap year calculations correctly', async () => {
      const startDate = new Date('2024-02-29'); // Leap year
      const endDate = new Date('2025-02-28');
      
      const cost = await service.calculateLeasingCost(1000, startDate, endDate, 'STANDARD');
      
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should handle very short lease periods', async () => {
      const request: CreateAgreementRequest = {
        employeeId: 'emp1',
        itemId: 'item1',
        startDate: '2025-07-01T00:00:00.000Z',
        endDate: '2025-08-01T00:00:00.000Z', // 1 month
        price: 100,
        currency: 'USD',
        companyId: 'comp1',
        paymentFrequency: 'MONTHLY'
      };

      const result = await service.processLeasingAgreement(request);
      
      expect(result.paymentSchedule).toHaveLength(1);
      expect(result.paymentSchedule[0].amount).toBe(100);
    });
  });
});
