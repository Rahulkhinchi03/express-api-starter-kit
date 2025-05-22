const express = require('express');
const { body } = require('express-validator');
const { authRateLimiter } = require('../middleware/rateLimit');
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, getProfile } = require('./authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes with rate limiting for auth endpoints
router.post('/register', authRateLimiter, registerValidation, register);
router.post('/login', authRateLimiter, loginValidation, login);
router.get('/profile', authMiddleware, getProfile);

// Auth info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    endpoints: {
      register: {
        method: 'POST',
        path: '/api/v1/auth/register',
        description: 'Register a new user',
        body: {
          email: 'string (valid email)',
          password: 'string (min 8 chars, must include uppercase, lowercase, number, special char)',
          name: 'string (2-50 characters)'
        }
      },
      login: {
        method: 'POST',
        path: '/api/v1/auth/login',
        description: 'Login with existing credentials',
        body: {
          email: 'string (valid email)',
          password: 'string'
        }
      },
      profile: {
        method: 'GET',
        path: '/api/v1/auth/profile',
        description: 'Get current user profile',
        headers: {
          Authorization: 'Bearer <token>'
        }
      }
    },
    rateLimit: {
      window: '15 minutes',
      maxRequests: 5,
      message: 'Authentication endpoints are rate limited for security'
    }
  });
});

module.exports = router;