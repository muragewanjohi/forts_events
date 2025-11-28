const { db } = require('../database/db');

class Table {
  static async create({ table_number, capacity, location, notes }) {
    const result = await db.promisify.run(
      `INSERT INTO tables (table_number, capacity, location, notes, status)
       VALUES (?, ?, ?, ?, 'available')`,
      [table_number, capacity || 4, location, notes]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return await db.promisify.get(
      'SELECT * FROM tables WHERE id = ?',
      [id]
    );
  }

  static async findByNumber(table_number) {
    return await db.promisify.get(
      'SELECT * FROM tables WHERE table_number = ?',
      [table_number]
    );
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM tables WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY CAST(table_number AS INTEGER), table_number';

    return await db.promisify.all(query, params);
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.promisify.run(
      `UPDATE tables SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await db.promisify.run(
      'UPDATE tables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    // Check if table has active orders
    const activeOrders = await db.promisify.get(
      `SELECT COUNT(*) as count FROM orders 
       WHERE table_id = ? AND status NOT IN ('completed', 'cancelled')`,
      [id]
    );

    if (activeOrders.count > 0) {
      throw new Error('Cannot delete table with active orders');
    }

    await db.promisify.run('DELETE FROM tables WHERE id = ?', [id]);
    return true;
  }

  static async getAvailable() {
    return await db.promisify.all(
      `SELECT * FROM tables 
       WHERE status = 'available' 
       ORDER BY CAST(table_number AS INTEGER), table_number`
    );
  }

  static async getOccupied() {
    return await db.promisify.all(
      `SELECT t.*, COUNT(o.id) as active_orders
       FROM tables t
       LEFT JOIN orders o ON t.id = o.table_id 
         AND o.status NOT IN ('completed', 'cancelled')
       WHERE t.status = 'occupied'
       GROUP BY t.id
       ORDER BY CAST(t.table_number AS INTEGER), t.table_number`
    );
  }
}

module.exports = Table;

