const { db } = require('../database/db');

class Category {
  static async create({ name, description }) {
    if (!name || name.trim() === '') {
      throw new Error('Category name is required');
    }
    
    const result = await db.promisify.run(
      `INSERT INTO categories (name, description)
       VALUES (?, ?)`,
      [name.trim(), description?.trim() || null]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return await db.promisify.get(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
  }

  static async findByName(name) {
    return await db.promisify.get(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );
  }

  static async findAll() {
    return await db.promisify.all(
      'SELECT * FROM categories ORDER BY name'
    );
  }

  static async update(id, { name, description }) {
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.promisify.run(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async delete(id) {
    // Check if category is used by any items
    const itemsCount = await db.promisify.get(
      'SELECT COUNT(*) as count FROM items WHERE category_id = ?',
      [id]
    );

    if (itemsCount.count > 0) {
      throw new Error('Cannot delete category that is assigned to items');
    }

    await db.promisify.run('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Category;

