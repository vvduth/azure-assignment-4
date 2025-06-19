# Architecture Diagram: Enhanced Leasing Agreement System

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Web Applications  │  Mobile Apps  │  Third-party Systems  │  Admin Dashboard  │
└─────────────────────┬───────────────┬─────────────────────┬──────────────────────┘
                      │               │                     │
                      └───────────────┼─────────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────────────┐
│                                 API GATEWAY                                     │
├─────────────────────────────────────┼─────────────────────────────────────────────┤
│  Rate Limiting  │  Load Balancing  │  SSL/TLS  │  Request Routing  │  Monitoring │
└─────────────────────────────────────┼─────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────────────┐
│                             SECURITY LAYER                                      │
├─────────────────────────────────────┼─────────────────────────────────────────────┤
│  Helmet Headers  │  CORS  │  JWT Auth  │  Input Sanitization  │  Rate Limiting  │
└─────────────────────────────────────┼─────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────────────┐
│                            APPLICATION LAYER                                    │
├─────────────────────────────────────┼─────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         CONTROLLERS                                     │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  LeasingAgreementController                                             │    │
│  │  ├── createAgreement()                                                  │    │
│  │  ├── getAgreement()                                                     │    │
│  │  └── getEmployeeAgreements()                                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         VALIDATORS                                      │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  Validator Class                                                        │    │
│  │  ├── validateCreateAgreementRequest()                                   │    │
│  │  ├── validateDateRange()                                                │    │
│  │  ├── validatePrice()                                                    │    │
│  │  └── sanitizeString()                                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         SERVICES                                        │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │  LeasingAgreementService                                                │    │
│  │  ├── processLeasingAgreement()                                          │    │
│  │  ├── calculateLeasingCost()                                             │    │
│  │  ├── generatePaymentSchedule()                                          │    │
│  │  ├── executeAgreementTransaction()                                      │    │
│  │  └── validateBusinessRules()                                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────────┐
│                            INTEGRATION LAYER                                    │
├──────────────────────────────────────┼──────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Repository    │  │   Notification  │  │   Inventory     │  │   Billing   │  │
│  │   Interface     │  │   Interface     │  │   Interface     │  │   Interface │  │
│  │                 │  │                 │  │                 │  │             │  │
│  │ ILeasingRepo    │  │ INotification   │  │ IInventory      │  │ IBilling    │  │
│  │ ├── save()      │  │ Service         │  │ Service         │  │ Service     │  │
│  │ ├── findById()  │  │ ├── sendAgree   │  │ ├── reserve     │  │ ├── create  │  │
│  │ └── findBy      │  │ │   mentCreated │  │ │   Item()       │  │ │   Billing │  │
│  │     Employee()  │  │ └── sendPayment │  │ ├── releaseItem │  │ │   Record() │  │
│  │                 │  │     Due()       │  │ └── checkAvail  │  │ └── update  │  │
│  │                 │  │                 │  │     ability()   │  │     Billing │  │
│  │                 │  │                 │  │                 │  │     Record()│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│           │                       │                       │               │      │
└───────────┼───────────────────────┼───────────────────────┼───────────────┼──────┘
            │                       │                       │               │
┌───────────┼───────────────────────┼───────────────────────┼───────────────┼──────┐
│                              EXTERNAL SERVICES                                  │
├───────────┼───────────────────────┼───────────────────────┼───────────────┼──────┤
│           │                       │                       │               │      │
│  ┌────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼──────┐  ┌─────▼───┐ │
│  │   PostgreSQL    │    │   Email/SMS      │    │   Inventory    │  │ Billing │ │
│  │   Database      │    │   Service        │    │   Management   │  │ System  │ │
│  │                 │    │                  │    │   System       │  │         │ │
│  │ ├── agreements  │    │ ├── Send emails  │    │ ├── Item       │  │ ├── Pay │ │
│  │ ├── payments    │    │ ├── Send SMS     │    │ │   tracking   │  │ │   ment │ │
│  │ ├── employees   │    │ └── Push notifs  │    │ ├── Availabil  │  │ │   proc │ │
│  │ └── companies   │    │                  │    │ │   ity check  │  │ │   ess  │ │
│  │                 │    │                  │    │ └── Reserva    │  │ └── Inv │ │
│  └─────────────────┘    └──────────────────┘    │     tion mgmt  │  │     oic │ │
│                                                 └────────────────┘  │     ing │ │
│                                                                     └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### 1. Agreement Creation Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │ Controller  │    │   Service   │    │ Repository  │
│             │    │             │    │             │    │             │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│             │    │             │    │             │    │             │
│ POST /api/  │───▶│ Validate    │───▶│ Process     │───▶│ Save        │
│ agreements  │    │ Request     │    │ Agreement   │    │ Agreement   │
│             │    │             │    │             │    │             │
│             │◀───│ Return      │◀───│ Return      │◀───│ Return      │
│             │    │ Response    │    │ Result      │    │ Saved Data  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Transaction Management Flow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRANSACTION EXECUTION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Begin Transaction                                                           │
│     ├── Validate Business Rules                                                │
│     ├── Reserve Inventory Item                                                 │
│     │   └── [Rollback Point 1]                                                 │
│     │                                                                           │
│  2. Execute Core Operations                                                     │
│     ├── Save Agreement to Database                                             │
│     ├── Create Billing Record                                                  │
│     │   └── [Rollback Point 2]                                                 │
│     │                                                                           │
│  3. Complete Transaction                                                        │
│     ├── Send Notifications (Non-critical)                                      │
│     ├── Update Agreement Status                                                │
│     └── Commit Transaction                                                     │
│                                                                                 │
│  Error Handling:                                                               │
│  ├── Any failure triggers rollback                                             │
│  ├── Operations reversed in LIFO order                                         │
│  └── Error logged with correlation ID                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Security Architecture

