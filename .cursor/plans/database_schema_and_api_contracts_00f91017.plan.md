---
name: Database Schema and API Contracts
overview: Design the final database schema and API contracts for the reseller business system, including append-only financial records, soft deletes, and role-based authorization.
todos:
  - id: schema-design
    content: Design database schema with append-only financial records, soft deletes, and proper relationships
    status: pending
  - id: api-contracts
    content: Define REST API endpoints with request/response shapes and authorization rules
    status: pending
  - id: future-expansion
    content: Document how schema supports future features without refactoring
    status: pending
isProject: false
---

# Database Schema and API Contracts

## Database Schema

### Core Tables

#### `users`

Maps Cognito users to application users. Stores role assignments and basic profile.

**Columns:**

- `id` UUID PRIMARY KEY
- `cognito_user_id` VARCHAR(255) UNIQUE NOT NULL (Cognito sub)
- `email` VARCHAR(255) UNIQUE NOT NULL
- `role` ENUM('ADMIN', 'OPERATOR', 'WHOLESALER') NOT NULL
- `full_name` VARCHAR(255)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `deleted_at` TIMESTAMPTZ

**Indexes:**

- `idx_users_cognito_user_id` ON `cognito_user_id`
- `idx_users_email` ON `email`
- `idx_users_role` ON `role` WHERE `deleted_at IS NULL`

**Constraints:**

- Email must be valid format
- Role must be one of the defined values

---

#### `wholesalers`

Entities that are owed money. Separate from users (may link later).

**Columns:**

- `id` UUID PRIMARY KEY
- `name` VARCHAR(255) NOT NULL
- `contact_email` VARCHAR(255)
- `contact_phone` VARCHAR(50)
- `address` JSONB (street, city, state, zip, country)
- `tax_id` VARCHAR(100) (for 1099 reporting)
- `notes` TEXT
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `deleted_at` TIMESTAMPTZ

**Indexes:**

- `idx_wholesalers_name` ON `name` WHERE `deleted_at IS NULL`
- `idx_wholesalers_contact_email` ON `contact_email` WHERE `deleted_at IS NULL`

**Constraints:**

- Name cannot be empty
- Contact email must be valid if provided

---

#### `shows`

Sales events where obligations are created.

**Columns:**

- `id` UUID PRIMARY KEY
- `name` VARCHAR(255) NOT NULL
- `show_date` DATE NOT NULL
- `location` VARCHAR(255)
- `platform` ENUM('WHATNOT', 'INSTAGRAM', 'MANUAL') (sales platform/source)
- `source` ENUM('WHATNOT', 'INSTAGRAM', 'MANUAL') (how show was created)
- `external_reference` VARCHAR(255) (external ID from platform, optional)
- `notes` TEXT
- `status` ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED'
- `created_by` UUID NOT NULL REFERENCES `users(id)`
- `created_via` ENUM('WEB', 'IMPORT', 'API') NOT NULL DEFAULT 'WEB'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `deleted_at` TIMESTAMPTZ

**Indexes:**

- `idx_shows_show_date` ON `show_date` DESC WHERE `deleted_at IS NULL`
- `idx_shows_status` ON `status` WHERE `deleted_at IS NULL`
- `idx_shows_created_by` ON `created_by`
- `idx_shows_platform` ON `platform` WHERE `deleted_at IS NULL`
- `idx_shows_external_reference` ON `external_reference` WHERE `external_reference IS NOT NULL`

**Constraints:**

- Name cannot be empty
- Show date cannot be in the future (business rule, enforce in application)

---

#### `owed_line_items`

Financial obligations per show. Append-only (no updates/deletes). Descriptive (not SKU-level); random pulls expected.

**Columns:**

