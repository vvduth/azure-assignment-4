# Enhanced Leasing Agreement Processing System

A comprehensive, enterprise-grade leasing agreement management system built with TypeScript, Express, and modern security practices.

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd azure-assignment-4
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📋 Features

### 🔒 Security Features
- **JWT Authentication** with role-based authorization
- **Rate Limiting** (100 requests per 15 minutes)
- **Input Validation** and sanitization
- **XSS Protection** via Helmet security headers
- **CORS Configuration** for cross-origin requests
- **Company-level data isolation**

### 💼 Business Features
- **Comprehensive Agreement Management** with validation
- **Dynamic Pricing** with employee discounts (Standard, Premium, VIP)
- **Flexible Payment Scheduling** (Monthly, Quarterly, Annual)
- **Transaction Management** with rollback support
- **Real-time Inventory Integration**
- **Automated Notifications**
- **Billing System Integration**

### 🔧 Technical Features
- **TypeScript** for type safety
- **Structured Logging** with correlation IDs
- **Comprehensive Error Handling**
- **Unit Testing** with high coverage
- **Configuration Management**
- **Health Monitoring**
- **Dependency Injection** ready architecture

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Code Review](./CODE_REVIEW.md)** - Detailed analysis of improvements
- **[Implementation Guide](./IMPLEMENTATION_EXPLANATION.md)** - Changes and reasoning
- **[Architecture Diagram](./ARCHITECTURE.md)** - System architecture overview

## 🏗️ Project Structure

```
azure-assignment-4/
├── src/
│   ├── config/             # Configuration management
│   ├── controllers/        # HTTP request handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── app.ts             # Express application setup
│   └── index.ts           # Application entry point
├── tests/                  # Unit and integration tests
├── docs/                   # Documentation files
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Test configuration
└── .env.example           # Environment variables template
```

## 🔧 API Endpoints

### Create Leasing Agreement
```http
POST /api/v1/agreements
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "emp123",
  "itemId": "laptop-001",
  "startDate": "2025-07-01T00:00:00.000Z",
  "endDate": "2025-12-01T00:00:00.000Z",
  "price": 1000.00,
  "currency": "USD",
  "companyId": "comp123",
  "paymentFrequency": "MONTHLY"
}
```

### Health Check
```http
GET /health
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run linting
npm run lint
```

### Test Coverage
- **Unit Tests** for all business logic
- **Integration Tests** for API endpoints
- **Error Scenario Testing** for edge cases
- **Mock Services** for external dependencies

## 🔒 Security Implementation

### Authentication Flow
1. Client sends JWT token in Authorization header
2. Security middleware validates token
3. User context extracted and attached to request
4. Role-based authorization applied
5. Company-level access control enforced

### Input Validation
- **Required Field Validation**
- **Data Type Validation**
- **Format Validation** (dates, currencies, IDs)
- **Business Rule Validation**
- **XSS Prevention** through sanitization

### Rate Limiting
- **100 requests per 15-minute window**
- **Per-IP address tracking**
- **Configurable limits**
- **Proper error responses**

## 🏆 Key Improvements Made

### From Original Code:
- ❌ No input validation → ✅ Comprehensive validation
- ❌ No authentication → ✅ JWT-based auth with RBAC
- ❌ Console.log errors → ✅ Structured logging
- ❌ No transaction management → ✅ Full transaction support
- ❌ Hardcoded values → ✅ Configuration-driven
- ❌ No error handling → ✅ Comprehensive error handling
- ❌ No tests → ✅ High test coverage
- ❌ Tight coupling → ✅ Dependency injection
- ❌ No security → ✅ Enterprise-grade security

## 📊 Performance Features

### Optimizations
- **Efficient Payment Calculation** with proper rounding
- **Transaction Rollback** for failed operations
- **Async Processing** with proper error handling
- **Memory Management** preventing leaks
- **Connection Pooling** ready architecture

### Monitoring
- **Health Check Endpoint**
- **Request/Response Logging**
- **Performance Metrics**
- **Error Rate Tracking**
- **Correlation ID Tracking**

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+ (for caching)
- SSL certificate

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-key
DB_HOST=your-db-host
DB_PASSWORD=your-db-password
REDIS_HOST=your-redis-host
```

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📈 Scalability

### Horizontal Scaling
- **Stateless application design**
- **Load balancer ready**
- **Database read replicas**
- **Redis caching layer**
- **Container orchestration ready**

### Performance Considerations
- Connection pooling for database
- Caching for frequently accessed data
- Async processing for non-critical operations
- Proper indexing strategies
- CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using TypeScript, Express, and modern development practices.**
