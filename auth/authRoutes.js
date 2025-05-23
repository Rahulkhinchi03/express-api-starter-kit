const express = require('express');
const { body } = require('express-validator');
const { authRateLimiter } = require('../middleware/rateLimit');
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, getProfile } = require('./authController');

const router = express.Router();

// Validation rules - UPDATED with more user-friendly password requirements
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    // Remove the complex regex validation - much simpler now!
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
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

// Auth info endpoint - UPDATED to reflect new password requirements
router.get('/', (req, res) => {
  res.status(200).json({
    endpoints: {
      register: {
        method: 'POST',
        path: '/api/v1/auth/register',
        description: 'Register a new user',
        body: {
          email: 'string (valid email)',
          password: 'string (min 6 chars, must include at least one letter and one number)',
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
    },
    passwordRequirements: {
      minLength: 6,
      mustContain: ['at least one letter', 'at least one number'],
      examples: ['password123', 'mypass1', 'test123', 'hello1']
    }
  });
});

module.exports = router;