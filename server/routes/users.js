const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// Get all users (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, active_only } = req.query;
    const filters = {};
    
    if (role) filters.role = role;
    if (active_only !== undefined) filters.active_only = active_only === 'true';

    const users = await User.findAll(filters);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users', message: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user', message: error.message });
  }
});

// Create new user (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, full_name, password, role } = req.body;

    if (!username || !full_name || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validRoles = ['waiter', 'cashier', 'bartender', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if username exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await User.create({ username, full_name, password, role });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error creating user', message: error.message });
  }
});

// Update user (Admin only, or user updating themselves)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, password, role, is_active } = req.body;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admin can change role or deactivate, or user can update their own profile
    if ((role !== undefined || is_active !== undefined) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can change role or status' });
    }

    // Users can only update their own profile (except admin)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (password !== undefined) updateData.password = password;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const user = await User.update(id, updateData);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user', message: error.message });
  }
});

// Deactivate user (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deactivating yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot deactivate yourself' });
    }

    const user = await User.deactivate(id);
    res.json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ error: 'Error deactivating user', message: error.message });
  }
});

// Get user statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const stats = await User.getStats(id, startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user stats', message: error.message });
  }
});

module.exports = router;

