# Leasing Agreement Processing System - API Documentation

## Overview
This enhanced leasing agreement system provides secure, scalable, and maintainable APIs for managing employee equipment leasing agreements. The system includes comprehensive validation, error handling, security features, and proper transaction management.

## Features

### Security Features
- JWT-based authentication
- Role-based authorization
- Rate limiting (100 requests per 15 minutes)
- Request sanitization and XSS protection
- CORS configuration
- Security headers via Helmet
- Input validation and sanitization

### Business Features
- Comprehensive leasing agreement management
- Dynamic pricing with employee discounts
- Flexible payment scheduling (monthly, quarterly, annually)
- Transaction-based operations with rollback support
- Real-time inventory management
- Automated notifications
- Billing integration

### Technical Features
- TypeScript for type safety
- Structured logging with correlation IDs
- Comprehensive error handling
- Unit testing with high coverage
- Configuration management
- Health checks and monitoring
- Dependency injection ready

## API Endpoints

### Authentication
All endpoints except `/health` require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Health Check
```http
GET /health
```
Returns server health status and basic information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-19T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### Create Leasing Agreement
```http
POST /api/v1/agreements
```

Creates a new leasing agreement with comprehensive validation and business rule enforcement.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "employeeId": "emp123",
  "itemId": "laptop-001",
  "startDate": "2025-07-01T00:00:00.000Z",
  "endDate": "2025-12-01T00:00:00.000Z",
  "price": 1000.00,
  "currency": "USD",
  "companyId": "comp123",
  "paymentFrequency": "MONTHLY",
  "metadata": {
    "department": "Engineering",
    "manager": "john.doe"
  }
}
```

**Validation Rules:**
- `employeeId`: Required, 3-50 characters, alphanumeric with hyphens/underscores
- `itemId`: Required, 3-50 characters, alphanumeric with hyphens/underscores  
- `startDate`: Required, ISO date string, cannot be in the past
- `endDate`: Required, ISO date string, must be after startDate
- `price`: Required, positive number, max $1,000,000, max 2 decimal places
- `currency`: Required, one of: USD, EUR, GBP, CAD
- `companyId`: Required, 3-50 characters
- `paymentFrequency`: Required, one of: MONTHLY, QUARTERLY, ANNUALLY
- Minimum lease duration: 30 days
- Maximum lease duration: 5 years

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "LA-1687534200000-abc123def",
    "status": "ACTIVE",
    "totalCost": 900.00,
    "paymentSchedule": [
      {
        "id": "LA-1687534200000-abc123def-payment-1",
        "dueDate": "2025-07-01T00:00:00.000Z",
        "amount": 180.00,
        "status": "PENDING"
      }
    ],
    "createdAt": "2025-06-19T10:30:00.000Z"
  },
  "correlationId": "req-1687534200000-xyz789"
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Employee ID is required",
    "field": "employeeId",
    "correlationId": "req-1687534200000-xyz789"
  }
}
```

**409 Conflict - Business Rule Error:**
```json
{
  "error": {
    "code": "BUSINESS_RULE_ERROR",
    "message": "Requested item is not available for leasing",
    "correlationId": "req-1687534200000-xyz789"
  }
}
```

### Get Agreement
```http
GET /api/v1/agreements/:id
```

Retrieves a specific leasing agreement by ID.

**Parameters:**
- `id`: Agreement ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Agreement retrieval endpoint - implementation pending",
  "correlationId": "req-1687534200000-xyz789"
}
```

### Get Employee Agreements
```http
GET /api/v1/employees/:employeeId/agreements
```

Retrieves all agreements for a specific employee. Requires manager role or higher.

**Parameters:**
- `employeeId`: Employee ID

**Headers:**
- `Authorization: Bearer <token>` (user must have 'manager' or 'admin' role)

## Authentication & Authorization

### Roles
- `user`: Can create and view own agreements
- `manager`: Can view employee agreements within their company
- `admin`: Full access to all resources

### Company Access Control
Users can only access resources within their own company unless they have admin role.

## Error Handling

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName", // For validation errors
    "correlationId": "unique-request-id"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `BUSINESS_RULE_ERROR`: Business rule validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting
- **Limit**: 100 requests per 15-minute window per IP address
- **Headers**: Rate limit info included in response headers
- **Reset**: Window resets every 15 minutes

## Security Considerations

### Input Validation
- All inputs are validated and sanitized
- XSS protection implemented
- SQL injection prevention (parameterized queries)
- Maximum request size limits enforced

### Authentication
- JWT tokens with configurable expiration
- Secure token validation
- Protected endpoints require valid authentication

### Authorization
- Role-based access control
- Company-level resource isolation
- Audit logging for security events

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leasing_db
DB_USER=postgres
DB_PASSWORD=password

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_MAX=100

# Business Rules
MAX_PRICE=1000000
LONG_TERM_DISCOUNT=0.8
```

## Development

### Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run tests
npm test

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Monitoring

### Health Checks
- `/health` endpoint for service health monitoring
- Includes server status, timestamp, and version info

### Logging
- Structured JSON logging
- Correlation IDs for request tracking
- Error logging with stack traces
- Performance metrics (request duration)

### Metrics
All requests include:
- Correlation ID for tracing
- Request duration timing
- User context (when authenticated)
- Error details (for failed requests)

## Production Deployment

### Security Checklist
- [ ] Change default JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS/TLS
- [ ] Configure rate limiting appropriately
- [ ] Set up proper logging aggregation
- [ ] Configure monitoring and alerting
- [ ] Set up database connection pooling
- [ ] Configure proper backup strategies

### Performance Considerations
- Database indexes on frequently queried fields
- Connection pooling for database and Redis
- Caching layer for frequently accessed data
- Load balancing for high availability
- CDN for static assets if applicable
