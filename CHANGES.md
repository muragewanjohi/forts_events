# Recent Changes

## 1. Waiter Access Restrictions

**What Changed:**
- Waiters can now only access **POS** and **Orders** pages
- Waiters cannot access Dashboard, Reports, Users, Inventory, or Transfers

**Implementation:**
- Updated `client/src/App.jsx` with `NonWaiterRoute` component
- Updated `client/src/components/Layout.jsx` to filter menu items by role
- Waiters see only POS and Orders in the sidebar

**Access Levels:**
- **Waiter**: POS, Orders only
- **Cashier/Bartender**: Dashboard, POS, Orders, Reports
- **Admin**: Full access to all pages

## 2. Separate Order Status and Payment Status

**What Changed:**
- Orders now have two separate statuses:
  - **Order Status**: Tracks order fulfillment (pending, preparing, ready, completed, cancelled)
  - **Payment Status**: Tracks payment (pending, paid, refunded)

**Database Changes:**
- Added `payment_status` column to `orders` table
- Added `paid_at` timestamp column
- Updated `status` constraint to include new statuses

**Order Status Values:**
- `pending` - Order just created
- `preparing` - Order being prepared
- `ready` - Order ready for pickup/delivery
- `completed` - Order fulfilled
- `cancelled` - Order cancelled

**Payment Status Values:**
- `pending` - Payment not yet received
- `paid` - Payment received
- `refunded` - Payment refunded

**API Changes:**
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/payment-status` - Update payment status
- `POST /api/orders/:id/mark-paid` - Mark order as paid

**Frontend Changes:**
- Orders page shows both statuses with separate badges
- Filters for both order status and payment status
- Status dropdowns for non-waiters to update both statuses
- "Mark Paid" button for pending payments

**Reports:**
- Reports now filter by `payment_status = 'paid'` instead of `status = 'completed'`
- This ensures only paid orders are included in sales reports

## Migration

If you have an existing database, run:

```bash
npm run migrate
```

This will add the `payment_status` column and set existing completed orders to `paid`.

## Testing

1. **Test Waiter Access:**
   - Login as a waiter
   - Verify only POS and Orders are visible in sidebar
   - Try accessing `/dashboard` or `/reports` - should redirect to POS

2. **Test Order Statuses:**
   - Create a new order (status: pending, payment_status: pending)
   - Update order status to "preparing", "ready", then "completed"
   - Mark payment as "paid"
   - Verify both statuses are displayed correctly

3. **Test Reports:**
   - Create orders with different payment statuses
   - Generate reports - only paid orders should appear

