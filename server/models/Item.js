const { db } = require('../database/db');

class Item {
  static async create({ name, sku, cost_per_item, category_id, stock_main_store = 0 }) {
    const result = await db.promisify.run(
      `INSERT INTO items (name, sku, cost_per_item, category_id, stock_main_store)
       VALUES (?, ?, ?, ?, ?)`,
      [name, sku, cost_per_item, category_id || null, stock_main_store]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return await db.promisify.get(
      `SELECT i.*, c.name as category_name
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ?`,
      [id]
    );
  }

  static async findAll(filters = {}) {
    let query = `SELECT i.*, c.name as category_name
                 FROM items i
                 LEFT JOIN categories c ON i.category_id = c.id
                 WHERE 1=1`;
    const params = [];

    if (filters.category_id) {
      query += ' AND i.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.search) {
      query += ' AND (i.name LIKE ? OR i.sku LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY i.name';

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
      `UPDATE items SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async updateStock(id, location, quantity) {
    const validLocations = ['stock_main_store', 'stock_bar', 'stock_counter'];
    if (!validLocations.includes(location)) {
      throw new Error(`Invalid location: ${location}`);
    }

    await db.promisify.run(
      `UPDATE items SET ${location} = ${location} + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [quantity, id]
    );

    return this.findById(id);
  }

  static async getLowStock(threshold = 10) {
    return await db.promisify.all(
      `SELECT * FROM items 
       WHERE (stock_bar < ? OR stock_counter < ?)
       ORDER BY (stock_bar + stock_counter) ASC`,
      [threshold, threshold]
    );
  }

  static async getOutOfStock() {
    return await db.promisify.all(
      `SELECT * FROM items 
       WHERE stock_bar = 0 AND stock_counter = 0
       ORDER BY name`
    );
  }
}

module.exports = Item;

