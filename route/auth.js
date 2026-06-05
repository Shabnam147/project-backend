const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Helper: send validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

// @route  POST /api/auth/register
// @desc   Register new user
// @access Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
  ],
  async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({ name, email, password });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token: generateToken(user._id),
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  }
);

// @route  POST /api/auth/login
// @desc   Login and return JWT
// @access Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      res.json({
        success: true,
        message: 'Login successful.',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token: generateToken(user._id),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  }
);

// @route  GET /api/auth/me
// @desc   Get current user profile
// @access Private
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
