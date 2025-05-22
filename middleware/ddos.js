const slowDown = require('express-slow-down');

// DDoS protection using express-slow-down
const ddosProtection = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes at full speed
  delayMs: 500, // slow down subsequent requests by 500ms per request
  maxDelayMs: 20000, // maximum delay of 20 seconds
  headers: true, // Send custom rate limit header with limit and remaining
  onLimitReached: (req, res, options) => {
    console.warn(`DDoS protection triggered for IP: ${req.ip}`);
  },
  // Custom error response
  skip: (req, res) => {
    // Skip for health checks
    return req.path === '/health';
  }
});

module.exports = { ddosProtection };