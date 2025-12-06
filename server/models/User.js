const { db } = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, full_name, password, role }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.promisify.run(
      `INSERT INTO users (username, full_name, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [username, full_name, passwordHash, role]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return await db.promisify.get(
      'SELECT id, username, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  }

  static async findByUsername(username) {
    return await db.promisify.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  static async findAll(filters = {}) {
    let query = 'SELECT id, username, full_name, role, is_active, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.active_only !== false) {
      query += ' AND is_active = 1';
    }

    query += ' ORDER BY created_at DESC';

    return await db.promisify.all(query, params);
  }

  static async update(id, { full_name, password, role, is_active }) {
    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }

    // Only update password if it's provided and not empty
    if (password !== undefined && password !== null && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.promisify.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async deactivate(id) {
    return this.update(id, { is_active: 0 });
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async getStats(id, startDate, endDate) {
    const stats = await db.promisify.get(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'mpesa' THEN total_amount ELSE 0 END), 0) as mpesa_sales,
        COALESCE(SUM(total_amount), 0) as total_sales
       FROM orders
       WHERE waiter_id = ? AND payment_status = 'paid'
       AND created_at BETWEEN ? AND ?`,
      [id, startDate, endDate]
    );
    return stats;
  }
}

module.exports = User;

