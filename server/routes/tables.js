const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { authenticate, requireRole } = require('../middleware/auth');

// Get all tables
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const tables = await Table.findAll(filters);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tables', message: error.message });
  }
});

// Get available tables
router.get('/available', authenticate, async (req, res) => {
  try {
    const tables = await Table.getAvailable();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching available tables', message: error.message });
  }
});

// Get occupied tables
router.get('/occupied', authenticate, async (req, res) => {
  try {
    const tables = await Table.getOccupied();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching occupied tables', message: error.message });
  }
});

// Get table by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching table', message: error.message });
  }
});

// Create new table (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { table_number, capacity, location, notes } = req.body;

    if (!table_number) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    // Check if table number already exists
    const existing = await Table.findByNumber(table_number);
    if (existing) {
      return res.status(400).json({ error: 'Table number already exists' });
    }

    const table = await Table.create({
      table_number,
      capacity,
      location,
      notes
    });

    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Error creating table', message: error.message });
  }
});

// Update table (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { table_number, capacity, location, notes, status } = req.body;

    const updateData = {};
    if (table_number !== undefined) updateData.table_number = table_number;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const table = await Table.update(id, updateData);
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Error updating table', message: error.message });
  }
});

// Update table status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['available', 'occupied', 'reserved', 'out_of_service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const table = await Table.updateStatus(id, status);
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Error updating table status', message: error.message });
  }
});

// Delete table (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await Table.delete(req.params.id);
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting table', message: error.message });
  }
});

module.exports = router;

