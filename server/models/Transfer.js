const { db } = require('../database/db');
const Item = require('./Item');
const Location = require('./Location');

class Transfer {
  static async create({ from_location_id, to_location_id, item_id, quantity, created_by }) {
    // Validate locations exist
    const fromLocation = await Location.findById(from_location_id);
    const toLocation = await Location.findById(to_location_id);

    if (!fromLocation) {
      throw new Error('Source location not found');
    }
    if (!toLocation) {
      throw new Error('Destination location not found');
    }

    // Check if source location is valid type
    if (!['source', 'both'].includes(fromLocation.type)) {
      throw new Error('Source location is not a valid source type');
    }
    if (!['destination', 'both'].includes(toLocation.type)) {
      throw new Error('Destination location is not a valid destination type');
    }

    // Check if item has enough stock
    const item = await Item.findById(item_id);
    if (!item) {
      throw new Error('Item not found');
    }

    // Map source location to stock field
    const sourceName = fromLocation.name.toLowerCase();
    let stockField = 'stock_main_store'; // default
    if (sourceName.includes('main') || sourceName.includes('store')) {
      stockField = 'stock_main_store';
    } else if (sourceName.includes('bar')) {
      stockField = 'stock_bar';
    } else if (sourceName.includes('counter')) {
      stockField = 'stock_counter';
    }
    
    const availableStock = item[stockField] || 0;
    if (availableStock < quantity) {
      throw new Error(`Insufficient stock in ${fromLocation.name}. Available: ${availableStock}`);
    }

    // Create transfer
    const result = await db.promisify.run(
      `INSERT INTO transfers (from_location_id, to_location_id, item_id, quantity, created_by, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [from_location_id, to_location_id, item_id, quantity, created_by]
    );

    return this.findById(result.lastID);
  }

  static async findById(id) {
    const transfer = await db.promisify.get(
      `SELECT t.*, 
              i.name as item_name,
              u.full_name as created_by_name,
              fl.name as from_location_name,
              tl.name as to_location_name
       FROM transfers t
       JOIN items i ON t.item_id = i.id
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN locations fl ON t.from_location_id = fl.id
       LEFT JOIN locations tl ON t.to_location_id = tl.id
       WHERE t.id = ?`,
      [id]
    );
    return transfer;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT t.*, 
             i.name as item_name,
             u.full_name as created_by_name,
             fl.name as from_location_name,
             tl.name as to_location_name
      FROM transfers t
      JOIN items i ON t.item_id = i.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN locations fl ON t.from_location_id = fl.id
      LEFT JOIN locations tl ON t.to_location_id = tl.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.to_location_id) {
      query += ' AND t.to_location_id = ?';
      params.push(filters.to_location_id);
    }

    query += ' ORDER BY t.created_at DESC';

    return await db.promisify.all(query, params);
  }

  static async complete(id) {
    const transfer = await this.findById(id);
    
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new Error('Transfer is not pending');
    }

    // Get locations
    const fromLocation = await Location.findById(transfer.from_location_id);
    const toLocation = await Location.findById(transfer.to_location_id);

    // Map location names to stock fields
    // Source: Main Store -> stock_main_store
    const fromName = fromLocation.name.toLowerCase().replace(/\s+/g, '_');
    let fromStockField = 'stock_main_store'; // default
    if (fromName.includes('main') || fromName.includes('store')) {
      fromStockField = 'stock_main_store';
    }
    
    // Destination: Bar -> stock_bar, Counter -> stock_counter
    const toName = toLocation.name.toLowerCase();
    let toStockField = 'stock_bar'; // default
    if (toName.includes('bar')) {
      toStockField = 'stock_bar';
    } else if (toName.includes('counter')) {
      toStockField = 'stock_counter';
    }

    // Update stock: remove from source, add to destination
    await Item.updateStock(transfer.item_id, fromStockField, -transfer.quantity);
    await Item.updateStock(transfer.item_id, toStockField, transfer.quantity);

    // Update transfer status
    await db.promisify.run(
      `UPDATE transfers 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }

  static async cancel(id) {
    await db.promisify.run(
      `UPDATE transfers SET status = 'cancelled' WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }
}

module.exports = Transfer;

