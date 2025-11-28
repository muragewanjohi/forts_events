const { db } = require('../database/db');

class Location {
  static async create({ name, type, description }) {
    if (!name || name.trim() === '') {
      throw new Error('Location name is required');
    }

    if (!['source', 'destination', 'both'].includes(type)) {
      throw new Error('Invalid location type');
    }

    const result = await db.promisify.run(
      `INSERT INTO locations (name, type, description)
       VALUES (?, ?, ?)`,
      [name.trim(), type, description?.trim() || null]
    );
    return this.findById(result.lastID);
  }

  static async findById(id) {
    return await db.promisify.get(
      'SELECT * FROM locations WHERE id = ?',
      [id]
    );
  }

  static async findByName(name) {
    return await db.promisify.get(
      'SELECT * FROM locations WHERE name = ?',
      [name]
    );
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM locations WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY name';

    return await db.promisify.all(query, params);
  }

  static async getSources() {
    return await db.promisify.all(
      `SELECT * FROM locations 
       WHERE type IN ('source', 'both')
       ORDER BY name`
    );
  }

  static async getDestinations() {
    return await db.promisify.all(
      `SELECT * FROM locations 
       WHERE type IN ('destination', 'both')
       ORDER BY name`
    );
  }

  static async update(id, { name, type, description }) {
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (type !== undefined) {
      if (!['source', 'destination', 'both'].includes(type)) {
        throw new Error('Invalid location type');
      }
      updates.push('type = ?');
      params.push(type);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description?.trim() || null);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.promisify.run(
      `UPDATE locations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async delete(id) {
    // Check if location is used by any transfers
    const transfersCount = await db.promisify.get(
      `SELECT COUNT(*) as count FROM transfers 
       WHERE from_location_id = ? OR to_location_id = ?`,
      [id, id]
    );

    if (transfersCount.count > 0) {
      throw new Error('Cannot delete location that is used in transfers');
    }

    await db.promisify.run('DELETE FROM locations WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Location;

