const { validationResult } = require('express-validator');
const ollamaService = require('../services/ollamaService');

// Classify image endpoint
const classifyImage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const startTime = Date.now();
    let imageBase64;
    let prompt = req.body.prompt || "What object is in this image? Provide a brief, descriptive answer.";

    // Handle different input methods
    if (req.file) {
      // File upload via multer
      imageBase64 = req.file.buffer.toString('base64');
    } else if (req.body.image) {
      // Base64 string from request body
      if (req.body.image.startsWith('data:image/')) {
        // Remove data URL prefix if present
        imageBase64 = req.body.image.split(',')[1];
      } else {
        imageBase64 = req.body.image;
      }
    } else {
      return res.status(400).json({
        error: 'No image provided',
        message: 'Please provide an image either as a file upload or base64 string'
      });
    }

    // Validate base64 string
    if (!imageBase64 || imageBase64.length === 0) {
      return res.status(400).json({
        error: 'Invalid image data',
        message: 'The provided image data is empty or invalid'
      });
    }

    // Basic base64 validation
    try {
      Buffer.from(imageBase64, 'base64');
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid base64 format',
        message: 'The provided image data is not valid base64'
      });
    }

    console.log(`Processing image classification for user: ${req.user.email}`);
    
    // Call Ollama service
    const result = await ollamaService.classifyImage(imageBase64, prompt);
    
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      result: {
        classification: result.classification,
        confidence: 'High', // Moondream doesn't provide confidence scores
        detectedObjects: result.classification,
        model: result.model,
        prompt: result.prompt
      },
      metadata: {
        processingTime: `${processingTime}ms`,
        ollamaProcessingTime: result.processingTime ? `${result.processingTime}ms` : null,
        userId: req.user.userId,
        timestamp: new Date().toISOString(),
        imageSize: `${Math.round(imageBase64.length * 0.75)} bytes` // Approximate original size
      }
    });

  } catch (error) {
    console.error('Classification error:', error.message);
    
    // Handle specific Ollama service errors
    if (error.message.includes('Ollama service')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: error.message,
        suggestion: 'Please ensure Ollama is running and the model is available'
      });
    }

    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'Image processing took too long. Try with a smaller image.',
        suggestion: 'Reduce image size or complexity'
      });
    }

    next(error);
  }
};

// Get classification service status
const getStatus = async (req, res, next) => {
  try {
    const status = await ollamaService.getStatus();
    
    res.status(200).json({
      service: 'Image Classification API',
      status: status.service.available && status.model.available ? 'healthy' : 'degraded',
      ollama: status,
      capabilities: {
        supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
        inputMethods: ['file upload', 'base64 string'],
        maxImageSize: '10MB',
        customPrompts: true
      },
      usage: {
        endpoint: '/api/v1/classify/image',
        method: 'POST',
        authentication: 'Bearer token required',
        rateLimit: '10 requests per 5 minutes'
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get sample classification requests
const getSamples = async (req, res) => {
  res.status(200).json({
    examples: {
      fileUpload: {
        method: 'POST',
        url: '/api/v1/classify/image',
        headers: {
          'Authorization': 'Bearer <your-token>',
          'Content-Type': 'multipart/form-data'
        },
        body: 'FormData with "image" field containing the image file'
      },
      base64Upload: {
        method: 'POST',
        url: '/api/v1/classify/image',
        headers: {
          'Authorization': 'Bearer <your-token>',
          'Content-Type': 'application/json'
        },
        body: {
          image: 'data:image/jpeg;base64,<base64-string>',
          prompt: 'What type of glass is this? Be specific about the style and purpose.'
        }
      }
    },
    samplePrompts: [
      "What object is in this image?",
      "Describe the main subject of this image in detail.",
      "What type of glass or container is shown?",
      "Identify the objects and their colors in this image.",
      "What is the style and purpose of this item?"
    ],
    tips: [
      "Use clear, well-lit images for best results",
      "Supported formats: JPEG, PNG, GIF, WebP",
      "Maximum file size: 10MB",
      "Custom prompts can improve classification accuracy",
      "Processing time varies based on image complexity"
    ]
  });
};

module.exports = {
  classifyImage,
  getStatus,
  getSamples
};