# Database Migration Guide

## Adding Payment Status to Existing Database

If you have an existing database, run the migration script to add the `payment_status` column:

```bash
npm run migrate
```

This will:
1. Add `payment_status` column to the `orders` table
2. Set existing completed orders to `payment_status = 'paid'`
3. Add `paid_at` timestamp column

## What Changed

### Database Schema
- Added `payment_status` column (pending, paid, refunded)
- Added `paid_at` timestamp
- Updated order `status` to include: pending, preparing, ready, completed, cancelled

### Order Status vs Payment Status

**Order Status** - Tracks the order fulfillment:
- `pending` - Order just created
- `preparing` - Order being prepared
- `ready` - Order ready for pickup/delivery
- `completed` - Order fulfilled
- `cancelled` - Order cancelled

**Payment Status** - Tracks payment:
- `pending` - Payment not yet received
- `paid` - Payment received
- `refunded` - Payment refunded

### API Changes

New endpoints:
- `PATCH /api/orders/:id/payment-status` - Update payment status
- `POST /api/orders/:id/mark-paid` - Mark order as paid

Updated endpoints:
- `PATCH /api/orders/:id/status` - Now accepts: pending, preparing, ready, completed, cancelled

### Reports

Reports now filter by `payment_status = 'paid'` instead of `status = 'completed'` to show only paid orders in sales reports.

## After Migration

1. Existing completed orders will have `payment_status = 'paid'`
2. New orders will have `payment_status = 'pending'` by default
3. You can now track payment separately from order fulfillment

