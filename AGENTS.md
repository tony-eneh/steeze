# AGENTS.md — Steeze Platform Implementation Guide

> **Steeze** is a marketplace platform connecting fashion designers with customers — think Upwork/Shopify for bespoke fashion. Customers browse designer catalogs, customize fabric/options, place orders with body measurements, and receive courier-delivered garments. The platform handles payments (escrow), logistics, dispute resolution, and ratings.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [API Design (NestJS)](#5-api-design-nestjs)
6. [Admin App (Angular)](#6-admin-app-angular)
7. [Client Mobile App (Ionic)](#7-client-mobile-app-ionic)
8. [Landing Page (Angular)](#8-landing-page-angular)
9. [Business Logic & Workflows](#9-business-logic--workflows)
10. [External Integrations](#10-external-integrations)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Implementation Phases](#12-implementation-phases)
13. [Testing Strategy](#13-testing-strategy)
14. [DevOps & Deployment](#14-devops--deployment)
15. [Conventions & Standards](#15-conventions--standards)

---

## 1. Project Overview

### What Steeze Does

- **Fashion designers** create profiles, upload design catalogs with photos, set base prices, define available fabrics/colors, optional add-ons (embroidery, custom buttons, etc.), and size-based pricing.
- **Customers** browse designs, select fabric/color/options, provide body measurements (via Open Tailor integration), and place orders.
- **Steeze (the platform)** holds payment in escrow, coordinates courier pickup from designer's shop, delivers to customer, and releases funds after customer confirms satisfaction.
- **Ratings** are bidirectional — designers rate customers and customers rate designers, unlocked only after a confirmed completed transaction.
- **Returns** are supported within 2 days of delivery. Steeze dispatches courier for pickup and return. Additional courier costs for unsatisfactory work are deducted from the designer's held funds. The flat return-courier fee is configurable by Steeze admins.

### User Roles

| Role | Description |
|------|-------------|
| `CUSTOMER` | Browses designs, places orders, provides measurements, rates designers |
| `DESIGNER` | Creates designs, manages orders, marks items as ready, rates customers |
| `ADMIN` | Manages platform settings, courier fees, resolves disputes, views analytics |
| `COURIER` | (Future) Assigned pickups/deliveries, updates delivery status |

### Core Business Rules

1. Customers pay upfront; funds are held in escrow by the platform.
2. Designer marks order as "ready for pickup" → Steeze dispatches courier to designer's shop.
3. Courier delivers to customer → order status becomes "delivered."
4. Customer has 2 calendar days from delivery to either confirm satisfaction or request a return.
5. If customer confirms → funds are released to designer (minus platform commission).
6. If customer requests return within 2 days → Steeze dispatches courier to pick up from customer and return to designer. Return courier fee (flat, set by admin) is deducted from designer's balance.
7. If 2 days pass with no action → order auto-confirms and funds release.
8. After confirmation (or auto-confirmation), both parties can leave ratings for each other.
9. Platform commission percentage is configurable by admin.
10. Return courier flat fee is configurable by admin.

---

## 2. Monorepo Structure

```
steeze/
├── AGENTS.md                          # This file
├── package.json                       # Root workspace config
├── pnpm-workspace.yaml                # pnpm workspace definition
├── turbo.json                         # Turborepo pipeline config
├── .gitignore
├── .env.example                       # Root env template
├── .eslintrc.js                       # Root ESLint config
├── .prettierrc                        # Root Prettier config
│
├── apps/
│   ├── api/                           # NestJS backend API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/               # Shared utilities, guards, decorators, pipes, filters
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── current-user.decorator.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── validation.pipe.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   └── dto/
│   │   │   │       └── pagination.dto.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/              # Authentication (signup, login, token refresh, password reset)
│   │   │   │   ├── users/             # User profiles, addresses, measurement links
│   │   │   │   ├── designers/         # Designer profiles, shop info, portfolio
│   │   │   │   ├── designs/           # Design CRUD, fabric options, add-ons, size pricing
│   │   │   │   ├── orders/            # Order lifecycle, status transitions
│   │   │   │   ├── payments/          # Escrow, fund release, refunds, commission calc
│   │   │   │   ├── ratings/           # Bidirectional ratings post-transaction
│   │   │   │   ├── returns/           # Return requests, courier dispatch, fee deduction
│   │   │   │   ├── delivery/          # Delivery tracking, courier assignment
│   │   │   │   ├── notifications/     # Push, email, in-app notifications
│   │   │   │   ├── media/             # Image upload, storage (S3/Cloudinary)
│   │   │   │   ├── admin/             # Admin settings, platform config, analytics
│   │   │   │   └── measurements/      # Open Tailor integration proxy
│   │   │   └── config/                # App config, database config, env validation
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── package.json
│   │
│   ├── admin/                         # Angular admin dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/              # Singleton services, guards, interceptors
│   │   │   │   ├── shared/            # Shared components, pipes, directives
│   │   │   │   ├── features/
│   │   │   │   │   ├── dashboard/     # Analytics overview
│   │   │   │   │   ├── orders/        # Order management, status updates
│   │   │   │   │   ├── users/         # User management (customers & designers)
│   │   │   │   │   ├── designers/     # Designer approval, verification
│   │   │   │   │   ├── payments/      # Escrow overview, fund releases, refunds
│   │   │   │   │   ├── returns/       # Return request management
│   │   │   │   │   ├── delivery/      # Courier dispatch & tracking
│   │   │   │   │   ├── settings/      # Platform settings (commission %, courier fee)
│   │   │   │   │   ├── ratings/       # Ratings moderation
│   │   │   │   │   └── reports/       # Revenue, dispute, performance reports
│   │   │   │   └── app.routes.ts
│   │   │   ├── environments/
│   │   │   └── styles.scss
│   │   ├── angular.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── mobile/                        # Ionic client app (Angular-based)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/              # Auth service, HTTP interceptors, guards
│   │   │   │   ├── shared/            # Shared components, pipes
│   │   │   │   ├── tabs/              # Tab-based navigation layout
│   │   │   │   ├── features/
│   │   │   │   │   ├── auth/          # Login, signup, forgot password
│   │   │   │   │   ├── home/          # Feed of trending designs
│   │   │   │   │   ├── explore/       # Browse/search designs & designers
│   │   │   │   │   ├── designer-profile/ # Public designer page
│   │   │   │   │   ├── design-detail/ # Design view, fabric/option picker, order
│   │   │   │   │   ├── orders/        # Customer: my orders / Designer: incoming orders
│   │   │   │   │   ├── order-detail/  # Order status timeline, actions
│   │   │   │   │   ├── measurements/  # Link/manage Open Tailor measurements
│   │   │   │   │   ├── profile/       # User profile, address, settings
│   │   │   │   │   ├── wallet/        # Designer: earnings, withdrawal / Customer: payment methods
│   │   │   │   │   ├── ratings/       # View & leave ratings
│   │   │   │   │   ├── returns/       # Request return, track return
│   │   │   │   │   ├── notifications/ # Notification center
│   │   │   │   │   └── designer-dashboard/ # Designer-specific: manage designs, orders, earnings
│   │   │   │   └── app.routes.ts
│   │   │   ├── environments/
│   │   │   ├── theme/
│   │   │   └── global.scss
│   │   ├── ionic.config.json
│   │   ├── capacitor.config.ts
│   │   ├── angular.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── landing/                       # Angular landing/marketing page
│       ├── src/
│       │   ├── app/
│       │   │   ├── pages/
│       │   │   │   ├── home/          # Hero, featured designers, how it works
│       │   │   │   ├── about/
│       │   │   │   ├── how-it-works/
│       │   │   │   ├── for-designers/
│       │   │   │   ├── pricing/       # Platform commission info
│       │   │   │   ├── faq/
│       │   │   │   └── contact/
│       │   │   ├── components/        # Navbar, footer, CTA sections
│       │   │   └── app.routes.ts
│       │   ├── environments/
│       │   └── styles.scss
│       ├── angular.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types, constants, utilities
│       ├── src/
│       │   ├── types/                 # Shared TypeScript interfaces/enums
│       │   │   ├── user.types.ts
│       │   │   ├── order.types.ts
│       │   │   ├── design.types.ts
│       │   │   ├── payment.types.ts
│       │   │   └── index.ts
│       │   ├── constants/             # Shared constants (order statuses, roles, etc.)
│       │   │   ├── order-status.ts
│       │   │   ├── roles.ts
│       │   │   └── index.ts
│       │   ├── utils/                 # Shared utility functions
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
└── docker/
    ├── docker-compose.yml             # Local dev: Postgres, Redis, MinIO (S3-compat)
    ├── docker-compose.prod.yml
    └── Dockerfile.api
```

### Root Config Files

**pnpm-workspace.yaml**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "www/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

**Root package.json** — name: `steeze`, private: true, use `pnpm` as package manager. Scripts:
- `dev` → `turbo run dev`
- `build` → `turbo run build`
- `lint` → `turbo run lint`
- `test` → `turbo run test`
- `db:generate` → `turbo run db:generate --filter=api`
- `db:migrate` → `turbo run db:migrate --filter=api`

---

## 3. Technology Stack

| Layer | Technology | Version (minimum) |
|-------|-----------|-------------------|
| **Monorepo** | pnpm workspaces + Turborepo | pnpm 9+, turbo 2+ |
| **API** | NestJS | 10+ |
| **ORM** | Prisma | 5+ |
| **Database** | PostgreSQL | 15+ |
| **Cache/Queue** | Redis + BullMQ | Redis 7+, BullMQ 5+ |
| **Admin App** | Angular (standalone components) | 17+ |
| **Mobile App** | Ionic 8 + Angular + Capacitor | Ionic 8+, Angular 17+ |
| **Landing Page** | Angular (standalone, SSR with Angular Universal) | 17+ |
| **Shared Package** | TypeScript | 5.3+ |
| **Auth** | Passport.js (JWT strategy) | — |
| **File Storage** | Cloudinary or AWS S3 (MinIO for local dev) | — |
| **Payments** | Paystack (Nigeria-first) or Stripe | — |
| **Email** | Nodemailer + templates (Handlebars) | — |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | — |
| **Containerization** | Docker + Docker Compose | — |

---

## 4. Database Schema

Use **Prisma** as the ORM. The schema lives at `apps/api/prisma/schema.prisma`.

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ──────────────────────────────────────────────

enum UserRole {
  CUSTOMER
  DESIGNER
  ADMIN
}

enum OrderStatus {
  PENDING_PAYMENT      // Order created, awaiting payment
  PAID                 // Payment received, funds in escrow
  ACCEPTED             // Designer accepted the order
  REJECTED             // Designer rejected the order
  IN_PROGRESS          // Designer is working on the garment
  READY_FOR_PICKUP     // Designer done, awaiting Steeze courier pickup
  PICKED_UP            // Courier picked up from designer
  IN_TRANSIT           // Courier en route to customer
  DELIVERED            // Delivered to customer
  CONFIRMED            // Customer confirmed satisfaction — funds released
  AUTO_CONFIRMED       // 2-day window passed — auto-confirmed
  RETURN_REQUESTED     // Customer requested return within 2 days
  RETURN_PICKUP        // Courier dispatched to pick up return
  RETURN_IN_TRANSIT    // Return en route to designer
  RETURNED             // Item returned to designer — refund processed
  CANCELLED            // Order cancelled before production
  DISPUTED             // Under admin review
}

enum PaymentStatus {
  PENDING
  HELD_IN_ESCROW
  RELEASED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum TransactionType {
  ESCROW_HOLD
  ESCROW_RELEASE
  REFUND
  COMMISSION_DEDUCTION
  RETURN_FEE_DEDUCTION
  WITHDRAWAL
}

enum NotificationType {
  ORDER_UPDATE
  PAYMENT_UPDATE
  RATING_RECEIVED
  RETURN_UPDATE
  SYSTEM
}

// ─── MODELS ─────────────────────────────────────────────

model User {
  id                 String           @id @default(uuid())
  email              String           @unique
  passwordHash       String
  firstName          String
  lastName           String
  phone              String?
  avatarUrl          String?
  role               UserRole         @default(CUSTOMER)
  isEmailVerified    Boolean          @default(false)
  isActive           Boolean          @default(true)
  openTailorEmail    String?          // email used on Open Tailor for measurements
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  // Relations
  addresses          Address[]
  designerProfile    DesignerProfile?
  ordersAsCustomer   Order[]          @relation("CustomerOrders")
  ratingsGiven       Rating[]         @relation("RaterRatings")
  ratingsReceived    Rating[]         @relation("RateeRatings")
  notifications      Notification[]
  walletTransactions WalletTransaction[]

  @@map("users")
}

model Address {
  id            String   @id @default(uuid())
  userId        String
  label         String?  // "Home", "Office", etc.
  street        String
  city          String
  state         String
  country       String   @default("Nigeria")
  postalCode    String?
  isDefault     Boolean  @default(false)
  latitude      Float?
  longitude     Float?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders        Order[]

  @@map("addresses")
}

model DesignerProfile {
  id                String    @id @default(uuid())
  userId            String    @unique
  businessName      String
  slug              String    @unique   // URL-friendly name
  bio               String?
  shopAddress       String    // Physical location for courier pickup
  shopCity          String
  shopState         String
  shopLatitude      Float?
  shopLongitude     Float?
  isVerified        Boolean   @default(false)
  averageRating     Float     @default(0)
  totalCompletedOrders Int    @default(0)
  bannerUrl         String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  designs           Design[]
  ordersAsDesigner  Order[]   @relation("DesignerOrders")

  @@map("designer_profiles")
}

model Design {
  id                String          @id @default(uuid())
  designerId        String
  title             String
  description       String
  basePrice         Decimal         @db.Decimal(12, 2) // Base price before options
  currency          String          @default("NGN")
  category          String          // e.g. "Agbada", "Gown", "Suit", "Casual", etc.
  gender            String?         // "male", "female", "unisex"
  estimatedDays     Int?            // Estimated production time in days
  isPublished       Boolean         @default(false)
  isActive          Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  designer          DesignerProfile @relation(fields: [designerId], references: [id], onDelete: Cascade)
  images            DesignImage[]
  fabricOptions     FabricOption[]
  addOns            DesignAddOn[]
  sizePricings      SizePricing[]
  orders            Order[]

  @@map("designs")
}

model DesignImage {
  id          String   @id @default(uuid())
  designId    String
  url         String
  altText     String?
  sortOrder   Int      @default(0)
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())

  design      Design   @relation(fields: [designId], references: [id], onDelete: Cascade)

  @@map("design_images")
}

model FabricOption {
  id          String   @id @default(uuid())
  designId    String
  name        String   // e.g. "Ankara Cotton", "Silk", "Linen"
  color       String?  // e.g. "#FF5733" or "Navy Blue"
  colorHex    String?  // Hex code for UI rendering
  imageUrl    String?  // Fabric swatch image
  priceAdjustment Decimal @default(0) @db.Decimal(12, 2) // Added to base price
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())

  design      Design   @relation(fields: [designId], references: [id], onDelete: Cascade)
  orderItems  OrderFabricSelection[]

  @@map("fabric_options")
}

model DesignAddOn {
  id          String   @id @default(uuid())
  designId    String
  name        String   // e.g. "Embroidery", "Custom buttons", "Lining"
  description String?
  price       Decimal  @db.Decimal(12, 2) // Additional cost
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())

  design      Design   @relation(fields: [designId], references: [id], onDelete: Cascade)
  orderItems  OrderAddOnSelection[]

  @@map("design_add_ons")
}

model SizePricing {
  id          String   @id @default(uuid())
  designId    String
  sizeLabel   String   // e.g. "S", "M", "L", "XL", "XXL", "Custom"
  priceAdjustment Decimal @default(0) @db.Decimal(12, 2) // Added to base price
  createdAt   DateTime @default(now())

  design      Design   @relation(fields: [designId], references: [id], onDelete: Cascade)

  @@unique([designId, sizeLabel])
  @@map("size_pricings")
}

model Order {
  id                    String            @id @default(uuid())
  orderNumber           String            @unique // Human-readable: STZ-20260210-XXXX
  customerId            String
  designerId            String
  designId              String
  deliveryAddressId     String
  status                OrderStatus       @default(PENDING_PAYMENT)

  // Pricing breakdown
  basePrice             Decimal           @db.Decimal(12, 2)
  fabricPriceAdjustment Decimal           @default(0) @db.Decimal(12, 2)
  sizePriceAdjustment   Decimal           @default(0) @db.Decimal(12, 2)
  addOnsTotal           Decimal           @default(0) @db.Decimal(12, 2)
  deliveryFee           Decimal           @default(0) @db.Decimal(12, 2)
  totalPrice            Decimal           @db.Decimal(12, 2)
  platformCommission    Decimal           @default(0) @db.Decimal(12, 2)
  currency              String            @default("NGN")

  // Measurement snapshot (from Open Tailor at time of order)
  measurementSnapshot   Json?             // Stores full measurement data for posterity

  // Size info
  sizeLabel             String?           // e.g. "L" or "Custom"

  // Customer notes
  specialInstructions   String?

  // Timestamps
  paidAt                DateTime?
  acceptedAt            DateTime?
  readyAt               DateTime?         // Designer marked ready
  pickedUpAt            DateTime?         // Courier picked up from designer
  deliveredAt           DateTime?
  confirmedAt           DateTime?
  autoConfirmDeadline   DateTime?         // deliveredAt + 2 days
  returnRequestedAt     DateTime?
  returnedAt            DateTime?
  cancelledAt           DateTime?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  // Relations
  customer              User              @relation("CustomerOrders", fields: [customerId], references: [id])
  designer              DesignerProfile   @relation("DesignerOrders", fields: [designerId], references: [id])
  design                Design            @relation(fields: [designId], references: [id])
  deliveryAddress       Address           @relation(fields: [deliveryAddressId], references: [id])
  fabricSelection       OrderFabricSelection?
  addOnSelections       OrderAddOnSelection[]
  payment               Payment?
  returnRequest         ReturnRequest?
  ratings               Rating[]
  statusHistory         OrderStatusHistory[]

  @@index([customerId])
  @@index([designerId])
  @@index([status])
  @@map("orders")
}

model OrderFabricSelection {
  id             String       @id @default(uuid())
  orderId        String       @unique
  fabricOptionId String

  order          Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fabricOption   FabricOption @relation(fields: [fabricOptionId], references: [id])

  @@map("order_fabric_selections")
}

model OrderAddOnSelection {
  id          String      @id @default(uuid())
  orderId     String
  addOnId     String
  price       Decimal     @db.Decimal(12, 2) // Price at time of order

  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  addOn       DesignAddOn @relation(fields: [addOnId], references: [id])

  @@unique([orderId, addOnId])
  @@map("order_add_on_selections")
}

model OrderStatusHistory {
  id        String      @id @default(uuid())
  orderId   String
  fromStatus OrderStatus?
  toStatus  OrderStatus
  note      String?
  changedBy String?     // userId or "SYSTEM"
  createdAt DateTime    @default(now())

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_status_history")
}

model Payment {
  id                String        @id @default(uuid())
  orderId           String        @unique
  externalRef       String?       // Paystack/Stripe reference
  amount            Decimal       @db.Decimal(12, 2)
  currency          String        @default("NGN")
  status            PaymentStatus @default(PENDING)
  paidAt            DateTime?
  releasedAt        DateTime?
  refundedAt        DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  order             Order         @relation(fields: [orderId], references: [id])
  transactions      WalletTransaction[]

  @@map("payments")
}

model WalletTransaction {
  id          String          @id @default(uuid())
  userId      String
  paymentId   String?
  type        TransactionType
  amount      Decimal         @db.Decimal(12, 2)
  currency    String          @default("NGN")
  description String?
  createdAt   DateTime        @default(now())

  user        User            @relation(fields: [userId], references: [id])
  payment     Payment?        @relation(fields: [paymentId], references: [id])

  @@index([userId])
  @@map("wallet_transactions")
}

model Rating {
  id          String   @id @default(uuid())
  orderId     String
  raterId     String   // The user giving the rating
  rateeId     String   // The user receiving the rating
  score       Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  order       Order    @relation(fields: [orderId], references: [id])
  rater       User     @relation("RaterRatings", fields: [raterId], references: [id])
  ratee       User     @relation("RateeRatings", fields: [rateeId], references: [id])

  @@unique([orderId, raterId]) // One rating per user per order
  @@map("ratings")
}

model ReturnRequest {
  id              String      @id @default(uuid())
  orderId         String      @unique
  reason          String
  status          String      @default("PENDING") // PENDING, APPROVED, PICKUP_DISPATCHED, RETURNED, REJECTED
  courierFee      Decimal?    @db.Decimal(12, 2)  // Flat fee deducted from designer
  adminNotes      String?
  requestedAt     DateTime    @default(now())
  resolvedAt      DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  order           Order       @relation(fields: [orderId], references: [id])

  @@map("return_requests")
}

model Notification {
  id          String           @id @default(uuid())
  userId      String
  type        NotificationType
  title       String
  body        String
  data        Json?            // Additional context payload
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model PlatformSetting {
  id        String   @id @default(uuid())
  key       String   @unique // e.g. "commission_percentage", "return_courier_fee", "auto_confirm_days"
  value     String   // Stored as string, parsed by app
  updatedBy String?
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("platform_settings")
}
```

### Seed Data

The seed file (`apps/api/prisma/seed.ts`) should create:
1. An admin user (email: `admin@steeze.com`, password: hashed `Admin123!`)
2. Platform settings:
   - `commission_percentage` = `"10"` (10%)
   - `return_courier_fee` = `"2500"` (₦2,500)
   - `auto_confirm_days` = `"2"`
3. A few sample designers, designs, and fabric options for dev/testing

---

## 5. API Design (NestJS)

### Module-by-Module Breakdown

#### 5.1 Auth Module (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register as customer or designer |
| POST | `/auth/login` | Login, return JWT access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/verify-email` | Verify email with token |
| GET | `/auth/me` | Get current authenticated user |

**Implementation notes:**
- Use `@nestjs/passport` with JWT strategy.
- Access tokens: short-lived (15 min). Refresh tokens: long-lived (7 days), stored hashed in DB or Redis.
- Registration payload includes `role` field (`CUSTOMER` or `DESIGNER`). `ADMIN` accounts are created via seed or admin panel only.
- Designer registration additionally requires `businessName`, `shopAddress`, etc.
- Password hashing with bcrypt (12 rounds).

#### 5.2 Users Module (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get own profile |
| PATCH | `/users/me` | Update own profile |
| POST | `/users/me/avatar` | Upload avatar image |
| GET | `/users/me/addresses` | List own addresses |
| POST | `/users/me/addresses` | Add an address |
| PATCH | `/users/me/addresses/:id` | Update an address |
| DELETE | `/users/me/addresses/:id` | Delete an address |
| PATCH | `/users/me/open-tailor` | Link Open Tailor email |
| GET | `/users/me/measurements` | Fetch measurements from Open Tailor |
| GET | `/users/:id/public` | Get public profile (name, avatar, rating) |

#### 5.3 Designers Module (`/api/designers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/designers` | List designers (public, paginated, searchable) |
| GET | `/designers/:slug` | Get designer public profile by slug |
| GET | `/designers/:slug/designs` | List designer's published designs |
| PATCH | `/designers/me` | Update own designer profile |
| GET | `/designers/me/orders` | List orders received (with filters) |
| GET | `/designers/me/earnings` | Get earnings summary |

#### 5.4 Designs Module (`/api/designs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/designs` | Create a new design (designer only) |
| PATCH | `/designs/:id` | Update design |
| DELETE | `/designs/:id` | Soft-delete design |
| GET | `/designs` | List all published designs (public, paginated, filtered) |
| GET | `/designs/:id` | Get full design detail inc. fabric options, add-ons, size pricing |
| POST | `/designs/:id/images` | Upload design images |
| DELETE | `/designs/:id/images/:imageId` | Remove a design image |
| POST | `/designs/:id/fabrics` | Add fabric option |
| PATCH | `/designs/:id/fabrics/:fabricId` | Update fabric option |
| DELETE | `/designs/:id/fabrics/:fabricId` | Remove fabric option |
| POST | `/designs/:id/addons` | Add add-on option |
| PATCH | `/designs/:id/addons/:addonId` | Update add-on |
| DELETE | `/designs/:id/addons/:addonId` | Remove add-on |
| POST | `/designs/:id/size-pricing` | Set size pricing |
| PATCH | `/designs/:id/size-pricing/:id` | Update size pricing |
| DELETE | `/designs/:id/size-pricing/:id` | Remove size pricing |

**Query params for list:** `category`, `gender`, `minPrice`, `maxPrice`, `designerId`, `search` (full-text on title/description), `sortBy` (price, rating, newest), `page`, `limit`.

#### 5.5 Orders Module (`/api/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order (customer) |
| GET | `/orders` | List own orders (customer or designer, depending on role) |
| GET | `/orders/:id` | Get order detail |
| PATCH | `/orders/:id/accept` | Designer accepts order |
| PATCH | `/orders/:id/reject` | Designer rejects order (with reason) |
| PATCH | `/orders/:id/in-progress` | Designer marks work started |
| PATCH | `/orders/:id/ready` | Designer marks garment ready for pickup |
| PATCH | `/orders/:id/picked-up` | Admin/system marks courier picked up |
| PATCH | `/orders/:id/in-transit` | Admin/system marks in transit |
| PATCH | `/orders/:id/delivered` | Admin/system marks delivered |
| PATCH | `/orders/:id/confirm` | Customer confirms satisfaction |
| PATCH | `/orders/:id/cancel` | Cancel order (only before ACCEPTED) |
| GET | `/orders/:id/status-history` | Get status change log |

**Order creation flow:**
1. Customer selects design, fabric, add-ons, size, provides delivery address.
2. System fetches customer's measurements from Open Tailor (if linked).
3. System calculates total = `basePrice + fabricPriceAdjustment + sizePriceAdjustment + addOnsTotal + deliveryFee`.
4. System calculates `platformCommission = totalPrice * (commission_percentage / 100)`.
5. Order is created in `PENDING_PAYMENT` status.
6. Customer proceeds to payment.

**Auto-confirmation CRON job:**
- A scheduled task (NestJS `@Cron`) runs every hour.
- Finds orders with status `DELIVERED` where `autoConfirmDeadline < now()`.
- Transitions them to `AUTO_CONFIRMED` and releases funds.

#### 5.6 Payments Module (`/api/payments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initialize` | Initialize payment for an order (returns payment URL) |
| POST | `/payments/webhook` | Receive payment provider webhook |
| GET | `/payments/verify/:reference` | Verify a payment |

**Payment flow (Paystack example):**
1. `POST /payments/initialize` → calls Paystack Initialize Transaction API → returns `authorization_url`.
2. Customer pays on Paystack checkout page.
3. Paystack calls `POST /payments/webhook` with success/failure.
4. On success: Order status → `PAID`, Payment status → `HELD_IN_ESCROW`.
5. Fund release on confirmation: creates `WalletTransaction` of type `ESCROW_RELEASE` for designer (amount = totalPrice - platformCommission).
6. Platform commission is a separate `COMMISSION_DEDUCTION` transaction.
7. On return: `REFUND` transaction for customer, `RETURN_FEE_DEDUCTION` for designer.

#### 5.7 Returns Module (`/api/returns`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/:id/return` | Customer requests return (within 2 days of delivery) |
| GET | `/returns` | List return requests (admin) |
| PATCH | `/returns/:id/approve` | Admin approves return |
| PATCH | `/returns/:id/reject` | Admin rejects return |
| PATCH | `/returns/:id/pickup-dispatched` | Mark courier dispatched for return pickup |
| PATCH | `/returns/:id/returned` | Mark item returned to designer |

**Return business logic:**
1. Customer can only request return if `order.status === DELIVERED` and `now() <= order.deliveredAt + 2 days`.
2. On approval, admin dispatches courier to customer.
3. On return completion:
   - Order status → `RETURNED`
   - Payment status → `REFUNDED`
   - Customer gets full refund (WalletTransaction: REFUND)
   - Designer gets `RETURN_FEE_DEDUCTION` of the flat courier fee (from `PlatformSetting.return_courier_fee`)

#### 5.8 Ratings Module (`/api/ratings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/:id/rate` | Rate the other party on an order |
| GET | `/users/:id/ratings` | Get ratings received by a user |
| GET | `/orders/:id/ratings` | Get ratings for an order |

**Rules:**
- Rating is only allowed after order status is `CONFIRMED` or `AUTO_CONFIRMED`.
- Each party can rate the other once per order.
- Score: 1-5 integer. Comment: optional string.
- After a new rating, recalculate and update `DesignerProfile.averageRating`.

#### 5.9 Notifications Module (`/api/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List own notifications (paginated) |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| GET | `/notifications/unread-count` | Get unread count |

**Trigger points:** Every order status change, payment event, rating received, return update.

#### 5.10 Admin Module (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Aggregate stats (revenue, orders, users, etc.) |
| GET | `/admin/users` | List all users with filters |
| PATCH | `/admin/users/:id/activate` | Activate/deactivate user |
| GET | `/admin/designers` | List designers with verification status |
| PATCH | `/admin/designers/:id/verify` | Verify a designer |
| GET | `/admin/orders` | List all orders with filters |
| GET | `/admin/payments` | List all payments |
| GET | `/admin/returns` | List all return requests |
| GET | `/admin/settings` | Get all platform settings |
| PATCH | `/admin/settings/:key` | Update a platform setting |

#### 5.11 Measurements Module (`/api/measurements`)

This module proxies or integrates with the **Open Tailor API** (`https://github.com/tony-eneh/open-tailor`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/measurements/mine` | Fetch own measurements from Open Tailor by linked email |
| POST | `/measurements/link` | Link Open Tailor email to Steeze account |
| POST | `/measurements/create` | Create measurements on Open Tailor for current user |
| PUT | `/measurements/update` | Update measurements on Open Tailor |

**Open Tailor API reference:**
- Base URL: configurable via env `OPEN_TAILOR_API_URL` (default: `http://localhost:3000`)
- `GET /api/measurements?filter[email]=<email>` — fetch by email
- `POST /api/measurements` — create (body: `{ email, gender, unit, measurements: { ... } }`)
- `PUT /api/measurements/:id` — update
- See full measurement fields in [Section 10](#10-external-integrations).

#### 5.12 Media Module (`/api/media`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/media/upload` | Upload image(s), return URL(s) |
| DELETE | `/media/:id` | Delete an uploaded image |

Use Cloudinary SDK or AWS S3 SDK. For local dev, use MinIO (S3-compatible) via Docker.

### Global API Patterns

- **Response envelope:** `{ success: boolean, data: T | null, message: string, meta?: { page, limit, total } }`
- **Validation:** Use `class-validator` + `class-transformer` DTOs on all inputs.
- **Error handling:** Global exception filter returning consistent error shape.
- **Pagination:** Default `page=1`, `limit=20`. Max limit = 100.
- **API prefix:** All routes under `/api/v1/`.
- **CORS:** Allow admin app origin, mobile app origin, landing page origin.
- **Rate limiting:** Use `@nestjs/throttler` — 100 requests/minute default.
- **Swagger:** Auto-generate with `@nestjs/swagger` at `/api/docs`.

---

## 6. Admin App (Angular)

### Architecture

- **Angular 17+** with standalone components (no NgModules).
- **Routing:** Lazy-loaded feature routes.
- **State management:** Angular Signals + RxJS services.
- **UI library:** Angular Material or PrimeNG.
- **HTTP:** `HttpClient` with auth interceptor (attach JWT, handle 401 refresh).

### Pages & Features

| Route | Feature | Description |
|-------|---------|-------------|
| `/login` | Auth | Admin login |
| `/dashboard` | Dashboard | KPI cards (revenue, orders, users), charts |
| `/orders` | Orders | Table with filters (status, date, designer, customer), detail flyout |
| `/orders/:id` | Order Detail | Full order info, status timeline, actions (mark pickup, delivered, etc.) |
| `/users` | Users | List all users, filter by role, activate/deactivate |
| `/designers` | Designers | List designers, verify/reject, view portfolio |
| `/payments` | Payments | Escrow overview, pending releases, completed, filters |
| `/returns` | Returns | Return request list, approve/reject, dispatch courier |
| `/delivery` | Delivery | Courier assignments, tracking statuses |
| `/settings` | Settings | Edit platform commission %, return courier fee, auto-confirm days |
| `/ratings` | Ratings | Browse all ratings, moderation (flag/remove inappropriate) |
| `/reports` | Reports | Revenue reports, designer performance, customer activity |

### Key Admin Workflows

1. **Order lifecycle management:** Admin can update order status (picked up, in transit, delivered) for courier tracking.
2. **Return management:** Review return requests, approve/reject, dispatch courier.
3. **Designer verification:** Review new designer applications, verify or reject.
4. **Settings management:** Update commission percentage, return courier flat fee.
5. **Dispute resolution:** View disputed orders, communicate with parties, make rulings.

---

## 7. Client Mobile App (Ionic)

### Architecture

- **Ionic 8** with **Angular 17+** (standalone components).
- **Capacitor** for native layer (camera, push notifications, geolocation).
- **Tab-based navigation** with 4 main tabs: Home, Explore, Orders, Profile.
- **State management:** Signals + RxJS services.
- **Offline support:** Basic caching with Ionic Storage for viewed designs.

### Tab Structure

```
Tabs:
├── Home        → Trending/featured designs feed
├── Explore     → Search & browse designs, designers, categories
├── Orders      → My orders (customer) / Incoming orders (designer)
└── Profile     → Settings, addresses, measurements, wallet, ratings
```

### Screens (Customer Flow)

| Screen | Description |
|--------|-------------|
| **Splash/Onboarding** | App intro slides (first launch only) |
| **Login/Register** | Email/password auth, social auth (future), role selection |
| **Home Feed** | Trending designs, featured designers, categories |
| **Explore** | Search bar, category filters, designer cards, design cards |
| **Designer Profile** | Bio, portfolio gallery, rating, published designs |
| **Design Detail** | Image gallery, description, fabric picker, add-on checkboxes, size selector, price calculator, "Order" CTA |
| **Order Checkout** | Review selections, delivery address picker, measurement summary, total breakdown, "Pay Now" |
| **Payment** | In-app WebView to Paystack checkout |
| **My Orders** | List of orders with status badges, pull-to-refresh |
| **Order Detail** | Status timeline, designer info, order details, actions (confirm, request return) |
| **Return Request** | Reason input, submit return |
| **Measurements** | Link Open Tailor email, view/edit measurements |
| **Addresses** | List/add/edit delivery addresses |
| **Profile Settings** | Edit name, phone, avatar, password |
| **Wallet** | (Designer) Earnings balance, transaction history, withdrawal |
| **Notifications** | Notification list, mark as read |
| **Rate Order** | Star rating (1-5) + optional comment |

### Screens (Designer Flow)

Designers see additional/different screens:

| Screen | Description |
|--------|-------------|
| **Designer Dashboard** | Stats: pending orders, in-progress, completed, earnings |
| **Manage Designs** | List own designs, create/edit/publish/unpublish |
| **Design Editor** | Multi-step form: details → images → fabrics → add-ons → size pricing → publish |
| **Incoming Orders** | Orders received, accept/reject |
| **Order Work View** | Mark in-progress, mark ready for pickup |
| **Earnings** | Balance, pending release, commission breakdown, transaction history |

### Push Notifications

- Use Firebase Cloud Messaging (FCM) via Capacitor Push Notifications plugin.
- Register device token on login, send to API.
- Trigger push on order status changes, payment events, new ratings.

---

## 8. Landing Page (Angular)

### Architecture

- **Angular 17+** with SSR (`@angular/ssr`) for SEO.
- **Standalone components**, minimal dependencies.
- **Responsive design** — mobile-first.
- **Tailwind CSS** for styling.

### Pages

| Route | Content |
|-------|---------|
| `/` | Hero section, value propositions, featured designers, how it works, CTA to download app |
| `/about` | About Steeze, mission, team |
| `/how-it-works` | Step-by-step for customers and designers |
| `/for-designers` | Benefits of joining, earnings info, CTA to register |
| `/pricing` | Commission structure, transparent fees |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form, social links |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

### SEO & Performance

- Server-side rendering for all pages.
- Meta tags, Open Graph tags, structured data.
- Lazy-loaded images, optimized assets.
- Google Analytics integration.

---

## 9. Business Logic & Workflows

### 9.1 Order Lifecycle State Machine

```
                    ┌──────────────┐
                    │PENDING_PAYMENT│
                    └──────┬───────┘
                           │ payment success
                    ┌──────▼───────┐
              ┌─────│     PAID      │─────┐
              │     └──────┬───────┘     │
              │            │ designer     │ designer
              │            │ accepts      │ rejects
              │     ┌──────▼───────┐ ┌───▼─────┐
              │     │   ACCEPTED    │ │REJECTED │ → refund
              │     └──────┬───────┘ └─────────┘
              │            │
              │     ┌──────▼───────┐
              │     │  IN_PROGRESS  │
              │     └──────┬───────┘
              │            │ designer marks ready
              │     ┌──────▼────────────┐
              │     │ READY_FOR_PICKUP   │
              │     └──────┬────────────┘
              │            │ courier picks up
              │     ┌──────▼───────┐
              │     │  PICKED_UP    │
              │     └──────┬───────┘
              │            │
              │     ┌──────▼───────┐
              │     │  IN_TRANSIT   │
              │     └──────┬───────┘
              │            │ delivered
              │     ┌──────▼───────┐
              │     │  DELIVERED    │──── 2-day window ────┐
              │     └──┬───────┬───┘                      │
              │        │       │                           │
              │  customer    customer                auto-confirm
              │  confirms    requests return          (cron job)
              │        │       │                           │
              │  ┌─────▼──┐ ┌─▼────────────────┐  ┌──────▼────────┐
              │  │CONFIRMED│ │RETURN_REQUESTED   │  │AUTO_CONFIRMED │
              │  └─────────┘ └──────┬───────────┘  └───────────────┘
              │                     │ approved              │
              │              ┌──────▼───────────┐    funds released
    cancel    │              │ RETURN_PICKUP     │
  (before     │              └──────┬───────────┘
   ACCEPTED)  │              ┌──────▼───────────┐
              │              │RETURN_IN_TRANSIT  │
       ┌──────▼──┐           └──────┬───────────┘
       │CANCELLED│           ┌──────▼───────┐
       └─────────┘           │  RETURNED     │ → refund customer,
                             └───────────────┘   deduct return fee from designer
```

### 9.2 Price Calculation

```
totalPrice = design.basePrice
           + selectedFabric.priceAdjustment
           + selectedSize.priceAdjustment
           + SUM(selectedAddOns[].price)
           + deliveryFee (calculated or flat)

platformCommission = totalPrice * (commission_percentage / 100)
designerEarnings   = totalPrice - platformCommission
```

### 9.3 Escrow & Fund Release

1. **Payment received** → `Payment.status = HELD_IN_ESCROW`
2. **Order confirmed/auto-confirmed** →
   - Create `WalletTransaction(type: ESCROW_RELEASE, amount: designerEarnings, userId: designer.userId)`
   - Create `WalletTransaction(type: COMMISSION_DEDUCTION, amount: platformCommission, userId: designer.userId)` (for record)
   - `Payment.status = RELEASED`
3. **Return completed** →
   - Create `WalletTransaction(type: REFUND, amount: totalPrice, userId: customer.id)`
   - Create `WalletTransaction(type: RETURN_FEE_DEDUCTION, amount: return_courier_fee, userId: designer.userId)`
   - `Payment.status = REFUNDED`

### 9.4 Auto-Confirmation CRON

```typescript
// Runs every hour
@Cron(CronExpression.EVERY_HOUR)
async autoConfirmDeliveredOrders() {
  const autoConfirmDays = await this.settingsService.get('auto_confirm_days'); // "2"
  const cutoff = subDays(new Date(), parseInt(autoConfirmDays));

  const orders = await this.prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      deliveredAt: { lte: cutoff },
    },
  });

  for (const order of orders) {
    await this.orderService.autoConfirm(order.id);
  }
}
```

---

## 10. External Integrations

### 10.1 Open Tailor API

**Purpose:** Store and retrieve customer body measurements so designers can produce well-fitting garments.

**Base URL:** Configurable via `OPEN_TAILOR_API_URL` env var. Default: `http://localhost:3000`

**Integration pattern:** The Steeze API acts as a proxy/client to Open Tailor. Customers link their Open Tailor email in their Steeze profile. When placing an order, the API fetches measurements and stores a snapshot on the order.

**Endpoints used:**

| Open Tailor Endpoint | Usage in Steeze |
|---------------------|-----------------|
| `GET /api/measurements?filter[email]=<email>` | Fetch customer's measurements by linked email |
| `POST /api/measurements` | Create measurements for a customer who doesn't have them yet |
| `PUT /api/measurements/:id` | Update existing measurements |
| `GET /health` | Health check during startup |

**Measurement fields available:**

- **Upper Body:** `shoulderToShoulderLength`, `highBustCircle`, `bustCircle`, `bustTipsLength`, `neckCircle`, `bicepsCircle`
- **Torso:** `waistCircle`, `hipCircle`, `centerBackLength`, `crossBackLength`
- **Arms:** `shoulderToBicepsLength`, `shoulderToElbowLength`, `shoulderToWristLength`, `wristCircle`, `elbowCircle`
- **Legs:** `waistToAnkleLength`, `waistToKneeLength`, `inseamLength`, `outseamLength`, `thighCircle`, `kneeCircle`, `calfCircle`, `ankleCircle`
- **Other:** `heightLength`, `headCircle`

**Required fields for creation:** `email` (unique), `gender` ("male" | "female" | "other"). Optional: `unit` ("cm" | "inch", default: "cm"), `measurements` object.

**Create service class:** `OpenTailorService` in `apps/api/src/modules/measurements/open-tailor.service.ts` using NestJS `HttpModule` (`@nestjs/axios`).

### 10.2 Payment Gateway (Paystack)

**Env vars:** `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`

**Endpoints used:**
- `POST https://api.paystack.co/transaction/initialize` — Initialize transaction
- `GET https://api.paystack.co/transaction/verify/:reference` — Verify transaction
- Webhook: `POST /api/v1/payments/webhook` — receives Paystack events

**Webhook verification:** Validate `x-paystack-signature` header with HMAC SHA512. Events to handle: `charge.success`, `charge.failed`, `refund.processed`.

### 10.3 File Storage (Cloudinary / S3)

**Env vars:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` OR `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

**For local dev:** Use MinIO container (S3-compatible) defined in docker-compose.

### 10.4 Email (Nodemailer)

**Env vars:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

**Templates (Handlebars):** Welcome, email verification, password reset, order confirmation, order status update, payment received, funds released, return request update.

### 10.5 Push Notifications (Firebase)

**Env vars:** `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

**Push on:** Order status changes, payment events, new ratings, return updates.

---

## 11. Authentication & Authorization

### JWT Strategy

- **Access token:** Payload `{ sub: userId, email, role }`. Expires: 15 min.
- **Refresh token:** Random string, stored hashed in Redis/DB. Expires: 7 days.
- **Guards:**
  - `JwtAuthGuard` — validates access token on protected routes.
  - `RolesGuard` — checks `@Roles(UserRole.ADMIN)` decorator against `req.user.role`.

### Route Protection Matrix

| Route Group | CUSTOMER | DESIGNER | ADMIN |
|-------------|----------|----------|-------|
| `POST /orders` | ✅ | ❌ | ❌ |
| `PATCH /orders/:id/accept` | ❌ | ✅ (own orders) | ✅ |
| `PATCH /orders/:id/ready` | ❌ | ✅ (own orders) | ✅ |
| `PATCH /orders/:id/confirm` | ✅ (own orders) | ❌ | ✅ |
| `POST /orders/:id/return` | ✅ (own orders) | ❌ | ❌ |
| `POST /designs` | ❌ | ✅ | ❌ |
| `PATCH /designs/:id` | ❌ | ✅ (own designs) | ✅ |
| `/admin/**` | ❌ | ❌ | ✅ |
| `GET /designs` (public) | ✅ | ✅ | ✅ |
| `GET /designers` (public) | ✅ | ✅ | ✅ |

### Resource Ownership

Always verify the requesting user owns the resource they're modifying. E.g., a designer can only update their own designs, a customer can only confirm their own orders.

---

## 12. Implementation Phases

### Phase 1: Foundation (Monorepo + DB + Auth)

**Goal:** Scaffold monorepo, set up database, implement auth.

1. Initialize pnpm workspace with Turborepo.
2. Create NestJS app (`apps/api`) with Prisma.
3. Write Prisma schema, run initial migration.
4. Implement auth module (register, login, JWT, refresh, email verify).
5. Implement users module (profile, addresses).
6. Set up Docker Compose (Postgres, Redis, MinIO).
7. Create `packages/shared` with types and constants.
8. Write seed script.
9. Set up Swagger docs.

### Phase 2: Core Marketplace (Designs + Orders)

**Goal:** Designers can create designs, customers can browse and order.

1. Implement designers module (profile, CRUD).
2. Implement designs module (CRUD, fabrics, add-ons, size pricing, images).
3. Implement media module (image upload).
4. Implement orders module (creation, status transitions).
5. Implement price calculation logic.
6. Integrate Open Tailor measurements proxy.
7. Create design browsing/search with pagination and filters.

### Phase 3: Payments + Escrow

**Goal:** Customers can pay, funds are held, released on confirmation.

1. Implement payments module with Paystack integration.
2. Implement escrow hold on successful payment.
3. Implement fund release on confirmation.
4. Implement wallet transactions for tracking.
5. Implement auto-confirmation CRON job.

### Phase 4: Returns + Ratings

**Goal:** Returns within 2 days, bidirectional ratings.

1. Implement returns module (request, approve, courier dispatch, complete).
2. Implement return fee deduction logic.
3. Implement ratings module (post-confirmation, bidirectional).
4. Update designer average rating on new ratings.

### Phase 5: Notifications

**Goal:** Users get notified of order updates, payments, ratings.

1. Implement notifications module (in-app, email, push).
2. Hook notifications into order status changes, payment events, ratings.
3. Implement notification preferences (optional).

### Phase 6: Admin App

**Goal:** Admins can manage the platform.

1. Scaffold Angular admin app.
2. Implement admin auth (login, route guards).
3. Build dashboard with analytics.
4. Build order management pages.
5. Build user/designer management.
6. Build payment/escrow overview.
7. Build return management.
8. Build settings page (commission %, courier fee).

### Phase 7: Mobile App

**Goal:** Full customer and designer experience on mobile.

1. Scaffold Ionic app with Capacitor.
2. Implement auth screens.
3. Implement home feed and explore/search.
4. Implement design detail with fabric/option picker.
5. Implement order checkout and payment (WebView).
6. Implement order management screens.
7. Implement measurement linking.
8. Implement designer dashboard and design management.
9. Implement ratings screens.
10. Implement push notifications.

### Phase 8: Landing Page

**Goal:** Public-facing marketing site.

1. Scaffold Angular landing page with SSR.
2. Implement all pages (home, about, how-it-works, for-designers, FAQ, etc.).
3. Style with Tailwind CSS.
4. SEO optimization.

### Phase 9: Polish + Testing + Deployment

**Goal:** Production-ready.

1. Write comprehensive E2E tests for API.
2. Write unit tests for business logic.
3. Security audit (input validation, rate limiting, CORS, webhook verification).
4. Set up CI/CD pipelines.
5. Configure production Docker builds.
6. Deploy.

---

## 13. Testing Strategy

### API (NestJS)

- **Unit tests:** Test services in isolation (mock Prisma, external APIs). Use Jest.
- **Integration tests:** Test modules with a real test database (use `@testcontainers` or a dedicated test Postgres). Test full request/response cycles.
- **E2E tests:** Test complete workflows (register → create design → order → pay → deliver → confirm → rate).
- **Coverage target:** 80%+ for services, 70%+ overall.

### Admin App (Angular)

- **Unit tests:** Component tests with Angular TestBed. Service tests with HttpClientTestingModule.
- **E2E tests:** Cypress or Playwright for critical admin workflows.

### Mobile App (Ionic)

- **Unit tests:** Component + service tests.
- **E2E tests:** Cypress (browser) or Appium (native) for critical user flows.

### Shared Package

- **Unit tests:** Pure function tests with Jest.

---

## 14. DevOps & Deployment

### Local Development

```bash
# Prerequisites: Node.js 20+, pnpm 9+, Docker

# Install dependencies
pnpm install

# Start infrastructure
docker compose up -d   # Postgres, Redis, MinIO

# Run database migrations
pnpm db:migrate

# Seed database
pnpm --filter api exec prisma db seed

# Start all apps in dev mode
pnpm dev
```

### Environment Variables

Create `.env` files in each app directory. Root `.env.example`:

```env
# Database
DATABASE_URL=postgresql://steeze:steeze@localhost:5432/steeze?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Open Tailor
OPEN_TAILOR_API_URL=http://localhost:3000

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
EMAIL_FROM=noreply@steeze.com

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx

# Platform
PLATFORM_NAME=Steeze
PLATFORM_URL=https://steeze.com
ADMIN_URL=https://admin.steeze.com
API_URL=https://api.steeze.com

# MinIO (local S3)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=steeze-uploads
```

### Docker Compose (Local Dev)

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: steeze
      POSTGRES_PASSWORD: steeze
      POSTGRES_DB: steeze
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### CI/CD (GitHub Actions)

- **On PR:** Lint → Test → Build (all packages in parallel via Turbo).
- **On merge to main:** Lint → Test → Build → Deploy API → Deploy Admin → Deploy Landing.
- **Mobile:** Separate workflow for building APK/IPA via Capacitor + Appflow or manual builds.

---

## 15. Conventions & Standards

### Code Style

- **TypeScript strict mode** in all packages.
- **ESLint** + **Prettier** for consistent formatting.
- **Naming:**
  - Files: `kebab-case` (e.g., `order-status.ts`, `jwt-auth.guard.ts`)
  - Classes: `PascalCase` (e.g., `OrderService`, `JwtAuthGuard`)
  - Variables/functions: `camelCase`
  - Constants/enums: `UPPER_SNAKE_CASE` for values, `PascalCase` for enum names
  - Database tables: `snake_case` (via Prisma `@@map`)
  - API routes: `kebab-case` (e.g., `/api/v1/design-add-ons`)

### Git Conventions

- **Branch naming:** `feat/`, `fix/`, `chore/`, `docs/` prefixes (e.g., `feat/order-module`)
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **PR strategy:** Feature branches → PR to `main`

### NestJS Conventions

- One module per domain concern.
- DTOs for all request/response shapes with `class-validator` decorators.
- Services contain business logic; controllers are thin.
- Use Prisma transactions for multi-table operations.
- Use NestJS `ConfigModule` with Joi validation for env vars.
- Use `BullMQ` queues for async tasks (email sending, push notifications, webhook processing).

### Angular/Ionic Conventions

- Standalone components (no NgModules).
- Lazy-loaded routes.
- Services for API calls; components for UI.
- Reactive forms for all form inputs.
- Signals for local component state; RxJS for async streams.
- `environment.ts` / `environment.prod.ts` for API URLs.

### API Versioning

- URL-based: `/api/v1/...`
- All current endpoints are v1. When breaking changes are needed, introduce `/api/v2/`.

### Error Codes

Define consistent error codes in `packages/shared`:

```typescript
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  ORDER_ALREADY_CONFIRMED = 'ORDER_ALREADY_CONFIRMED',
  RETURN_WINDOW_EXPIRED = 'RETURN_WINDOW_EXPIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  MEASUREMENT_NOT_FOUND = 'MEASUREMENT_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

---

## Appendix: Quick Reference Commands

```bash
# Add a dependency to a specific app
pnpm --filter api add <package>
pnpm --filter admin add <package>
pnpm --filter mobile add <package>

# Run only the API in dev
pnpm --filter api dev

# Generate Prisma client after schema change
pnpm --filter api exec prisma generate

# Create a new migration
pnpm --filter api exec prisma migrate dev --name <migration-name>

# Run tests for a specific app
pnpm --filter api test
pnpm --filter admin test

# Build everything
pnpm build

# Lint everything
pnpm lint
```

---

**This document is the single source of truth for implementing Steeze. Follow the phases sequentially, refer to the schema and API design for implementation details, and adhere to the conventions throughout.**
