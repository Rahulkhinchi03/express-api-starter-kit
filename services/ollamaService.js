const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'moondream';
    this.timeout = 60000; // 60 seconds
  }

  // Check if Ollama service is available
  async isAvailable() {
    try {
      console.log(`🔍 Checking Ollama service at ${this.baseURL}/api/tags`);
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      console.log(`✅ Ollama service is available, status: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      console.error('❌ Ollama service check failed:', error.message);
      return false;
    }
  }

  // Check if the specified model is available
  async isModelAvailable() {
    try {
      console.log(`🔍 Checking if model '${this.model}' is available`);
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });

      if (response.status === 200 && response.data.models) {
        const modelExists = response.data.models.some(model =>
          model.name.includes(this.model)
        );
        console.log(`${modelExists ? '✅' : '❌'} Model '${this.model}' ${modelExists ? 'found' : 'not found'}`);
        return modelExists;
      }
      return false;
    } catch (error) {
      console.error('❌ Model availability check failed:', error.message);
      return false;
    }
  }

  // Classify image using Ollama Moondream
  async classifyImage(imageBase64, prompt = "What object is in this image? Provide a brief, descriptive answer.") {
    try {
      console.log(`🚀 Starting image classification with model: ${this.model}`);
      console.log(`📝 Prompt: ${prompt}`);
      console.log(`🖼️ Image size: ${Math.round(imageBase64.length / 1024)} KB (base64)`);

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
          temperature: 0.1,
          top_p: 0.9,
          top_k: 40
        }
      };

      console.log(`📡 Making request to Ollama API: ${this.baseURL}/api/generate`);

      const startTime = Date.now();
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

      const processingTime = Date.now() - startTime;
      console.log(`⏱️ Processing time: ${processingTime}ms`);

      // EXTENSIVE DEBUG LOGGING
      console.log('🔍 === RESPONSE DEBUG START ===');
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers, null, 2));
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      console.log('Response.data.response exists?:', 'response' in response.data);
      console.log('Response.data.response value:', response.data.response);
      console.log('Response.data.response type:', typeof response.data.response);
      console.log('All response.data keys:', Object.keys(response.data));
      console.log('🔍 === RESPONSE DEBUG END ===');

      // Check if response exists
      if (!response.data) {
        throw new Error('Empty response from Ollama API');
      }

      if (response.status !== 200) {
        throw new Error(`Ollama API returned status ${response.status}: ${JSON.stringify(response.data)}`);
      }

      // Check for response field with more detailed debugging
      if (!response.data.hasOwnProperty('response')) {
        console.error('❌ Response object structure:', response.data);
        console.error('❌ Available keys:', Object.keys(response.data));
        throw new Error('Ollama API response is missing the "response" field');
      }

      if (response.data.response === undefined || response.data.response === null) {
        console.error('❌ Response field is null/undefined:', response.data.response);
        throw new Error('Ollama API response field is null or undefined');
      }

      const result = {
        success: true,
        classification: String(response.data.response).trim(),
        model: this.model,
        prompt: prompt,
        processingTime: response.data.total_duration ?
          Math.round(response.data.total_duration / 1000000) : processingTime
      };

      console.log(`✅ Classification completed successfully`);
      console.log(`📊 Result: ${result.classification.substring(0, 100)}...`);

      return result;

    } catch (error) {
      console.error('❌ Ollama classification error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack?.split('\n').slice(0, 5)
      });

      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama service. Please ensure Ollama is running.');
      }

      if (error.code === 'ETIMEDOUT') {
        throw new Error('Request to Ollama service timed out. Try with a smaller image.');
      }

      // Re-throw with context
      throw new Error(`Ollama service error: ${error.message}`);
    }
  }

  // Get service status
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