- `id` UUID PRIMARY KEY
- `show_id` UUID NOT NULL REFERENCES `shows(id)`
- `wholesaler_id` UUID NOT NULL REFERENCES `wholesalers(id)`
- `amount` NUMERIC(19,4) NOT NULL (always positive)
- `currency` VARCHAR(3) NOT NULL DEFAULT 'USD' (ISO 4217)
- `description` TEXT NOT NULL
- `due_date` DATE
- `status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'ADJUSTED') NOT NULL DEFAULT 'PENDING'
- `created_by` UUID NOT NULL REFERENCES `users(id)`
- `created_via` ENUM('WEB', 'IMPORT', 'API') NOT NULL DEFAULT 'WEB'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `deleted_at` TIMESTAMPTZ

**Indexes:**

- `idx_owed_line_items_show_id` ON `show_id` WHERE `deleted_at IS NULL`
- `idx_owed_line_items_wholesaler_id` ON `wholesaler_id` WHERE `deleted_at IS NULL`
- `idx_owed_line_items_status` ON `status` WHERE `deleted_at IS NULL`
- `idx_owed_line_items_due_date` ON `due_date` WHERE `deleted_at IS NULL AND status != 'PAID'`

**Constraints:**

- Amount must be > 0
- Currency must be valid ISO 4217 code
- Description cannot be empty
- Status transitions enforced in application (e.g., cannot go from PAID back to PENDING)

**Computed Fields (via views/functions):**

- `paid_amount` = SUM of payment_allocations.amount
- `adjusted_amount` = SUM of adjustments.amount WHERE adjustment_type = 'CREDIT' or 'DEBIT'
- `outstanding_amount` = amount - paid_amount - adjusted_amount

---

#### `payments`

Money paid to wholesalers. Append-only (no updates/deletes).

**Columns:**

- `id` UUID PRIMARY KEY
- `wholesaler_id` UUID NOT NULL REFERENCES `wholesalers(id)`
- `amount` NUMERIC(19,4) NOT NULL (always positive)
- `currency` VARCHAR(3) NOT NULL DEFAULT 'USD'
- `payment_date` DATE NOT NULL
- `payment_method` ENUM('CHECK', 'WIRE', 'ACH', 'CASH', 'CREDIT_CARD', 'OTHER') NOT NULL
- `reference` VARCHAR(255) (check number, transaction ID, etc.)
- `notes` TEXT
- `created_by` UUID NOT NULL REFERENCES `users(id)`
- `created_via` ENUM('WEB', 'IMPORT', 'API') NOT NULL DEFAULT 'WEB'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `deleted_at` TIMESTAMPTZ

**Indexes:**

- `idx_payments_wholesaler_id` ON `wholesaler_id` WHERE `deleted_at IS NULL`
- `idx_payments_payment_date` ON `payment_date` DESC WHERE `deleted_at IS NULL`
- `idx_payments_reference` ON `reference` WHERE `reference IS NOT NULL`

**Constraints:**

- Amount must be > 0
- Currency must be valid ISO 4217 code
- Payment date cannot be in the future
- Reference must be unique per wholesaler (enforce in application if needed)

---

#### `payment_allocations`

Links payments to line items. Append-only (no updates/deletes). Tracks how much of each payment applies to each line item.

**Columns:**

- `id` UUID PRIMARY KEY
- `payment_id` UUID NOT NULL REFERENCES `payments(id)`
- `line_item_id` UUID NOT NULL REFERENCES `owed_line_items(id)`
- `amount` NUMERIC(19,4) NOT NULL (always positive)
- `created_by` UUID NOT NULL REFERENCES `users(id)`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes:**

- `idx_payment_allocations_payment_id` ON `payment_id`
- `idx_payment_allocations_line_item_id` ON `line_item_id`
- `UNIQUE idx_payment_allocations_unique` ON (`payment_id`, `line_item_id`) (prevent duplicate allocations)

**Constraints:**

- Amount must be > 0
- Sum of allocations for a payment cannot exceed payment.amount (enforce in application)
- Sum of allocations for a line item cannot exceed line_item.amount (enforce in application)
- Cannot allocate to deleted line items or payments

**Business Rules (application-level):**

- When allocation created, update `owed_line_items.status` if fully paid
- When allocation deleted (soft delete), recalculate line item status

---

#### `adjustments`

Refunds, corrections, fees. Append-only (no updates/deletes). Can apply to line items or payments. Platform fees affect FEFE profit but do not change wholesaler obligations.

**Columns:**

- `id` UUID PRIMARY KEY
- `line_item_id` UUID REFERENCES `owed_line_items(id)` (nullable, but one of line_item_id or payment_id required)
- `payment_id` UUID REFERENCES `payments(id)` (nullable, but one of line_item_id or payment_id required)
- `amount` NUMERIC(19,4) NOT NULL (can be negative for credits, positive for debits)
- `currency` VARCHAR(3) NOT NULL DEFAULT 'USD'
- `adjustment_type` ENUM('REFUND', 'CORRECTION', 'FEE', 'DISCOUNT', 'WRITE_OFF', 'PLATFORM_FEE') NOT NULL
- `affects_wholesaler_obligation` BOOLEAN NOT NULL DEFAULT TRUE (false for platform fees affecting FEFE profit only)
- `reason` TEXT NOT NULL
- `created_by` UUID NOT NULL REFERENCES `users(id)`
- `created_via` ENUM('WEB', 'IMPORT', 'API') NOT NULL DEFAULT 'WEB'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes:**

- `idx_adjustments_line_item_id` ON `line_item_id` WHERE `line_item_id IS NOT NULL`
- `idx_adjustments_payment_id` ON `payment_id` WHERE `payment_id IS NOT NULL`
- `idx_adjustments_type` ON `adjustment_type`
- `idx_adjustments_created_at` ON `created_at` DESC

**Constraints:**

- Exactly one of `line_item_id` or `payment_id` must be set (CHECK constraint)
- Amount cannot be zero
- Currency must be valid ISO 4217 code
- Reason cannot be empty

**Business Rules (application-level):**

- Adjustments with `affects_wholesaler_obligation = TRUE` affect line item status (e.g., WRITE_OFF marks as PAID)
- Adjustments with `affects_wholesaler_obligation = FALSE` (platform fees) do not change wholesaler obligations or line item status
- Platform fees are tracked for FEFE profit reporting but do not reduce what wholesalers are owed
- Adjustments to payments create new line items or modify existing ones

---

#### `attachments`

Proof images, receipts, documents. Polymorphic relationship to any entity.

**Columns:**

- `id` UUID PRIMARY KEY
- `entity_type` VARCHAR(50) NOT NULL ('show', 'owed_line_item', 'payment', 'adjustment', 'wholesaler')
- `entity_id` UUID NOT NULL
- `s3_key` VARCHAR(512) NOT NULL (S3 object key)
- `filename` VARCHAR(255) NOT NULL
- `mime_type` VARCHAR(100) NOT NULL
- `size_bytes` BIGINT NOT NULL
- `uploaded_by` UUID NOT NULL REFERENCES `users(id)`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `deleted_at` TIMESTAMPTZ

**Indexes:**

- `idx_attachments_entity` ON (`entity_type`, `entity_id`) WHERE `deleted_at IS NULL`
- `idx_attachments_uploaded_by` ON `uploaded_by`

**Constraints:**

- Entity type must be one of the defined values
- S3 key must be unique
- Filename cannot be empty
- Size must be > 0

**Business Rules (application-level):**

- When entity is soft-deleted, attachments are soft-deleted (cascade)
- S3 object deletion handled separately (lifecycle policy or manual cleanup)

---

### Database Views (for reporting)

#### `line_item_balances`

Computed view showing outstanding amounts per line item.

```sql
CREATE VIEW line_item_balances AS
SELECT 
  oli.id,
  oli.show_id,
  oli.wholesaler_id,
  oli.amount as original_amount,
  oli.currency,
  COALESCE(SUM(pa.amount), 0) as paid_amount,
  COALESCE(SUM(CASE WHEN a.adjustment_type IN ('CREDIT', 'WRITE_OFF') AND a.affects_wholesaler_obligation = TRUE THEN a.amount ELSE 0 END), 0) as credit_adjustments,
  COALESCE(SUM(CASE WHEN a.adjustment_type IN ('DEBIT', 'FEE') AND a.affects_wholesaler_obligation = TRUE THEN a.amount ELSE 0 END), 0) as debit_adjustments,
  COALESCE(SUM(CASE WHEN a.affects_wholesaler_obligation = FALSE THEN a.amount ELSE 0 END), 0) as platform_fees,
  (oli.amount - COALESCE(SUM(pa.amount), 0) - COALESCE(SUM(CASE WHEN a.affects_wholesaler_obligation = TRUE THEN a.amount ELSE 0 END), 0)) as outstanding_amount