### Authentication & Authorization Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │ Security    │    │ Controller  │    │   Service   │
│             │    │ Middleware  │    │             │    │             │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│             │    │             │    │             │    │             │
│ Request +   │───▶│ Validate    │───▶│ Process     │───▶│ Execute     │
│ JWT Token   │    │ JWT Token   │    │ Request     │    │ Business    │
│             │    │             │    │             │    │ Logic       │
│             │    │ Check       │    │             │    │             │
│             │    │ Permissions │    │             │    │             │
│             │    │             │    │             │    │             │
│             │    │ Validate    │    │             │    │             │
│             │    │ Company     │    │             │    │             │
│             │    │ Access      │    │             │    │             │
│             │    │             │    │             │    │             │
│ 401/403 ◀───────│ Reject      │    │             │    │             │
│ or          │    │ Invalid     │    │             │    │             │
│ Success ◀───────│ Auth        │◀───│ Return      │◀───│ Return      │
│ Response    │    │             │    │ Response    │    │ Result      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Security Layers
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                SECURITY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Layer 7: Business Logic Security                                              │
│  ├── Company-level data isolation                                              │
│  ├── Role-based operation permissions                                          │
│  └── Business rule validation                                                  │
│                                                                                 │
│  Layer 6: Application Security                                                 │
│  ├── Input validation and sanitization                                         │
│  ├── Output encoding                                                           │
│  └── Error handling without information leakage                                │
│                                                                                 │
│  Layer 5: Authentication & Authorization                                       │
│  ├── JWT token validation                                                      │
│  ├── Role-based access control (RBAC)                                          │
│  └── Session management                                                        │
│                                                                                 │
│  Layer 4: API Security                                                         │
│  ├── Rate limiting (100 req/15min)                                             │
│  ├── Request size limits                                                       │
│  └── API versioning and deprecation                                            │
│                                                                                 │
│  Layer 3: Transport Security                                                   │
│  ├── HTTPS/TLS encryption                                                      │
│  ├── Security headers (Helmet)                                                 │
│  └── CORS configuration                                                        │
│                                                                                 │
│  Layer 2: Network Security                                                     │
│  ├── Firewall rules                                                            │
│  ├── VPC/Subnet isolation                                                      │
│  └── Load balancer security                                                    │
│                                                                                 │
│  Layer 1: Infrastructure Security                                              │
│  ├── Server hardening                                                          │
│  ├── Database encryption                                                       │
│  └── Secret management                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Request Processing Pipeline
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            REQUEST PROCESSING PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐                  │
│  │   Incoming    │───▶│   Security    │───▶│   Request     │                  │
│  │   Request     │    │   Validation  │    │   Parsing     │                  │
│  └───────────────┘    └───────────────┘    └───────────────┘                  │
│                                                      │                         │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────▼───┐              │
│  │   Input       │───▶│   Business    │───▶│   Controller      │              │
│  │   Validation  │    │   Logic       │    │   Processing      │              │
│  └───────────────┘    └───────────────┘    └───────────────────┘              │
│                                                      │                         │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────▼───┐              │
│  │   External    │◀───│   Transaction │◀───│   Service         │              │
│  │   Services    │    │   Management  │    │   Orchestration   │              │
│  └───────────────┘    └───────────────┘    └───────────────────┘              │
│                                                      │                         │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────▼───┐              │
│  │   Response    │◀───│   Error       │◀───│   Response       │              │
│  │   Formatting  │    │   Handling    │    │   Generation     │              │
│  └───────────────┘    └───────────────┘    └───────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability Architecture

