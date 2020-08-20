const rateLimit = require('express-rate-limit');

const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: 1000,
  message: 'You have exceeded the 25 requests in 24 hrs limit!',
  headers: true,
});

module.exports = rateLimiterUsingThirdParty;