FROM owed_line_items oli
LEFT JOIN payment_allocations pa ON pa.line_item_id = oli.id
LEFT JOIN adjustments a ON a.line_item_id = oli.id
WHERE oli.deleted_at IS NULL
GROUP BY oli.id;
```

---

## API Contracts

### Authentication

All endpoints require Cognito JWT token in `Authorization: Bearer <token>` header.

Token contains:

- `sub` (Cognito user ID)
- `email`
- `cognito:groups` (roles: ADMIN, OPERATOR, WHOLESALER)

---

### Authorization Rules

**ADMIN:**

- Full CRUD on all resources
- Can create adjustments of any type
- Can delete (soft delete) any resource
- Can view all shows, payments, line items

**OPERATOR:**

- Can create/update shows, line items, payments, allocations
- Can create adjustments (except WRITE_OFF)
- Cannot delete financial records (payments, line items, allocations)
- Can soft-delete shows (if no payments allocated)
- Can view all shows, payments, line items

**WHOLESALER:**

- Read-only access to their own data (when wholesaler linked to user)
- Can view shows where they have line items
- Can view payments made to them
- Cannot create/modify any financial records
- Cannot view other wholesalers' data

---

### Endpoints

#### Users

**GET /api/users/me**

Get current user profile.

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "ADMIN",
  "fullName": "John Doe",
  "createdAt": "2025-01-27T00:00:00Z"
}
```