### Logging & Metrics Flow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          OBSERVABILITY ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Application Layer                                                              │
│  ├── Structured Logging (JSON format)                                          │
│  ├── Correlation ID tracking                                                   │
│  ├── Performance metrics                                                       │
│  └── Error tracking                                                            │
│                         │                                                       │
│                         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        LOG AGGREGATION                                 │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Request Logs   │  Error Logs   │  Performance Logs  │  Security Logs   │   │
│  │  ├── Duration   │  ├── Stack     │  ├── Response     │  ├── Auth        │   │
│  │  ├── Status     │  │   traces    │  │   times        │  │   failures    │   │
│  │  ├── User ID    │  ├── Context   │  ├── Memory       │  ├── Rate limit  │   │
│  │  └── Endpoint   │  └── Payload   │  │   usage        │  │   violations  │   │
│  │                 │                │  └── DB queries   │  └── Suspicious  │   │
│  │                 │                │                   │      activity    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                         │                                                       │
│                         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      MONITORING STACK                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Dashboards     │  Alerting      │  Health Checks   │  Audit Trails    │   │
│  │  ├── API        │  ├── Error     │  ├── Service     │  ├── User        │   │
│  │  │   metrics    │  │   rates     │  │   health      │  │   actions     │   │
│  │  ├── Response   │  ├── Response  │  ├── Database    │  ├── System      │   │
│  │  │   times      │  │   times     │  │   health      │  │   changes     │   │
│  │  ├── Error      │  ├── System    │  ├── External    │  └── Security    │   │
│  │  │   rates      │  │   resources  │  │   services   │      events      │   │
│  │  └── User       │  └── Security  │  └── Memory/CPU  │                  │   │
│  │      activity   │      events    │                  │                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Production Deployment Overview
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION ENVIRONMENT                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         LOAD BALANCER                                   │   │
│  │  ├── SSL Termination                                                    │   │
│  │  ├── Request Routing                                                    │   │
│  │  ├── Health Checks                                                      │   │
│  │  └── DDoS Protection                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      APPLICATION SERVERS                                │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Instance 1      │  Instance 2      │  Instance 3      │  Instance N    │   │
│  │  ├── Node.js     │  ├── Node.js     │  ├── Node.js     │  ├── Node.js   │   │
│  │  ├── Express     │  ├── Express     │  ├── Express     │  ├── Express   │   │
│  │  ├── App Logic   │  ├── App Logic   │  ├── App Logic   │  ├── App Logic │   │
│  │  └── Monitoring  │  └── Monitoring  │  └── Monitoring  │  └── Monitoring│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  Primary DB     │  Read Replicas   │  Redis Cache     │  File Storage   │   │
│  │  ├── PostgreSQL │  ├── PostgreSQL  │  ├── Session     │  ├── Logs       │   │
│  │  ├── Master     │  │   Slaves      │  │   Store       │  ├── Backups    │   │
│  │  ├── ACID       │  ├── Read-only   │  ├── Rate Limit  │  └── Static     │   │
│  │  │   Compliance │  └── Load        │  │   Store       │      Assets     │   │
│  │  └── Backups    │      Distribution │  └── Temporary  │                 │   │
│  │                 │                   │      Data       │                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling Architecture
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SCALING STRATEGY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Application Tier Scaling:                                                     │
│  ├── Stateless application servers                                             │
│  ├── Container orchestration (Docker + Kubernetes)                             │
│  ├── Auto-scaling based on CPU/Memory/Request metrics                          │
│  └── Blue-green deployment for zero-downtime updates                           │
│                                                                                 │
│  Database Tier Scaling:                                                        │
│  ├── Read replicas for read-heavy workloads                                    │
│  ├── Connection pooling to optimize database connections                       │
│  ├── Database sharding for write-heavy workloads (future)                     │
│  └── Caching layer (Redis) to reduce database load                             │
│                                                                                 │
│  External Service Integration:                                                 │
│  ├── Circuit breaker pattern for resilience                                    │
│  ├── Retry mechanisms with exponential backoff                                 │
│  ├── Bulkhead pattern for service isolation                                    │
│  └── Timeout configuration for all external calls                              │
│                                                                                 │
│  Caching Strategy:                                                             │
│  ├── Application-level caching for frequently accessed data                    │
│  ├── Database query result caching                                             │
│  ├── API response caching for read-heavy endpoints                             │
│  └── CDN for static assets                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

This architecture provides a comprehensive, secure, and scalable foundation for the leasing agreement system with proper separation of concerns, comprehensive error handling, and enterprise-grade security features.
