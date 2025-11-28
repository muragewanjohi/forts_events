const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Get active users for login dropdown (public endpoint)
// IMPORTANT: This route must be defined BEFORE /login to avoid route conflicts
router.get('/users', async (req, res) => {
  try {
    console.log('Fetching users for login dropdown...');
    const users = await User.findAll({ active_only: true });
    console.log(`Found ${users.length} active users`);
    
    // Only return username and full_name for security
    const userList = users
      .map(user => ({
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }))
      .sort((a, b) => {
        // Sort by role first (waiters first, then others), then by name
        const roleOrder = { waiter: 1, cashier: 2, bartender: 3, admin: 4 };
        const roleDiff = (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
        if (roleDiff !== 0) return roleDiff;
        return a.full_name.localeCompare(b.full_name);
      });
    
    console.log('Returning user list:', userList);
    res.json(userList);
  } catch (error) {
    console.error('Error in /auth/users:', error);
    res.status(500).json({ error: 'Error fetching users', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await User.verifyPassword(user, password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login error', message: error.message });
  }
});

// Verify token (for checking if user is still authenticated)
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const { verifyToken } = require('../middleware/auth');
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification error', message: error.message });
  }
});

module.exports = router;

