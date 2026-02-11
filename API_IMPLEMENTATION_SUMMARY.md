# Steeze API - Implementation Summary

## Overview
This document summarizes the implementation of Phases 1 and 2 of the Steeze platform. The API is built with NestJS, Prisma ORM, and PostgreSQL.

## Completed Phases

### ✅ Phase 1: Foundation
- Monorepo setup with pnpm + Turborepo
- NestJS API with comprehensive Prisma schema
- Complete authentication system (JWT-based)
- User management module
- Docker Compose for local development
- Shared types package
- Database seeding

### ✅ Phase 2: Core Marketplace
- Designer profiles and management
- Design catalog with customization options
- Complete order lifecycle management
- Open Tailor measurements integration
- Price calculation engine
- Search and filtering capabilities

## API Endpoints

All endpoints are prefixed with `/api/v1/`

### Authentication (`/auth`)
- `POST /register` - Register new user (customer or designer)
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /me` - Get current user info

### Users (`/users`)
- `GET /me` - Get own profile
- `PATCH /me` - Update own profile
- `GET /:id/public` - Get public user profile
- `GET /me/addresses` - List own addresses
- `POST /me/addresses` - Add new address
- `PATCH /me/addresses/:id` - Update address
- `DELETE /me/addresses/:id` - Delete address

### Designers (`/designers`)
- `GET /` - List all designers (public, paginated)
- `GET /:slug` - Get designer profile by slug
- `GET /:slug/designs` - List designer's designs
- `PATCH /me` - Update own designer profile (designer only)
- `GET /me/orders` - List received orders (designer only)
- `GET /me/earnings` - Get earnings summary (designer only)

### Designs (`/designs`)
- `POST /` - Create design (designer only)
- `GET /` - List all published designs (public, with filters)
- `GET /:id` - Get design details
- `PATCH /:id` - Update design (designer only)
- `DELETE /:id` - Soft delete design (designer only)

#### Fabric Options
- `POST /:id/fabrics` - Add fabric option
- `PATCH /:id/fabrics/:fabricId` - Update fabric option
- `DELETE /:id/fabrics/:fabricId` - Remove fabric option

#### Add-ons
- `POST /:id/addons` - Add add-on
- `PATCH /:id/addons/:addonId` - Update add-on
- `DELETE /:id/addons/:addonId` - Remove add-on

#### Size Pricing
- `POST /:id/size-pricing` - Add size pricing
- `PATCH /:id/size-pricing/:pricingId` - Update size pricing
- `DELETE /:id/size-pricing/:pricingId` - Remove size pricing

### Orders (`/orders`)
- `POST /` - Create order (customer only)
- `GET /` - List own orders (customer or designer)
- `GET /:id` - Get order details
- `GET /:id/status-history` - Get order status history

#### Designer Actions
- `PATCH /:id/accept` - Accept order
- `PATCH /:id/reject` - Reject order
- `PATCH /:id/in-progress` - Mark as in progress
- `PATCH /:id/ready` - Mark as ready for pickup

#### Admin Actions
- `PATCH /:id/picked-up` - Mark as picked up
- `PATCH /:id/in-transit` - Mark as in transit
- `PATCH /:id/delivered` - Mark as delivered

#### Customer Actions
- `PATCH /:id/confirm` - Confirm satisfaction
- `PATCH /:id/cancel` - Cancel order (before accepted)

### Measurements (`/measurements`)
- `POST /link` - Link Open Tailor email
- `GET /mine` - Get own measurements
- `POST /create` - Create measurements in Open Tailor
- `PUT /update` - Update measurements in Open Tailor

## Database Schema

### Core Models
- **User** - User accounts with role-based access
- **Address** - User delivery addresses
- **DesignerProfile** - Designer-specific information
- **Design** - Product catalog items
- **DesignImage** - Design photos
- **FabricOption** - Available fabric choices
- **DesignAddOn** - Optional add-ons (embroidery, etc.)
- **SizePricing** - Size-based price adjustments
- **Order** - Customer orders with complete pricing
- **OrderFabricSelection** - Selected fabric for order
- **OrderAddOnSelection** - Selected add-ons for order
- **OrderStatusHistory** - Audit trail of status changes
- **Payment** - Payment and escrow tracking
- **WalletTransaction** - Financial transaction log
- **Rating** - Bidirectional ratings
- **ReturnRequest** - Return requests
- **Notification** - User notifications
- **PlatformSetting** - Admin-configurable settings

### Enums
- **UserRole**: CUSTOMER, DESIGNER, ADMIN
- **OrderStatus**: 16 states covering full lifecycle
- **PaymentStatus**: PENDING, HELD_IN_ESCROW, RELEASED, REFUNDED, PARTIALLY_REFUNDED
- **TransactionType**: ESCROW_HOLD, ESCROW_RELEASE, REFUND, COMMISSION_DEDUCTION, RETURN_FEE_DEDUCTION, WITHDRAWAL
- **NotificationType**: ORDER_UPDATE, PAYMENT_UPDATE, RATING_RECEIVED, RETURN_UPDATE, SYSTEM

## Business Logic

### Price Calculation
```
totalPrice = basePrice 
           + fabricPriceAdjustment 
           + sizePriceAdjustment 
           + SUM(addOns) 
           + deliveryFee

