const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  // Check if Authorization header is present
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Unauthorized request: No authorization header' });
  }

  // Extract the token from "Bearer <token>" format
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized request: Token is missing' });
  }

  try {
    // Verify the token using the secret key
    const payload = jwt.verify(token, 'secretKey'); // Ideally, replace 'secretKey' with process.env.JWT_SECRET

    if (!payload) {
      return res.status(401).json({ message: 'Unauthorized request: Invalid token' });
    }

    // Attach payload (user info) to request object
    req.user = payload;

    // Proceed to next middleware or route handler
    next();
  } catch (err) {
    // Token verification failed (e.g., expired or invalid token)
    return res.status(401).json({ message: 'Unauthorized request: Token verification failed', error: err.message });
  }
}

module.exports = verifyToken;