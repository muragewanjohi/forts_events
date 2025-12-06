const { db } = require('../database/db');

class Item {
  // Generate SKU from item name
  static generateSKU(name) {
    if (!name || name.trim() === '') {
      return null;
    }
    
    // Convert to uppercase, remove special characters, keep only alphanumeric and spaces
    let sku = name.toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '') // Remove spaces
      .trim();
    
    // Limit to 20 characters for readability
    if (sku.length > 20) {
      sku = sku.substring(0, 20);
    }
    
    return sku || null;
  }

  // Generate unique SKU by checking if it exists and appending number if needed
  static async generateUniqueSKU(baseSKU) {
    if (!baseSKU) {
      return null;
    }

    let sku = baseSKU;
    let counter = 1;
    let exists = true;

    while (exists) {
      const existing = await db.promisify.get(
        'SELECT id FROM items WHERE sku = ?',
        [sku]
      );

      if (!existing) {
        exists = false;
      } else {
        // Append number to make it unique
        const base = baseSKU.length > 15 ? baseSKU.substring(0, 15) : baseSKU;
        sku = `${base}${counter}`;
        counter++;
        
        // Prevent infinite loop (max 9999)
        if (counter > 9999) {
          // Use timestamp as fallback
          sku = `${baseSKU}${Date.now().toString().slice(-4)}`;
          break;
        }
      }
    }

    return sku;
  }

  static async create({ name, sku, cost_per_item, category_id, stock_main_store = 0 }) {
    let skuValue;
    
    if (sku && sku.trim() !== '') {
      // User provided SKU, use it (trimmed)
      skuValue = sku.trim();
    } else {
      // Auto-generate SKU from name
      const generatedSKU = this.generateSKU(name);
      if (generatedSKU) {
        skuValue = await this.generateUniqueSKU(generatedSKU);
      } else {
        skuValue = null;
      }
    }
    
    const result = await db.promisify.run(
      `INSERT INTO items (name, sku, cost_per_item, category_id, stock_main_store)
       VALUES (?, ?, ?, ?, ?)`,
      [name, skuValue, cost_per_item, category_id || null, stock_main_store]
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
        // Convert empty SKU to NULL
        if (key === 'sku') {
          const skuValue = (data[key] && data[key].trim() !== '') ? data[key].trim() : null;
          updates.push(`${key} = ?`);
          params.push(skuValue);
        } else {
          updates.push(`${key} = ?`);
          params.push(data[key]);
        }
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

