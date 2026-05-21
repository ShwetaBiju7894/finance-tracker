const jwt = require('jsonwebtoken');

// This middleware runs before any protected route
// It checks the request has a valid token before allowing access

const protect = (req, res, next) => {
  try {
    // Token comes in the header like: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to the request so controllers can use it
    req.user = decoded;

    next(); // token is valid — continue to the route
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token',
    });
  }
};

module.exports = { protect };