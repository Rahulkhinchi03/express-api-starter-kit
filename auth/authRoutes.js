const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimit');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  regenerateApiKey,
  getUserStats,
  getAllUsersStats
} = require('./authController');

const router = express.Router();

// Very simple validation for debugging
const registerValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('name').isLength({ min: 1 }).withMessage('Name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

// Routes
router.get('/', (req, res) => {
  res.status(200).json({
    service: 'Authentication API',
    message: 'Auth routes are working!',
    endpoints: [
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'GET /api/v1/auth/profile'
    ]
  });
});

// Test route to check if controller is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes file is loaded correctly!' });
});

// Register route with detailed error logging
router.post('/register', (req, res, next) => {
  console.log('🔧 Register route hit with body:', req.body);
  next();
}, registerValidation, register);

// Login route with detailed error logging  
router.post('/login', (req, res, next) => {
  console.log('🔧 Login route hit with body:', req.body);
  next();
}, loginValidation, login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);
router.post('/regenerate-api-key', authMiddleware, regenerateApiKey);

module.exports = router;