platformCommission = totalPrice * (commission_percentage / 100)
designerEarnings = totalPrice - platformCommission
```

### Order Status Flow
```
PENDING_PAYMENT → PAID → ACCEPTED → IN_PROGRESS → READY_FOR_PICKUP
→ PICKED_UP → IN_TRANSIT → DELIVERED → CONFIRMED
```

Alternative paths:
- `PAID → REJECTED` (designer rejects)
- `PENDING_PAYMENT/PAID → CANCELLED` (customer cancels)
- `DELIVERED → RETURN_REQUESTED → ... → RETURNED` (return flow)
- `DELIVERED → AUTO_CONFIRMED` (2 days with no action)

### Role-Based Access Control
- **Guards**: JwtAuthGuard, RolesGuard
- **Decorators**: @Roles(), @CurrentUser()
- All endpoints properly secured with appropriate role checks

## Technical Features

### Authentication & Security
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Request validation with class-validator
- Global exception handling

### API Quality
- Swagger/OpenAPI documentation at `/api/docs`
- Global response transformation
- Pagination support (default: 20 items/page)
- Search and filtering capabilities
- Comprehensive error handling

### External Integrations
- **Open Tailor API** - Body measurements service
  - Link user accounts
  - Fetch/create/update measurements
  - Snapshot measurements on order creation

### Development Setup
- Docker Compose for local infrastructure
- Hot-reload development mode
- Environment-based configuration
- Prisma migrations and seeding

## Configuration

### Required Environment Variables
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
OPEN_TAILOR_API_URL=http://localhost:3000
```

### Optional Configuration
- Email (SMTP settings)
- Payment gateway (Paystack/Stripe)
- File storage (Cloudinary/S3)
- Firebase (push notifications)

## Testing

### Running the API
```bash
# Install dependencies
pnpm install

# Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# Run migrations
pnpm db:migrate

# Seed database
pnpm --filter api exec prisma db seed

# Start API
pnpm --filter api dev
```

### Access Points
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Health check: http://localhost:3001/api/v1

## Next Steps (Phase 3)

The following features are ready to implement in Phase 3:

1. **Payments Module**
   - Paystack integration
   - Escrow hold on payment
   - Fund release on confirmation
   - Refund processing

2. **Wallet Transactions**
   - Complete transaction tracking
   - Earnings calculation
   - Commission deductions

3. **Auto-confirmation CRON**
   - Scheduled task to auto-confirm orders after 2 days
   - Automatic fund release

All the Prisma models and business logic foundations are already in place for these features.

---

## ✅ Phase 3: Payments + Escrow (COMPLETED)

### Implemented Features

#### 1. Payments Module with Paystack Integration

**PaystackService** (`apps/api/src/modules/payments/paystack.service.ts`)
- Initialize transactions via Paystack API
- Verify transactions by reference
- Webhook signature verification (HMAC SHA512)
- Generate unique payment references

