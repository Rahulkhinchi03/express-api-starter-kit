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

// Environment-based validation rules
const getPasswordValidation = () => {
  if (process.env.NODE_ENV === 'production') {
    // Strong password validation for production
    return body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
  } else {
    // Simplified validation for development
    return body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number');
  }
};

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
    .isLength({ max: 254 })
    .withMessage('Email must be less than 254 characters'),
  getPasswordValidation(),
  body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ max: 128 })
    .withMessage('Password too long')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  getPasswordValidation().withMessage('New password does not meet security requirements')
];

const updateProfileValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email must be less than 254 characters'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
];

// Routes with consistent response format
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'Authentication API',
      message: 'Auth routes are working!',
      endpoints: [
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'GET /api/v1/auth/profile'
      ],
      security: {
        environment: process.env.NODE_ENV,
        passwordRequirements: process.env.NODE_ENV === 'production' ?
          'Minimum 8 characters with uppercase, lowercase, number, and special character' :
          'Minimum 6 characters with at least one letter and one number'
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Test route to check if controller is working
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Auth routes file is loaded correctly!',
      security: {
        environment: process.env.NODE_ENV,
        validation: 'active'
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: '/api/v1/auth/test'
    }
  });
});

// Authentication endpoints with security logging
router.post('/register', (req, res, next) => {
  console.log('🔧 Register attempt:', {
    email: req.body.email,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
}, authRateLimiter, registerValidation, register);

router.post('/login', (req, res, next) => {
  console.log('🔧 Login attempt:', {
    email: req.body.email,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
}, authRateLimiter, loginValidation, login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, updateProfile);
router.post('/change-password', authMiddleware, changePasswordValidation, changePassword);
router.post('/regenerate-api-key', authMiddleware, regenerateApiKey);

// Statistics routes (authentication required)
router.get('/stats', authMiddleware, getUserStats);
router.get('/stats/:userId', authMiddleware, getUserStats);
router.get('/admin/stats', authMiddleware, getAllUsersStats);

module.exports = router;