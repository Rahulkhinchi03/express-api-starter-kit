# 🚀 Treblle Express Ollama Classifier API

A production-ready Express.js API starter kit featuring AI-powered image classification with Ollama Moondream, complete authentication, security, and monitoring with Treblle.

## ✨ Features

- 🔍 **AI Image Classification** - Powered by Ollama Moondream for local image analysis
- 🔐 **JWT Authentication** - Secure user registration and login
- 🛡️ **Enterprise Security** - Helmet, CORS, rate limiting, and DDoS protection
- 📊 **Real-time Monitoring** - Treblle integration for API observability
- 🚦 **Rate Limiting** - Intelligent request limiting based on endpoint sensitivity
- 📸 **Flexible Image Input** - Support for file uploads and base64 strings
- 🐳 **Docker Ready** - Containerized for consistent deployments
- 📚 **Auto Documentation** - Self-documenting API endpoints

## 🏗️ Architecture

Following Treblle's **7 Key Lessons for Building Great REST APIs**:

1. **Design** - RESTful routes, proper HTTP methods, semantic naming
2. **Security** - HTTPS, authentication, input validation, secure headers
3. **Performance** - Compression, caching, optimized database queries
4. **Documentation** - Self-documenting endpoints with examples
5. **Adoption** - Easy setup, clear examples, developer-friendly
6. **Governance** - Consistent patterns, versioning, validation
7. **Monetization** - Rate limiting, usage tracking, scalable architecture

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Ollama installed and running
- Treblle account (get one at [treblle.com](https://treblle.com))

### 1. Clone and Install

```bash
git clone <repository-url>
cd treblle-express-ollama-classifier
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```bash
# Treblle Configuration
TREBLLE_API_KEY=your_treblle_api_key_here
TREBLLE_PROJECT_ID=your_treblle_project_id_here

# Server Configuration  
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=moondream
```

### 3. Start Ollama

```bash
# Pull the Moondream model
ollama pull moondream

# Verify it's running
ollama list
```

### 4. Start the API

```bash
# Development mode
npm run dev

# Production mode
npm start
```

🎉 **Your API is now running at http://localhost:3000**

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

#### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "SecurePass123!"
}
```

#### Login User
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response includes JWT token:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### Image Classification

#### Classify Image (File Upload)
```bash
POST /api/v1/classify/image
Authorization: Bearer <your-token>
Content-Type: multipart/form-data

# Form data with "image" field containing image file
```

#### Classify Image (Base64)
```bash
POST /api/v1/classify/image
Authorization: Bearer <your-token>  
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "prompt": "What type of glass is this? Be specific."
}
```

#### Response
```json
{
  "success": true,
  "result": {
    "classification": "A clear glass wine glass with a long stem",
    "confidence": "High",
    "detectedObjects": "wine glass, stemware",
    "model": "moondream",
    "prompt": "What object is in this image?"
  },
  "metadata": {
    "processingTime": "1250ms",
    "userId": "1234567890",
    "timestamp": "2024-03-15T10:30:00.000Z",
    "imageSize": "45678 bytes"
  }
}
```

## 🧪 Testing with Treblle Aspen

Treblle Aspen provides an excellent way to test your API:

1. Visit [aspen.treblle.com](https://aspen.treblle.com)
2. Import the API using the base URL: `http://localhost:3000/api/v1`
3. Test all endpoints with the interactive interface
4. View real-time monitoring data in your Treblle dashboard

### Sample cURL Commands

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'

# Login and get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Classify an image
curl -X POST http://localhost:3000/api/v1/classify/image \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@path/to/your/image.jpg"
```

## 🌐 Deployment

### Using ngrok (for demos)

```bash
# Install ngrok
npm install -g ngrok

# Start your API
npm start

# In another terminal, expose it
ngrok http 3000
```

Your API will be available at the ngrok URL (e.g., `https://abc123.ngrok.io`)

### Using Docker

```bash
# Build the image
docker build -t treblle-express-api .

# Run the container
docker run -p 3000:3000 --env-file .env treblle-express-api
```

## 🛠️ Development

### Project Structure

```
treblle-express-api-starter-kit/
├── app.js                 # Main application setup
├── server.js              # Server entry point
├── routes/
│   └── classifyRoutes.js  # Classification endpoints
├── controllers/
│   └── classifyController.js # Classification logic
├── services/
│   └── ollamaService.js   # Ollama integration
├── auth/
│   ├── authController.js  # Authentication logic
│   └── authRoutes.js      # Auth endpoints
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   ├── rateLimit.js       # Rate limiting
│   ├── ddos.js           # DDoS protection
│   └── errorHandler.js    # Global error handling
├── config/
│   └── .env.example       # Environment template
├── Dockerfile             # Container configuration
└── README.md             # This file
```

### Adding New Features

1. **New Routes**: Add to appropriate route files
2. **Middleware**: Create in `middleware/` directory
3. **Services**: Add external integrations to `services/`
4. **Validation**: Use express-validator for input validation
5. **Error Handling**: Use the global error handler

### Best Practices Implemented

- **Input Validation** - All inputs validated and sanitized
- **Error Handling** - Comprehensive error responses
- **Security** - Multiple layers of protection
- **Performance** - Optimized for speed and efficiency
- **Monitoring** - Complete observability with Treblle
- **Documentation** - Self-documenting endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

**Built with ❤️ by the Treblle DevRel Team**

Ready to build amazing APIs? Get started with [Treblle](https://treblle.com) today!