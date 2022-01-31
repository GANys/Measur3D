const rateLimit = require("express-rate-limit");
const basicAuth = require("express-basic-auth");

//-------------------------------------------------------------------------------------

// Limit EVERY ip
// MongoDB could be used to store rate limiter logs also
// Brute force shouldn't be a problem

const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: 1000, // Remaining count is send also
  message: "You have exceeded the 1000 requests in 24 hrs limit!",
  headers: true, // Response will contain remaining time until next accepted request
  skip: (req, res) => {
    if (req.ip === "127.0.0.1") {
      // dev shouldn't be limited. Can be armful if localhost is compromised
      return true;
    }
    return false;
  },
});

//-------------------------------------------------------------------------------------

var auth = basicAuth({
  users: { "ugeom": "supersecret", "ganys": "iamthedev" },
  unauthorizedResponse: getUnauthorizedResponse,
});

function getUnauthorizedResponse(req) {
  console.log(typeof req)
  return req.auth
    ? "Credentials " + req.auth.user + ":" + req.auth.password + " rejected"
    : "No credentials provided";
}

//-------------------------------------------------------------------------------------

module.exports = { auth, rateLimiterUsingThirdParty };
