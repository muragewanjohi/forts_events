const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { authenticate, requireRole } = require('../middleware/auth');

// Get all locations
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const filters = {};
    if (type) filters.type = type;

    const locations = await Location.findAll(filters);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Error fetching locations', message: error.message });
  }
});

// Get source locations
router.get('/sources', authenticate, async (req, res) => {
  try {
    const locations = await Location.getSources();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching source locations:', error);
    res.status(500).json({ error: 'Error fetching source locations', message: error.message });
  }
});

// Get destination locations
router.get('/destinations', authenticate, async (req, res) => {
  try {
    const locations = await Location.getDestinations();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching destination locations:', error);
    res.status(500).json({ error: 'Error fetching destination locations', message: error.message });
  }
});

// Get location by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Error fetching location', message: error.message });
  }
});

// Create new location (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, type, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Location name is required' });
    }

    if (!type || !['source', 'destination', 'both'].includes(type)) {
      return res.status(400).json({ error: 'Location type must be: source, destination, or both' });
    }

    const location = await Location.create({ name, type, description });
    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Location name already exists' });
    }
    res.status(500).json({ 
      error: 'Error creating location', 
      message: error.message || 'Unknown error occurred' 
    });
  }
});

// Update location (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;

    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ error: 'Location name cannot be empty' });
    }

    if (type !== undefined && !['source', 'destination', 'both'].includes(type)) {
      return res.status(400).json({ error: 'Invalid location type' });
    }

    const location = await Location.update(id, { name, type, description });
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Location name already exists' });
    }
    res.status(500).json({ 
      error: 'Error updating location', 
      message: error.message || 'Unknown error occurred' 
    });
  }
});

// Delete location (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await Location.delete(req.params.id);
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ 
      error: 'Error deleting location', 
      message: error.message || 'Unknown error occurred' 
    });
  }
});

module.exports = router;