**PaymentsService** (`apps/api/src/modules/payments/payments.service.ts`)
- Payment initialization with comprehensive order validation
- Webhook processing for payment events
- Payment verification
- Escrow management
- Automatic fund release

**PaymentsController** (`apps/api/src/modules/payments/payments.controller.ts`)
- `POST /api/v1/payments/initialize` - Initialize payment for an order
- `POST /api/v1/payments/webhook` - Handle Paystack webhooks
- `GET /api/v1/payments/verify/:reference` - Verify payment by reference

#### 2. Escrow Management

**Payment Flow:**
1. Customer initiates payment → Paystack checkout page
2. Paystack webhook notifies on success → Order status: PAID
3. Payment record created with status: HELD_IN_ESCROW
4. WalletTransaction created: ESCROW_HOLD

**Escrow Hold Process:**
- Payment amount held when order is paid
- Creates audit trail in WalletTransaction table
- Links payment to order for tracking

#### 3. Fund Release Logic

**Manual Confirmation (Customer):**
- Customer confirms satisfaction after delivery
- Order status → CONFIRMED
- Payment status → RELEASED
- Creates WalletTransaction: ESCROW_RELEASE (designer earnings)
- Creates WalletTransaction: COMMISSION_DEDUCTION (platform fee)

**Auto-Confirmation (System):**
- OrderTasksService runs hourly CRON job
- Finds orders delivered > 2 days ago
- Auto-confirms and releases funds
- Order status → AUTO_CONFIRMED

**Fund Release Calculations:**
```typescript
designerEarnings = totalPrice - platformCommission
platformCommission = totalPrice * (commission_percentage / 100)
```

#### 4. Wallet Transaction Tracking

Complete financial audit trail with transaction types:
- `ESCROW_HOLD` - Payment received and held
- `ESCROW_RELEASE` - Funds released to designer
- `COMMISSION_DEDUCTION` - Platform commission
- `REFUND` - Payment refunded to customer
- `RETURN_FEE_DEDUCTION` - Return courier fee charged to designer
- `WITHDRAWAL` - Designer withdraws earnings

#### 5. Auto-Confirmation CRON Job

**OrderTasksService** (`apps/api/src/modules/orders/order-tasks.service.ts`)
- Scheduled with `@Cron(CronExpression.EVERY_HOUR)`
- Queries orders with status DELIVERED
- Checks if `deliveredAt + 2 days < now()`
- Auto-confirms orders and releases funds
- Creates status history for audit trail

**Configuration:**
- Auto-confirm days configurable via PlatformSetting
- Default: 2 days from delivery

### API Endpoints (Phase 3)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/payments/initialize` | Initialize payment for an order | Yes (Customer) |
| POST | `/api/v1/payments/webhook` | Receive Paystack webhook | No (signature verified) |
| GET | `/api/v1/payments/verify/:reference` | Verify payment status | Yes |

### Technical Implementation Details

**Architecture Decisions:**
- Avoided circular dependencies between OrdersModule and PaymentsModule
- Fund release logic integrated directly in OrdersService
- All financial operations wrapped in database transactions
- Idempotent payment processing

**Security:**
- Webhook signature verification prevents spoofing
- Payment amount validated against order total
- Order ownership validated before payment initialization
- Webhook payload validated before processing

**Error Handling:**
- Failed payments logged but don't block workflow
- Webhook errors logged and can be replayed
- Transaction rollback on any failure during fund release

### Configuration

**Environment Variables:**
```env
PAYSTACK_SECRET_KEY=sk_test_xxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxx
PLATFORM_URL=https://steeze.com
```

**Platform Settings:**
- `commission_percentage` - Platform commission (default: 10%)
- `auto_confirm_days` - Days until auto-confirm (default: 2)

### Testing Checklist

- [x] Build compiles without errors
- [x] No circular dependencies
- [x] All modules load correctly
- [x] API server starts successfully
- [x] Payment endpoints registered
- [ ] End-to-end payment flow (requires Paystack test keys)
- [ ] Webhook processing (requires ngrok/public URL)
- [ ] Fund release on confirmation
- [ ] Auto-confirmation CRON execution
- [ ] Wallet transaction creation

