const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticate, requireRole } = require('../middleware/auth');
const { db } = require('../database/db');

// Get all categories
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories', message: error.message });
  }
});

// Get category by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Error fetching category', message: error.message });
  }
});

// Create new category (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if table exists
    const tableCheck = await db.promisify.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    );
    
    if (tableCheck.length === 0) {
      return res.status(500).json({ 
        error: 'Categories table does not exist. Please run migration: npm run migrate-categories' 
      });
    }

    const category = await Category.create({ name: name.trim(), description: description?.trim() || null });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ 
      error: 'Error creating category', 
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update category (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ error: 'Category name cannot be empty' });
    }

    const category = await Category.update(id, { 
      name: name?.trim(), 
      description: description?.trim() || null 
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ 
      error: 'Error updating category', 
      message: error.message || 'Unknown error occurred' 
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await Category.delete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'Error deleting category', 
      message: error.message || 'Unknown error occurred' 
    });
  }
});

module.exports = router;