**Authorization:** All authenticated users

---

#### Wholesalers

**GET /api/wholesalers**

List wholesalers (paginated, filtered).

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)
- `search` (string, searches name, email)
- `includeDeleted` (boolean, default: false)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ABC Wholesale",
      "contactEmail": "contact@abc.com",
      "contactPhone": "+1-555-0100",
      "address": {
        "street": "123 Main St",
        "city": "Portland",
        "state": "OR",
        "zip": "97201",
        "country": "US"
      },
      "taxId": "12-3456789",
      "notes": "Primary supplier",
      "createdAt": "2025-01-27T00:00:00Z",
      "updatedAt": "2025-01-27T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (own only, when linked)

---

**GET /api/wholesalers/:id**

Get single wholesaler.

**Response:** Same as list item

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (own only)

---

**POST /api/wholesalers**

Create wholesaler.

**Request:**

```json
{
  "name": "ABC Wholesale",
  "contactEmail": "contact@abc.com",
  "contactPhone": "+1-555-0100",
  "address": {
    "street": "123 Main St",
    "city": "Portland",
    "state": "OR",
    "zip": "97201",
    "country": "US"
  },
  "taxId": "12-3456789",
  "notes": "Primary supplier"
}
```

**Response:** Created wholesaler (same shape as GET)

**Authorization:** ADMIN, OPERATOR

---

**PATCH /api/wholesalers/:id**

Update wholesaler (soft delete via `deletedAt` field).

**Request:**

```json
{
  "name": "Updated Name",
  "contactEmail": "new@abc.com"
}
```

**Response:** Updated wholesaler

**Authorization:** ADMIN, OPERATOR

---

**GET /api/wholesalers/:id/line-items**

Get all line items for a wholesaler.

**Query Parameters:**

- `status` (enum: PENDING, PARTIALLY_PAID, PAID, ADJUSTED)
- `showId` (uuid)
- `includeDeleted` (boolean)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "showId": "uuid",
      "showName": "Portland Market 2025",
      "amount": "1250.50",
      "currency": "USD",
      "description": "Booth rental fee",
      "dueDate": "2025-02-15",
      "status": "PENDING",
      "paidAmount": "0.00",
      "outstandingAmount": "1250.50",
      "createdVia": "WEB",
      "createdAt": "2025-01-27T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (own only)

---

#### Shows

**GET /api/shows**

List shows (paginated, filtered).

**Query Parameters:**

- `page`, `limit`
- `status` (enum)
- `platform` (enum: WHATNOT, INSTAGRAM, MANUAL)
- `source` (enum: WHATNOT, INSTAGRAM, MANUAL)
- `startDate`, `endDate` (date range)
- `search` (string, searches name, location)
- `includeDeleted` (boolean)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "id": "uuid",
      "name": "Portland Market 2025",
      "showDate": "2025-03-15",
      "location": "Oregon Convention Center",
      "platform": "WHATNOT",
      "source": "WHATNOT",
      "externalReference": "whatnot-show-12345",
      "notes": "Spring show",
      "status": "PLANNED",
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "createdVia": "WEB",
      "lineItemCount": 12,
      "totalOwed": "15000.00",
      "createdAt": "2025-01-27T00:00:00Z",
      "updatedAt": "2025-01-27T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (shows with their line items)

---

**GET /api/shows/:id**

Get single show with line items.

**Response:**

