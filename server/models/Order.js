const { db } = require('../database/db');

class Order {
  static generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  static async create({ waiter_id, items, table_id, order_type }) {
    if (!waiter_id) {
      throw new Error('Waiter ID is required for all orders');
    }

    const order_number = this.generateOrderNumber();
    
    // Calculate total
    let total_amount = 0;
    for (const item of items) {
      const itemData = await db.promisify.get(
        'SELECT cost_per_item FROM items WHERE id = ?',
        [item.item_id]
      );
      if (!itemData) {
        throw new Error(`Item with id ${item.item_id} not found`);
      }
      total_amount += itemData.cost_per_item * item.quantity;
    }

    // Determine order_type if not provided
    const finalOrderType = order_type || (table_id ? 'dine_in' : 'takeaway');

    // Create order with default status and payment_status (no payment_method initially)
    const orderResult = await db.promisify.run(
      `INSERT INTO orders (order_number, waiter_id, total_amount, status, payment_status, table_id, order_type)
       VALUES (?, ?, ?, 'pending', 'pending', ?, ?)`,
      [order_number, waiter_id, total_amount, table_id || null, finalOrderType]
    );

    // Update table status if table_id is provided
    if (table_id) {
      await db.promisify.run(
        'UPDATE tables SET status = "occupied", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [table_id]
      );
    }

    const order_id = orderResult.lastID;

    // Create order items
    for (const item of items) {
      const itemData = await db.promisify.get(
        'SELECT cost_per_item FROM items WHERE id = ?',
        [item.item_id]
      );
      
      await db.promisify.run(
        `INSERT INTO order_items (order_id, item_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [order_id, item.item_id, item.quantity, itemData.cost_per_item]
      );
    }

    return this.findById(order_id);
  }

  static async findById(id) {
    const order = await db.promisify.get(
      `SELECT o.*, 
              w.full_name as waiter_name,
              c.full_name as cashier_name,
              t.table_number
       FROM orders o
       LEFT JOIN users w ON o.waiter_id = w.id
       LEFT JOIN users c ON o.cashier_id = c.id
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE o.id = ?`,
      [id]
    );

    if (order) {
      order.items = await this.getOrderItems(id);
    }

    return order;
  }

  static async getOrderItems(order_id) {
    return await db.promisify.all(
      `SELECT oi.*, i.name as item_name, i.sku
       FROM order_items oi
       JOIN items i ON oi.item_id = i.id
       WHERE oi.order_id = ?`,
      [order_id]
    );
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT o.*, 
             w.full_name as waiter_name,
             c.full_name as cashier_name,
             t.table_number
      FROM orders o
      LEFT JOIN users w ON o.waiter_id = w.id
      LEFT JOIN users c ON o.cashier_id = c.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    if (filters.waiter_id) {
      query += ' AND o.waiter_id = ?';
      params.push(filters.waiter_id);
    }

    if (filters.start_date) {
      query += ' AND o.created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND o.created_at <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const orders = await db.promisify.all(query, params);

    // Get items for each order
    for (const order of orders) {
      order.items = await this.getOrderItems(order.id);
    }

    return orders;
  }

  static async updateStatus(id, status, cashier_id = null) {
    // Validate order exists first
    const existingOrder = await db.promisify.get(
      'SELECT id, table_id FROM orders WHERE id = ?',
      [id]
    );

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const updates = ['status = ?'];
    const params = [status];

    if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
      if (cashier_id) {
        updates.push('cashier_id = ?');
        params.push(cashier_id);
      }
      
      // Free up table if order is completed
      if (existingOrder.table_id) {
        await db.promisify.run(
          'UPDATE tables SET status = "available", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [existingOrder.table_id]
        );
      }
    }

    params.push(id);

    await db.promisify.run(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async updatePaymentStatus(id, payment_status, cashier_id = null, payment_method = null, mpesa_reference = null) {
    const updates = ['payment_status = ?'];
    const params = [payment_status];

    if (payment_status === 'paid') {
      updates.push('paid_at = CURRENT_TIMESTAMP');
      if (cashier_id) {
        updates.push('cashier_id = ?');
        params.push(cashier_id);
      }
      if (payment_method) {
        updates.push('payment_method = ?');
        params.push(payment_method);
      }
      if (mpesa_reference) {
        updates.push('mpesa_reference = ?');
        params.push(mpesa_reference);
      }
    }

    params.push(id);

    await db.promisify.run(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async complete(id, cashier_id = null) {
    return this.updateStatus(id, 'completed', cashier_id);
  }

  static async markPaid(id, cashier_id = null) {
    return this.updatePaymentStatus(id, 'paid', cashier_id);
  }
}

module.exports = Order;

