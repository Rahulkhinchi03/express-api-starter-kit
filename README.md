# 🚀 Treblle Express API Starter Kit

A **production-ready Express.js API** featuring PostgreSQL database integration, JWT authentication, comprehensive monitoring with [Treblle](https://treblle.com), and AI-powered image classification using [Ollama](https://ollama.com).

## ✨ Features

- 🗃️ **PostgreSQL Database** - Production-ready with connection pooling, migrations, and optimized queries
- 🔐 **JWT Authentication** - Secure user registration, login, and API key management
- 🛡️ **Enterprise Security** - Helmet, CORS, rate limiting, input validation, and DDoS protection
- 📊 **Real-time Monitoring** - Complete API observability with [Treblle integration](https://docs.treblle.com/integrations/javascript/express/)
- 🤖 **AI Image Classification** - Powered by [Ollama Moondream](https://ollama.com/library/moondream) for local image analysis
- 🚦 **Intelligent Rate Limiting** - Endpoint-specific limits based on resource requirements
- 📸 **Flexible Image Input** - Support for file uploads and base64 strings
- 🐳 **Docker Ready** - Containerized with health checks for consistent deployments
- 📚 **Auto Documentation** - Self-documenting API endpoints via [Treblle API Documentation](https://treblle.com/product/api-documentation)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 12+**
- **Ollama** installed and running
- **Treblle account** (get one at [treblle.com](https://treblle.com))

### 1. Clone and Install

```bash
git clone https://github.com/Treblle/express-api-starter-kit.git
cd express-api-starter-kit
npm install
```

### 2. Database Setup

```bash
# Install Homebrew (if not already installed)
[ -x "$(command -v brew)" ] || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql

# Start PostgreSQL as a background service
brew services start postgresql

# Add PostgreSQL to PATH (Apple Silicon)
echo 'export PATH="/opt/homebrew/opt/postgresql/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile

# Create database and user
psql postgres <<EOF
CREATE DATABASE treblle_api;
CREATE USER treblle_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE treblle_api TO treblle_user;
EOF
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=treblle_api
DB_USER=treblle_user
DB_PASSWORD=secure_password
DB_POOL_MAX=20

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

### 4. Start Ollama

```bash
# Pull the Moondream model
ollama pull moondream

# Verify it's running
ollama list
```

### 5. Start the API

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

🎉 **Your API is now running at <http://localhost:3000>**

---

## 🏗️ API Design & Architecture

This API follows **Treblle's 7 Key Lessons for Building Great REST APIs**, ensuring enterprise-grade quality and developer experience.

### Core Architecture Principles

#### 1. **Design** - RESTful Excellence

- **Resource-based URLs**: `/api/v1/users`, `/api/v1/classify/image`
- **HTTP Methods**: Proper GET, POST, PUT, DELETE usage
- **Status Codes**: Meaningful 2xx, 4xx, 5xx responses
- **API Versioning**: Future-proof with `/v1/` namespace

#### 2. **Security** - Multi-layered Protection

- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access control
- **Input Validation**: Express-validator with custom rules
- **Rate Limiting**: Endpoint-specific limits (5/15min for auth, 10/5min for AI)
- **Headers**: Helmet.js security headers
- **CORS**: Configurable cross-origin policies
- **DDoS Protection**: Express-slow-down middleware

#### 3. **Performance** - Optimized for Scale

- **Database**: Connection pooling with PostgreSQL
- **Compression**: Gzip compression for responses
- **Caching**: Strategic query optimization
- **Indexing**: Database indexes on frequently queried fields

#### 4. **Documentation** - Self-Documenting

- **Treblle Integration**: Automatic API documentation generation
- **OpenAPI Compatible**: Schema-first approach
- **Interactive Examples**: Live API testing capabilities

### Database Schema

```sql
-- Users table with authentication
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Classifications table for AI results
classifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  image_hash VARCHAR(64) NOT NULL,
  image_size INTEGER NOT NULL,
  image_type VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT,
  confidence VARCHAR(20),
  model_used VARCHAR(100) NOT NULL,
  processing_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking for analytics
api_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### Authentication Endpoints

```http
POST   /api/v1/auth/register     # User registration
POST   /api/v1/auth/login        # User login
GET    /api/v1/auth/profile      # Get user profile
PUT    /api/v1/auth/profile      # Update profile
POST   /api/v1/auth/change-password  # Change password
POST   /api/v1/auth/regenerate-api-key  # Regenerate API key
```

#### Classification Endpoints

```http
POST   /api/v1/classify/image     # Classify image (AI)
GET    /api/v1/classify/status    # Service health & stats
GET    /api/v1/classify/history   # User's classification history
GET    /api/v1/classify/search    # Search classifications
GET    /api/v1/classify/samples   # API usage examples
DELETE /api/v1/classify/:id       # Delete classification
```

#### Utility Endpoints

```http
GET    /api/v1/health            # API health check
GET    /api/v1/stats             # System statistics (admin)
```

---

## 📊 Treblle Integration & Monitoring

### Real-time API Observability

The API automatically tracks **all requests** through Treblle, providing:

- 📈 **Performance Metrics** - Response times, error rates, throughput
- 🔍 **Request/Response Logging** - Complete payload inspection
- 🚨 **Error Tracking** - Detailed error analysis and alerting
- 📱 **User Behavior** - API usage patterns and trends
- 🌍 **Geographic Analytics** - Request distribution mapping

### Treblle Dashboard Screenshots

![Treblle API Overview](https://docs.treblle.com/images/dashboard-overview.png)

*Real-time API performance monitoring with detailed metrics and insights*

![Treblle Request Details](https://docs.treblle.com/images/request-details.png)

*Comprehensive request/response analysis with payload inspection*

![Treblle Error Tracking](https://docs.treblle.com/images/error-tracking.png)

*Advanced error tracking with stack traces and context*

### Setup Treblle Monitoring

1. **Create Account**: Visit [treblle.com](https://treblle.com) and sign up
2. **Get API Keys**: Create a new project and copy your API key & Project ID
3. **Configure Environment**: Add keys to your `.env` file
4. **Deploy & Monitor**: Treblle automatically starts monitoring all API calls

```bash
# .env configuration
TREBLLE_API_KEY=your_treblle_api_key_here
TREBLLE_PROJECT_ID=your_treblle_project_id_here
```

The integration is **zero-configuration** - simply restart your API and visit your Treblle dashboard to see live data flowing in.

---

## 🤖 AI Image Classification Logic

### Ollama Moondream Integration

The AI classification feature uses **Ollama with the Moondream model** for local, private image analysis. This approach ensures:

- 🔒 **Privacy**: Images never leave your server
- ⚡ **Speed**: Local processing without API calls
- 💰 **Cost-effective**: No per-request charges
- 🛡️ **Reliability**: No external dependencies

### How It Works

#### 1. Image Processing Pipeline

```javascript
// 1. Image Input (File Upload or Base64)
const imageBuffer = req.file.buffer || Buffer.from(base64, 'base64');

// 2. Generate Hash for Deduplication
const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

// 3. Create Database Record
const classification = await Classification.create({
  userId, imageHash, imageSize, imageType, prompt,
  status: 'processing'
});

// 4. Send to Ollama
const result = await ollamaService.classifyImage(imageBase64, prompt);

// 5. Store Results
await classification.updateResults(result);
```

#### 2. Moondream Model Capabilities

- **Vision-Language Model**: Understands both images and text prompts
- **Object Detection**: Identifies objects, people, scenes, and contexts
- **Descriptive Analysis**: Provides detailed descriptions beyond simple labels
- **Custom Prompts**: Responds to specific questions about images
- **Multi-format Support**: JPEG, PNG, GIF, WebP

#### 3. Example Classifications

**Input**: Product photo of a wine glass
**Prompt**: "What type of glass is this? Be specific about style and purpose."
**Result**: "This is a burgundy wine glass with a large, rounded bowl designed for red wines. The wide bowl allows for proper aeration and the stem prevents hand warming of the wine."

**Input**: Street scene photo
**Prompt**: "Describe the scene and atmosphere"
**Result**: "A busy urban street during golden hour with pedestrians walking along the sidewalk. Modern buildings line both sides with warm lighting from storefronts creating an inviting evening atmosphere."

---

## 📚 Usage Examples

### Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!",
    "name": "Developer"
  }'

# Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "developer@example.com",
    "name": "Developer",
    "api_key": "a1b2c3d4e5f6...",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}

# 2. Login existing user
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!"
  }'
```

### Image Classification Examples

#### File Upload Method

```bash
# Classify an uploaded image file
curl -X POST http://localhost:3000/api/v1/classify/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@path/to/your/image.jpg" \
  -F "prompt=What type of wine glass is this?"

# Response:
{
  "success": true,
  "result": {
    "classification": "This is a burgundy wine glass with a large, rounded bowl designed for red wines. The wide bowl allows for proper aeration of the wine.",
    "confidence": "High",
    "model": "moondream",
    "prompt": "What type of wine glass is this?"
  },
  "metadata": {
    "processingTime": "1247ms",
    "userId": 1,
    "classificationId": 42,
    "timestamp": "2024-01-15T10:35:22Z",
    "imageSize": "156 KB",
    "imageHash": "a7f3c8e9d2b1f4a6"
  }
}
```

#### Base64 Method

```javascript
// JavaScript example with base64 image
const classifyImage = async (imageBase64, prompt) => {
  const response = await fetch('http://localhost:3000/api/v1/classify/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourJwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: imageBase64, // or data:image/jpeg;base64,<base64-string>
      prompt: prompt || "Describe this image in detail"
    })
  });
  
  return await response.json();
};
```

### Getting Classification History

```bash
# Get user's classification history
curl -X GET "http://localhost:3000/api/v1/classify/history?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search classifications
curl -X GET "http://localhost:3000/api/v1/classify/search?q=wine+glass&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get specific classification
curl -X GET "http://localhost:3000/api/v1/classify/42" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Health Check & Status

```bash
# Check API health
curl -X GET http://localhost:3000/api/v1/health

# Get classification service status
curl -X GET http://localhost:3000/api/v1/classify/status

# Response includes:
{
  "service": "Image Classification API",
  "status": "healthy",
  "ollama": {
    "service": { "available": true, "version": "0.1.17" },
    "model": { "available": true, "name": "moondream", "size": "1.7GB" }
  },
  "statistics": {
    "total_classifications": 1247,
    "success_rate": "98.4%",
    "avg_processing_time": "891ms",
    "last_24h": 89
  },
  "capabilities": {
    "supportedFormats": ["JPEG", "PNG", "GIF", "WebP"],
    "inputMethods": ["file upload", "base64 string"],
    "maxImageSize": "10MB",
    "customPrompts": true
  }
}
```

---

## 🔗 Resources

- **[Treblle](https://treblle.com)** - API Observability Platform
- **[Treblle Documentation](https://docs.treblle.com)** - Integration guides and API references
- **[Ollama](https://ollama.com)** - Local AI model runtime
- **[Moondream Model](https://ollama.com/library/moondream)** - Vision-language model
- **[Express.js](https://expressjs.com)** - Web framework documentation
- **[PostgreSQL](https://postgresql.org)** - Database documentation

---

*Built with ❤️ by the Treblle team. This starter kit demonstrates best practices for building production-ready APIs with comprehensive monitoring and AI capabilities.*