```json
{
  "id": "uuid",
  "name": "Portland Market 2025",
  "showDate": "2025-03-15",
  "location": "Oregon Convention Center",
  "platform": "WHATNOT",
  "source": "WHATNOT",
  "externalReference": "whatnot-show-12345",
  "notes": "Spring show",
  "status": "PLANNED",
  "createdBy": "uuid",
  "createdByName": "John Doe",
  "createdVia": "WEB",
  "lineItems": [
    {
      "id": "uuid",
      "wholesalerId": "uuid",
      "wholesalerName": "ABC Wholesale",
      "amount": "1250.50",
      "currency": "USD",
      "description": "Booth rental",
      "dueDate": "2025-02-15",
      "status": "PENDING",
      "paidAmount": "0.00",
      "outstandingAmount": "1250.50"
    }
  ],
  "createdAt": "2025-01-27T00:00:00Z",
  "updatedAt": "2025-01-27T00:00:00Z"
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (if has line items)

---

**POST /api/shows**

Create show.

**Request:**

```json
{
  "name": "Portland Market 2025",
  "showDate": "2025-03-15",
  "location": "Oregon Convention Center",
  "platform": "WHATNOT",
  "source": "WHATNOT",
  "externalReference": "whatnot-show-12345",
  "notes": "Spring show",
  "status": "PLANNED"
}
```

**Response:** Created show (same shape as GET)

**Authorization:** ADMIN, OPERATOR

---

**PATCH /api/shows/:id**

Update show.

**Request:**

```json
{
  "name": "Updated Name",
  "status": "COMPLETED"
}
```

**Response:** Updated show

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Cannot change status to CANCELLED if payments exist
- Cannot soft-delete if line items with payments exist

---

#### Owed Line Items

**GET /api/line-items/:id**

Get single line item with payment history.

**Response:**

```json
{
  "id": "uuid",
  "showId": "uuid",
  "showName": "Portland Market 2025",
  "wholesalerId": "uuid",
  "wholesalerName": "ABC Wholesale",
  "amount": "1250.50",
  "currency": "USD",
  "description": "Booth rental fee",
  "dueDate": "2025-02-15",
  "status": "PARTIALLY_PAID",
  "paidAmount": "500.00",
  "outstandingAmount": "750.50",
  "adjustments": [
    {
      "id": "uuid",
      "amount": "-50.00",
      "adjustmentType": "DISCOUNT",
      "reason": "Early payment discount",
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "createdAt": "2025-01-27T00:00:00Z"
    }
  ],
  "paymentAllocations": [
    {
      "id": "uuid",
      "paymentId": "uuid",
      "paymentDate": "2025-01-20",
      "amount": "500.00",
      "createdAt": "2025-01-20T00:00:00Z"
    }
  ],
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "createdVia": "WEB",
      "createdAt": "2025-01-27T00:00:00Z",
      "updatedAt": "2025-01-27T00:00:00Z"
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (own only)

---

**POST /api/shows/:showId/line-items**

Create line item for a show.

**Request:**

```json
{
  "wholesalerId": "uuid",
  "amount": "1250.50",
  "currency": "USD",
  "description": "Booth rental fee",
  "dueDate": "2025-02-15"
}
```

**Response:** Created line item (same shape as GET)

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Amount must be > 0
- Wholesaler must exist and not be deleted
- Show must exist and not be deleted

---

**PATCH /api/line-items/:id**

Update line item (description, due date only; amount is immutable).

**Request:**

```json
{
  "description": "Updated description",
  "dueDate": "2025-02-20"
}
```

**Response:** Updated line item

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Cannot update amount (use adjustment instead)
- Cannot update if payments allocated (use adjustment instead)
- Cannot soft-delete if payments allocated

---

#### Payments

**GET /api/payments**

List payments (paginated, filtered).

**Query Parameters:**

- `page`, `limit`
- `wholesalerId` (uuid)
- `startDate`, `endDate` (payment date range)
- `paymentMethod` (enum)
- `includeDeleted` (boolean)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "wholesalerId": "uuid",
      "wholesalerName": "ABC Wholesale",
      "amount": "500.00",
      "currency": "USD",
      "paymentDate": "2025-01-20",
      "paymentMethod": "CHECK",
      "reference": "CHK-1234",
      "notes": "Payment for booth rental",
      "allocatedAmount": "500.00",
      "unallocatedAmount": "0.00",
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "createdVia": "WEB",
      "createdAt": "2025-01-20T00:00:00Z",
      "updatedAt": "2025-01-20T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (payments to them)

---

**GET /api/payments/:id**

Get single payment with allocations.

**Response:**

```json
{
  "id": "uuid",
  "wholesalerId": "uuid",
  "wholesalerName": "ABC Wholesale",
  "amount": "500.00",
  "currency": "USD",
  "paymentDate": "2025-01-20",
  "paymentMethod": "CHECK",
  "reference": "CHK-1234",
  "notes": "Payment for booth rental",
  "allocations": [
    {
      "id": "uuid",
      "lineItemId": "uuid",
      "lineItemDescription": "Booth rental fee",
      "showName": "Portland Market 2025",
      "amount": "500.00",
      "createdAt": "2025-01-20T00:00:00Z"
    }
  ],
      "adjustments": [],
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "createdVia": "WEB",
      "createdAt": "2025-01-20T00:00:00Z",
      "updatedAt": "2025-01-20T00:00:00Z"
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (payments to them)

---

**POST /api/payments**

Create payment.

**Request:**

```json
{
  "wholesalerId": "uuid",
  "amount": "500.00",
  "currency": "USD",
  "paymentDate": "2025-01-20",
  "paymentMethod": "CHECK",
  "reference": "CHK-1234",
  "notes": "Payment for booth rental"
}
```

**Response:** Created payment (same shape as GET)

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Amount must be > 0
- Payment date cannot be in the future
- Wholesaler must exist and not be deleted

---

**PATCH /api/payments/:id**

Update payment (notes, reference only; amount and date are immutable).

**Request:**

```json
{
  "notes": "Updated notes",
  "reference": "CHK-1234-UPDATED"
}
```

**Response:** Updated payment

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Cannot update amount or payment date (use adjustment instead)
- Cannot soft-delete if allocations exist

---

#### Payment Allocations

**POST /api/payments/:paymentId/allocations**

Allocate payment to line item(s).

**Request:**

```json
{
  "allocations": [
    {
      "lineItemId": "uuid",
      "amount": "500.00"
    },
    {
      "lineItemId": "uuid",
      "amount": "250.00"
    }
  ]
}
```

**Response:**

```json
{
  "paymentId": "uuid",
  "allocations": [
    {
      "id": "uuid",
      "lineItemId": "uuid",
      "amount": "500.00",
      "createdAt": "2025-01-27T00:00:00Z"
    },
    {
      "id": "uuid",
      "lineItemId": "uuid",
      "amount": "250.00",
      "createdAt": "2025-01-27T00:00:00Z"
    }
  ],
  "totalAllocated": "750.00",
  "unallocatedAmount": "0.00"
}
```

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Sum of allocation amounts cannot exceed payment amount
- Each allocation amount cannot exceed line item outstanding amount
- Payment and line items must belong to same wholesaler
- Automatically updates line item status (PENDING → PARTIALLY_PAID → PAID)

---

**DELETE /api/allocations/:id**

Soft delete allocation (reverses the allocation).

**Response:** 204 No Content

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Recalculates line item status
- Cannot delete if adjustment references the allocation (enforce in application)

---

#### Adjustments

**GET /api/adjustments**

List adjustments (paginated, filtered).

**Query Parameters:**

- `page`, `limit`
- `lineItemId` (uuid)
- `paymentId` (uuid)
- `adjustmentType` (enum)
- `affectsWholesalerObligation` (boolean, filter platform fees)
- `startDate`, `endDate` (created date range)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "lineItemId": "uuid",
      "lineItemDescription": "Booth rental fee",
      "paymentId": null,
      "amount": "-50.00",
      "currency": "USD",
      "adjustmentType": "DISCOUNT",
      "affectsWholesalerObligation": true,
      "reason": "Early payment discount",
      "createdBy": "uuid",
      "createdByName": "John Doe",
      "createdVia": "WEB",
      "createdAt": "2025-01-27T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (adjustments to their line items)

---

**POST /api/adjustments**

Create adjustment.

**Request:**

```json
{
  "lineItemId": "uuid",
  "amount": "-50.00",
  "currency": "USD",
  "adjustmentType": "DISCOUNT",
  "affectsWholesalerObligation": true,
  "reason": "Early payment discount"
}
```

OR

```json
{
  "paymentId": "uuid",
  "amount": "25.00",
  "currency": "USD",
  "adjustmentType": "FEE",
  "affectsWholesalerObligation": true,
  "reason": "Processing fee"
}
```

OR (Platform fee - affects FEFE profit only):

```json
{
  "lineItemId": "uuid",
  "amount": "15.00",
  "currency": "USD",
  "adjustmentType": "PLATFORM_FEE",
  "affectsWholesalerObligation": false,
  "reason": "Whatnot platform fee"
}
```

**Response:** Created adjustment (same shape as GET)

**Authorization:** ADMIN (all types), OPERATOR (except WRITE_OFF)

**Business Rules:**

- Exactly one of `lineItemId` or `paymentId` required
- Amount cannot be zero
- `affectsWholesalerObligation` defaults to `true` if not provided
- Platform fees (`PLATFORM_FEE` type) should have `affectsWholesalerObligation = false`
- WRITE_OFF adjustments mark line item as PAID (only if `affectsWholesalerObligation = true`)
- Adjustments with `affectsWholesalerObligation = false` do not change line item status or outstanding amounts
- Adjustments are append-only (no updates/deletes)

---

#### Attachments

**GET /api/attachments**

List attachments (paginated, filtered by entity).

**Query Parameters:**

- `page`, `limit`
- `entityType` (enum)
- `entityId` (uuid)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "payment",
      "entityId": "uuid",
      "filename": "receipt.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 245760,
      "uploadedBy": "uuid",
      "uploadedByName": "John Doe",
      "createdAt": "2025-01-27T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (attachments on their entities)

---

**POST /api/attachments/upload-url**

Get presigned S3 upload URL.

**Request:**

```json
{
  "entityType": "payment",
  "entityId": "uuid",
  "filename": "receipt.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 245760
}
```

**Response:**

```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...",
  "attachmentId": "uuid",
  "s3Key": "attachments/uuid/receipt.pdf",
  "expiresIn": 300
}
```

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Upload URL expires in 5 minutes
- After upload, client must call POST /api/attachments/:id/confirm to finalize
- File size limit: 10MB (enforce in application)
- Allowed MIME types: image/*, application/pdf

---

**POST /api/attachments/:id/confirm**

Confirm attachment upload completed.

**Request:** (empty body)

**Response:** Confirmed attachment (same shape as GET)

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Verifies S3 object exists before confirming
- If confirmation not received within 1 hour, attachment is soft-deleted

---

**GET /api/attachments/:id/download-url**

Get presigned S3 download URL.

**Response:**

```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...",
  "expiresIn": 300
}
```

**Authorization:** ADMIN, OPERATOR (all), WHOLESALER (own attachments)

**Business Rules:**

- Download URL expires in 5 minutes
- Logs download event for audit

---

**DELETE /api/attachments/:id**

Soft delete attachment.

**Response:** 204 No Content

**Authorization:** ADMIN, OPERATOR

**Business Rules:**

- Does not delete S3 object (handled by lifecycle policy or manual cleanup)
- Cannot delete if entity is locked (e.g., payment with allocations)

---

## Future Expansion Support

### Multi-Currency

- `currency` columns already present in `owed_line_items`, `payments`, `adjustments`
- Add `exchange_rates` table when needed: `(from_currency, to_currency, rate, effective_date)`
- Add `default_currency` to `wholesalers` table
- No schema changes required for basic multi-currency support

### Wholesaler-User Linking

- Add `user_id` UUID nullable column to `wholesalers` table
- Add foreign key: `REFERENCES users(id)`
- Add index: `idx_wholesalers_user_id` ON `user_id`
- WHOLESALER role users can only see their linked wholesaler's data
- No breaking changes to existing API contracts

### Reporting & Analytics

- `line_item_balances` view provides foundation
- Add materialized views for common reports (monthly summaries, aging reports)
- Add `report_cache` table for expensive queries if needed
- All timestamps are UTC, enabling timezone-aware reporting

### Audit Trail

- Add `audit_log` table: `(id, entity_type, entity_id, action, old_values, new_values, user_id, ip_address, created_at)`
- Use database triggers or application-level logging
- No changes to existing tables required

### Recurring Obligations

- Add `recurring_template` table: `(id, wholesaler_id, amount, description, frequency, next_due_date)`
- Add `template_id` nullable column to `owed_line_items`
- Templates generate line items on schedule
- No changes to payment/allocation logic

### Tax Reporting (1099)

- Add `tax_year` and `tax_reported` boolean columns to `payments`
- Add `tax_documents` table for generated 1099s
- Use existing `wholesalers.tax_id` field
- No changes to core financial tables

### Payment Methods Expansion

- `payment_method` is ENUM; can add values without migration
- Add `payment_method_details` JSONB column for method-specific data (routing numbers, card last 4, etc.)
- Backward compatible

### Show Categories/Types

- Add `show_type` ENUM or `category_id` foreign key to `shows` table
- Add `categories` table if hierarchical structure needed
- No impact on financial tables

### Approval Workflows

- Add `approval_status` ENUM and `approved_by`, `approved_at` columns to `payments` and `adjustments`
- Add `approval_requests` table for multi-step approvals
- Financial records remain append-only

---

## Design Principles Applied

1. **Append-Only Financial Records**: `payments`, `payment_allocations`, `adjustments` have no UPDATE/DELETE operations (only soft deletes for audit)
2. **Soft Deletes**: All tables use `deleted_at` for logical deletion, preserving referential integrity
3. **Decimal Precision**: All monetary amounts use `NUMERIC(19,4)` (supports up to $999,999,999,999.9999)
4. **UTC Timestamps**: All `created_at`, `updated_at`, `deleted_at` are `TIMESTAMPTZ` (stored in UTC)
5. **Polymorphic Attachments**: `attachments.entity_type` + `entity_id` supports any entity without foreign key constraints
6. **Status Computed from Allocations**: Line item status derived from payment allocations, not stored directly (enforced via triggers or application logic)
7. **Idempotency Ready**: All POST endpoints can accept `idempotency_key` header (not shown in contracts but should be implemented)
8. **Role-Based Access**: Authorization rules enforce data isolation (WHOLESALER sees only their data)

This schema and API design supports the production system requirements while remaining extensible for future needs without requiring refactoring of core financial tables.

---

## Confirmation: Schema Updates

The following additive updates have been incorporated:

1. **Metadata Fields Added:**
  - `source` (WHATNOT | INSTAGRAM | MANUAL) on `shows` table
  - `created_via` (WEB | IMPORT | API) on `shows`, `owed_line_items`, `payments`, `adjustments`
  - `platform` (WHATNOT | INSTAGRAM | MANUAL) on `shows` table
  - `external_reference` (VARCHAR, optional) on `shows` table
2. **Platform Fees:**
  - Added `PLATFORM_FEE` to `adjustment_type` ENUM
  - Added `affects_wholesaler_obligation` BOOLEAN column to `adjustments` table
  - Platform fees track FEFE profit impact but do not change wholesaler obligations
  - Business logic ensures platform fees do not affect line item status or outstanding amounts
3. **Line Items:**
  - Confirmed as descriptive (not SKU-level)
  - Random pulls expected and supported
  - No schema changes required
4. **Soft Deletes:**
  - Already implemented via `deleted_at` TIMESTAMPTZ on all tables
  - No changes required

**Core Entities & Relationships:** Unchanged. All updates are additive columns or ENUM value additions. No foreign keys, primary keys, or relationship structures modified.

**Schema Refactor Required:** None. All changes are backward-compatible additions.

---

## Finalized V1 Scope Summary

**Database Schema:**

- 8 core tables: `users`, `wholesalers`, `shows`, `owed_line_items`, `payments`, `payment_allocations`, `adjustments`, `attachments`
- Append-only financial records (`payments`, `payment_allocations`, `adjustments`) with soft deletes
- Decimal-safe money handling (`NUMERIC(19,4)`)
- UTC timestamps throughout
- Soft deletes via `deleted_at` on all tables
- Metadata tracking: `source`, `created_via`, `platform`, `external_reference` on relevant entities
- Platform fees modeled as adjustments with `affects_wholesaler_obligation = false`

**API Contracts:**

- RESTful endpoints for all entities with pagination, filtering, and role-based authorization
- Cognito JWT authentication with ADMIN, OPERATOR, WHOLESALER roles
- Append-only operations for financial records (no destructive updates)
- Presigned S3 URLs for private file uploads/downloads
- Query parameters support filtering by `platform`, `source`, `created_via`, `affectsWholesalerObligation`

**Domain Model:**

- Shows represent sales events with platform/source tracking
- Owed line items are descriptive (not SKU-level), supporting random pulls
- Payments allocated to line items via `payment_allocations`
- Adjustments handle corrections, refunds, fees, and platform fees (FEFE profit tracking)
- Wholesalers are entities (not users), with future linking support
- Attachments are polymorphic (any entity type)

**Design Constraints Enforced:**

- Financial records append-only (no UPDATE/DELETE on `payments`, `payment_allocations`, `adjustments`)
- Soft deletes preserve referential integrity
- Platform fees do not affect wholesaler obligations
- Line items remain descriptive (no SKU-level tracking)
- All timestamps UTC
- Decimal precision for money (`NUMERIC(19,4)`)

This v1 scope provides a production-ready foundation for the reseller business system with clear extension paths for future features.