### Next Steps (Phase 4)

Phase 4 will implement:
1. **Returns Module** - Handle return requests and courier dispatch
2. **Ratings Module** - Bidirectional ratings after transaction completion
3. **Refund Processing** - Automatic refunds for returns
4. **Return Fee Deduction** - Charge designer for return courier costs

## Code Quality

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Modular architecture with clear separation of concerns
- DTOs for all request/response validation
- Services contain business logic, controllers are thin
- Proper error handling and logging

## API Documentation

Full interactive API documentation is available at `/api/docs` when the API is running. It includes:
- All endpoints with descriptions
- Request/response schemas
- Authentication requirements
- Example requests

---

## ✅ Phase 4: Returns + Ratings (COMPLETED)

### Implemented Features

#### 1. Returns Module

**ReturnsService** (`apps/api/src/modules/returns/returns.service.ts`)
- Customer return request creation (within 2 days of delivery)
- Admin return request approval/rejection
- Return courier dispatch tracking
- Complete return processing with refund and fee deduction
- Comprehensive validation and authorization checks

**ReturnsController** (`apps/api/src/modules/returns/returns.controller.ts`)
- `POST /api/v1/returns/orders/:orderId/return` - Customer request return
- `GET /api/v1/returns` - List all return requests (admin)
- `GET /api/v1/returns/:id` - Get return request details (admin)
- `PATCH /api/v1/returns/:id/approve` - Approve return (admin)
- `PATCH /api/v1/returns/:id/reject` - Reject return (admin)
- `PATCH /api/v1/returns/:id/pickup-dispatched` - Mark courier dispatched (admin)
- `PATCH /api/v1/returns/:id/returned` - Complete return (admin)

#### 2. Return Request Lifecycle

**Return Flow:**
```
DELIVERED → RETURN_REQUESTED → RETURN_PICKUP → RETURN_IN_TRANSIT → RETURNED
```

**Business Rules:**
1. Customers can request returns within 2 days of delivery
2. Return requests start in PENDING status
3. Admin can approve or reject return requests
4. Approved returns trigger courier dispatch for pickup
5. Completed returns trigger full refund to customer
6. Return courier fee is deducted from designer's balance

**Return Fee Deduction:**
- Return courier fee retrieved from `PlatformSetting` (key: `return_courier_fee`)
- Default: NGN 2,500 if not configured
- Deducted from designer via `RETURN_FEE_DEDUCTION` wallet transaction
- Customer receives full refund via `REFUND` wallet transaction

#### 3. Ratings Module

**RatingsService** (`apps/api/src/modules/ratings/ratings.service.ts`)
- Bidirectional rating creation (customer ↔ designer)
- Rating validation (only after order confirmation)
- Designer average rating calculation
- Rating statistics and distribution
- Comprehensive ownership and authorization checks

**RatingsController** (`apps/api/src/modules/ratings/ratings.controller.ts`)
- `POST /api/v1/ratings/orders/:orderId/rate` - Rate the other party
- `GET /api/v1/ratings/users/:userId` - Get ratings received by user
- `GET /api/v1/ratings/orders/:orderId` - Get ratings for an order
- `GET /api/v1/ratings/designers/:designerProfileId/stats` - Get rating statistics

#### 4. Bidirectional Rating System

**Rating Flow:**
- Both customer and designer can rate each other after order is CONFIRMED or AUTO_CONFIRMED
- Each party can submit one rating per order
- Ratings include score (1-5) and optional comment (max 500 chars)
- Designer's average rating is automatically updated when they receive new ratings

**Rating Constraints:**
- `@@unique([orderId, raterId])` - One rating per user per order
- Only after order status: CONFIRMED or AUTO_CONFIRMED
- Rater must be part of the order (customer or designer)
- Automatic validation prevents duplicate ratings

#### 5. Designer Average Rating

**Calculation:**
```typescript
totalScore = sum of all rating scores
averageRating = totalScore / totalRatings
// Stored rounded to 2 decimal places
```

