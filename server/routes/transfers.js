const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const { authenticate, requireRole } = require('../middleware/auth');

// Get all transfers
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, to_location_id } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (to_location_id) filters.to_location_id = to_location_id;

    const transfers = await Transfer.findAll(filters);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Error fetching transfers', message: error.message });
  }
});

// Get transfer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transfer', message: error.message });
  }
});

// Create new transfer (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { from_location_id, to_location_id, item_id, quantity } = req.body;

    if (!from_location_id || !to_location_id || !item_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transfer = await Transfer.create({
      from_location_id,
      to_location_id,
      item_id,
      quantity: parseInt(quantity),
      created_by: req.user.id
    });

    res.status(201).json(transfer);
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Error creating transfer', message: error.message });
  }
});

// Complete transfer (Admin only)
router.post('/:id/complete', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const transfer = await Transfer.complete(req.params.id);
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: 'Error completing transfer', message: error.message });
  }
});

// Cancel transfer (Admin only)
router.post('/:id/cancel', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const transfer = await Transfer.cancel(req.params.id);
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: 'Error cancelling transfer', message: error.message });
  }
});

module.exports = router;

