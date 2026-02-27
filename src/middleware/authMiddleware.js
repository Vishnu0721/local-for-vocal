const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
}

module.exports = {
  authenticateJWT,
};

