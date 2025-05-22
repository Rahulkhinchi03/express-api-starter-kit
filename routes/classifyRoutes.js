const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { classifyRateLimiter } = require('../middleware/rateLimit');
const { classifyImage, getStatus, getSamples } = require('../controllers/classifyController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

// Validation for base64 image uploads
const base64ImageValidation = [
  body('image')
    .optional()
    .isString()
    .isLength({ min: 100 }) // Base64 images should be reasonably long
    .withMessage('Image data must be a valid base64 string'),
  body('prompt')
    .optional()
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage('Prompt must be between 5 and 500 characters')
];

// Routes
router.get('/', (req, res) => {
  res.status(200).json({
    service: 'Image Classification API',
    description: 'AI-powered image classification using Ollama Moondream',
    endpoints: {
      classify: {
        method: 'POST',
        path: '/api/v1/classify/image',
        description: 'Classify an image and detect objects',
        authentication: 'Bearer token required',
        rateLimit: '10 requests per 5 minutes'
      },
      status: {
        method: 'GET', 
        path: '/api/v1/classify/status',
        description: 'Check service health and model availability'
      },
      samples: {
        method: 'GET',
        path: '/api/v1/classify/samples', 
        description: 'Get example requests and usage tips'
      }
    },
    features: [
      'Multiple input methods (file upload, base64)',
      'Custom classification prompts',
      'Support for JPEG, PNG, GIF, WebP formats',
      'Real-time processing with Ollama Moondream',
      'Detailed response metadata',
      'Rate limiting and authentication'
    ]
  });
});

// Classify image endpoint - supports both file upload and base64
router.post('/image', 
  authMiddleware,
  classifyRateLimiter,
  upload.single('image'),
  base64ImageValidation,
  classifyImage
);

// Service status endpoint
router.get('/status', getStatus);

// Sample requests endpoint
router.get('/samples', getSamples);

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'Image size must be less than 10MB',
        maxSize: '10MB'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Please upload the image using the "image" field name'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message,
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP']
    });
  }
  
  next(error);
});

module.exports = router;