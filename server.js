const app = require('./app');

const PORT = process.env.PORT || 3000;

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

const server = app.listen(PORT, () => {
  console.log(`
🚀 Treblle Express Ollama Classifier API is running!

📍 Server: http://localhost:${PORT}
📖 API Info: http://localhost:${PORT}/api/v1
🏥 Health Check: http://localhost:${PORT}/health

🔧 Environment: ${process.env.NODE_ENV || 'development'}
📊 Treblle Monitoring: ${process.env.TREBLLE_API_KEY ? '✅ Enabled' : '❌ Disabled'}

📚 Next steps:
1. Set up your .env file with Treblle credentials
2. Start Ollama with: ollama run moondream
3. Test the API with the provided examples
4. Check your Treblle dashboard for real-time monitoring

Happy coding! 🎉
  `);
});

module.exports = server;