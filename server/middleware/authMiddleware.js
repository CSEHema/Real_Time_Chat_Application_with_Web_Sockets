const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];

      // CRITICAL: Remove the hardcoded fallback "your_jwt_secret_key" 
      // This ensures that if the .env fails to load, the app errors out 
      // rather than using an insecure default.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the decoded data (which contains 'id') to req.user
      req.user = decoded;
      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ error: "No token, authorization denied" });
  }
};

module.exports = { protect };