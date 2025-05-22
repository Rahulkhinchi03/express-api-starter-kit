const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'moondream';
    this.timeout = 30000; // 30 seconds timeout
  }

  // Check if Ollama service is available
  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Ollama service check failed:', error.message);
      return false;
    }
  }

  // Check if the specified model is available
  async isModelAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.models) {
        return response.data.models.some(model => 
          model.name.includes(this.model)
        );
      }
      return false;
    } catch (error) {
      console.error('Model availability check failed:', error.message);
      return false;
    }
  }

  // Classify image using Ollama Moondream
  async classifyImage(imageBase64, prompt = "What object is in this image? Provide a brief, descriptive answer.") {
    try {
      // Check service availability first
      const isServiceAvailable = await this.isAvailable();
      if (!isServiceAvailable) {
        throw new Error('Ollama service is not available. Please ensure Ollama is running.');
      }

      // Check model availability
      const isModelReady = await this.isModelAvailable();
      if (!isModelReady) {
        throw new Error(`Model '${this.model}' is not available. Please run: ollama pull ${this.model}`);
      }

      // Prepare the request payload
      const payload = {
        model: this.model,
        prompt: prompt,
        images: [imageBase64],
        stream: false,
        options: {
          temperature: 0.1, // Lower temperature for more consistent results
          top_p: 0.9,
          top_k: 40
        }
      };

      console.log(`Making request to Ollama API: ${this.baseURL}/api/generate`);
      
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 && response.data.response) {
        return {
          success: true,
          classification: response.data.response.trim(),
          model: this.model,
          prompt: prompt,
          processingTime: response.data.total_duration ? 
            Math.round(response.data.total_duration / 1000000) : null // Convert to milliseconds
        };
      } else {
        throw new Error('Invalid response from Ollama API');
      }

    } catch (error) {
      console.error('Ollama classification error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });

      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama service. Please ensure Ollama is running on the specified URL.');
      }

      if (error.code === 'ENOTFOUND') {
        throw new Error('Ollama service URL not found. Please check your OLLAMA_API_URL configuration.');
      }

      if (error.response?.status === 404) {
        throw new Error('Ollama API endpoint not found. Please check your Ollama installation.');
      }

      if (error.code === 'ETIMEDOUT') {
        throw new Error('Request to Ollama service timed out. The image might be too large or complex.');
      }

      // Re-throw the error with additional context
      throw new Error(`Ollama service error: ${error.message}`);
    }
  }

  // Get service status and model information
  async getStatus() {
    try {
      const isAvailable = await this.isAvailable();
      const isModelReady = await this.isModelAvailable();

      return {
        service: {
          available: isAvailable,
          url: this.baseURL
        },
        model: {
          name: this.model,
          available: isModelReady
        },
        configuration: {
          timeout: this.timeout,
          baseURL: this.baseURL
        }
      };
    } catch (error) {
      return {
        service: {
          available: false,
          url: this.baseURL,
          error: error.message
        },
        model: {
          name: this.model,
          available: false
        }
      };
    }
  }
}

module.exports = new OllamaService();