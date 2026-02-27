const { sendResponse } = require('../utils/apiResponse');

function notFound(req, res, next) {
  return sendResponse(res, {
    statusCode: 404,
    success: false,
    message: `Route ${req.originalUrl} not found`,
    data: null,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return sendResponse(res, {
    statusCode,
    success: false,
    message: err.message || 'Internal server error',
    data: null,
  });
}

module.exports = {
  notFound,
  errorHandler,
};