**Updates:**
- Recalculated whenever designer receives a new rating
- Stored in `DesignerProfile.averageRating`
- Used for displaying designer reputation
- Available via rating statistics endpoint

### API Endpoints (Phase 4)

#### Returns Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/returns/orders/:orderId/return` | Request return (2-day window) | Customer only |
| GET | `/api/v1/returns` | List return requests | Admin only |
| GET | `/api/v1/returns/:id` | Get return details | Admin only |
| PATCH | `/api/v1/returns/:id/approve` | Approve return | Admin only |
| PATCH | `/api/v1/returns/:id/reject` | Reject return | Admin only |
| PATCH | `/api/v1/returns/:id/pickup-dispatched` | Mark courier dispatched | Admin only |
| PATCH | `/api/v1/returns/:id/returned` | Complete return with refund | Admin only |

#### Ratings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/ratings/orders/:orderId/rate` | Rate the other party | Customer or Designer |
| GET | `/api/v1/ratings/users/:userId` | Get user's ratings | Authenticated |
| GET | `/api/v1/ratings/orders/:orderId` | Get order ratings | Order participant |
| GET | `/api/v1/ratings/designers/:designerProfileId/stats` | Get rating stats | Authenticated |

### Technical Implementation Details

**Transaction Safety:**
- All return operations wrapped in database transactions
- Return fee deduction and customer refund atomic
- Status history tracking for audit trail
- Order status transitions validated

**Date Validation:**
- Uses `date-fns` library for date calculations
- 2-day return window validated with `subDays()` function
- Delivery timestamp required for return requests

**Authorization:**
- Returns: Customer can only request for own orders
- Ratings: Users can only rate orders they're part of
- Admin-only operations properly guarded
- Order ownership validated before any operation

**Error Handling:**
- Comprehensive validation with descriptive error messages
- Status validation prevents invalid state transitions
- Ownership checks prevent unauthorized access
- Duplicate rating prevention with unique constraint

### Configuration

**Platform Settings:**
- `return_courier_fee` - Flat fee for return courier (default: 2500 NGN)
- Used in `ReturnsService.markReturned()` method

**Dependencies:**
- `date-fns` - Date manipulation and validation library
- Added to `apps/api/package.json`

### Database Schema Usage

**Models:**
- `ReturnRequest` - Return request lifecycle tracking
- `Rating` - Bidirectional ratings storage
- `OrderStatusHistory` - Status change audit trail
- `WalletTransaction` - Financial transaction tracking
- `PlatformSetting` - Configurable platform values

**Enums:**
- `OrderStatus` - Includes return states (RETURN_REQUESTED, RETURN_PICKUP, etc.)
- `TransactionType` - Includes REFUND and RETURN_FEE_DEDUCTION
- `PaymentStatus` - Includes REFUNDED status

### Testing Checklist

- [x] Build compiles without errors
- [x] No circular dependencies
- [x] All modules load correctly
- [x] API server starts successfully
- [x] Return endpoints registered
- [x] Rating endpoints registered
- [ ] End-to-end return flow (requires running DB)
- [ ] End-to-end rating flow (requires running DB)
- [ ] Return 2-day window validation
- [ ] Refund processing verification
- [ ] Designer average rating calculation
- [ ] Duplicate rating prevention

### Next Steps (Phase 5+)

Future phases can implement:
1. **Notifications Module** - Notify users of returns, ratings, etc.
2. **Admin Dashboard** - UI for managing returns and viewing ratings
3. **Mobile App** - Customer/designer interfaces for returns and ratings
4. **Email Notifications** - Automated emails for return status updates
5. **Push Notifications** - Real-time updates for ratings received

## Code Quality

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Modular architecture with clear separation of concerns
- DTOs for all request/response validation
- Services contain business logic, controllers are thin
- Proper error handling and logging
- Comprehensive validation and authorization

## API Documentation

Full interactive API documentation is available at `/api/docs` when the API is running. It includes:
- All endpoints with descriptions
- Request/response schemas
- Authentication requirements
- Example requests
- **New:** Returns and Ratings endpoints with full documentation
