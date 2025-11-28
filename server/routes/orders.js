const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

// Get all orders (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, waiter_id, start_date, end_date, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    
    // If user is a waiter, they can only see their own orders
    if (req.user.role === 'waiter') {
      filters.waiter_id = req.user.id;
    } else if (waiter_id) {
      // Admins, cashiers, and bartenders can filter by waiter_id
      filters.waiter_id = waiter_id;
    }
    
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (limit) filters.limit = parseInt(limit);

    const orders = await Order.findAll(filters);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders', message: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // If user is a waiter, they can only access their own orders
    if (req.user.role === 'waiter' && order.waiter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order', message: error.message });
  }
});

// Create new order
router.post('/', authenticate, async (req, res) => {
  try {
    const { waiter_id, items, payment_method, table_id, order_type } = req.body;

    if (!waiter_id) {
      return res.status(400).json({ error: 'Waiter ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate order_type
    if (order_type && !['dine_in', 'takeaway'].includes(order_type)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    // Validate table_id if provided
    if (table_id && order_type === 'takeaway') {
      return res.status(400).json({ error: 'Table cannot be assigned to takeaway orders' });
    }

    // If user is a waiter, they can only create orders for themselves
    // If waiter_id is not provided, use current user's ID
    let finalWaiterId;
    if (req.user.role === 'waiter') {
      // Waiters can only create orders for themselves
      finalWaiterId = req.user.id;
    } else {
      // Admins, cashiers, and bartenders can create orders for any waiter
      finalWaiterId = waiter_id || req.user.id;
    }

    const order = await Order.create({
      waiter_id: finalWaiterId,
      items,
      table_id: table_id || null,
      order_type: order_type || (table_id ? 'dine_in' : 'takeaway')
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error creating order', message: error.message });
  }
});

// Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cashier_id } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if order exists and user has permission
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If user is a waiter, they can only update their own orders
    // Waiters can only update to 'preparing' or 'ready' status
    if (req.user.role === 'waiter') {
      if (existingOrder.waiter_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only update your own orders.' });
      }
      if (!['preparing', 'ready'].includes(status)) {
        return res.status(403).json({ error: 'Waiters can only update order status to preparing or ready' });
      }
    }

    const finalCashierId = cashier_id || req.user.id;
    const order = await Order.updateStatus(id, status, finalCashierId);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Error updating order', message: error.message });
  }
});

// Update payment status
router.patch('/:id/payment-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, cashier_id, payment_method, mpesa_reference } = req.body;

    if (!payment_status) {
      return res.status(400).json({ error: 'Payment status is required' });
    }

    const validPaymentStatuses = ['pending', 'paid', 'refunded'];
    if (!validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // If payment status is paid, payment method is required
    if (payment_status === 'paid' && !payment_method) {
      return res.status(400).json({ error: 'Payment method is required when marking as paid' });
    }

    // If payment method is mpesa, reference is required
    if (payment_method === 'mpesa' && !mpesa_reference) {
      return res.status(400).json({ error: 'M-Pesa reference number is required' });
    }

    // Validate payment method
    if (payment_method && !['cash', 'mpesa'].includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Check if order exists and user has permission
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If user is a waiter, they can only update their own orders
    if (req.user.role === 'waiter' && existingOrder.waiter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only update your own orders.' });
    }

    const finalCashierId = cashier_id || req.user.id;
    const order = await Order.updatePaymentStatus(id, payment_status, finalCashierId, payment_method, mpesa_reference);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Error updating payment status', message: error.message });
  }
});

// Complete order
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { cashier_id } = req.body;

    // Check if order exists and user has permission
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If user is a waiter, they can only complete their own orders
    if (req.user.role === 'waiter' && existingOrder.waiter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only complete your own orders.' });
    }

    const finalCashierId = cashier_id || req.user.id;
    const order = await Order.complete(id, finalCashierId);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error completing order', message: error.message });
  }
});

// Mark order as paid
router.post('/:id/mark-paid', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { cashier_id } = req.body;

    // Check if order exists and user has permission
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If user is a waiter, they can only mark their own orders as paid
    if (req.user.role === 'waiter' && existingOrder.waiter_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only mark your own orders as paid.' });
    }

    const finalCashierId = cashier_id || req.user.id;
    const order = await Order.markPaid(id, finalCashierId);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error marking order as paid', message: error.message });
  }
});

module.exports = router;

